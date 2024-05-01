const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const createSendToken = (user, statusCode, res) => {
    const token = user.createJWT()
    const cookieOptions = {
        expiresIn: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    }
    if(process.env.NODE_ENV === 'production') {cookieOptions.secure = true}
    res.cookie('jwt', token, cookieOptions)

    user.password = undefined;
    
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
}

exports.signup = catchAsync(async (req, res, next) => {
    const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
    });

    createSendToken(user, 201, res)
})

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    // Check if email and password exist
    if(!email || !password) {
        return next(new AppError('Please provide an email and password', 400));
    }
    // Check if user exists and password is correct
    const user = await User.findOne({ email }).select('+password');
    if(!user){
        return next(new AppError(`${email} doesn't exist`, 401));
    }
    const isPasswordCorrect = await user.correctPassword(password, user.password)
    if(!isPasswordCorrect) {
        return next(new AppError('Invalid email or password', 401));
    }

    // send token to client
    createSendToken(user, 201, res)
})

exports.protect = catchAsync(async (req, res, next) => {
    let token;
    // Check if token is provided in header
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1]
    }
    if(!token) return next(new AppError('Please provide a valid token', 401))
    
    // Extracts information(id, name) used to create a token 
    const decodedToken = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

    // Check if user still exists
    const currentUser = await User.findById(decodedToken.userId)
    if(!currentUser) return next(new AppError(
        'The user belonging to this token no longer exists', 401))

    // Check if user changed password after the token was issued
    if(currentUser.changedPasswordAfter(decodedToken.iat)) return next(
        new AppError('User recently changed password. Please log in again.', 401))

    // grant access to route
    req.user = currentUser
    next()
})

exports.restrictTo = function(...roles){
    // authorization middleware
    return (req, res, next) => {
        if(!roles.includes(req.user.role)){
            return next(new AppError(
                'You do not have permission to perform this action', 403))
        }
        next();
    }
}

exports.forgetPassword = catchAsync(async (req, res, next) => {
    // Get user based on email from POST request
    const user = await User.findOne({ email: req.body.email });
    if(!user) return next(new AppError(
        'There is no user with that email address', 404))
    
    // Generate random reset token
    const resetToken = user.createPasswordResetToken()
    await user.save();

    // Send email to user with reset tokenuser.
    const resetURL = `${req.protocol}://${req.get('host')}
        /api/v1/users/resetPassword/${resetToken}`
    const message = `Forgot your password? 
        Submit to the following link to reset your password: \n\n ${resetURL}`

    try {
        await sendEmail({
            email: user.email, 
            subject: 'Your Password Reset Token(valid for 10 minutes)', 
            message
        })
    
        res.status(200).json({
            status:'success',
            message: 'Token sent to email!'
        })
    }
    catch(err){
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        return next(new AppError('There was an error sending the email', 500))
    }
})

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on the token
    const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });
    // 2) if a user exist with the reset token, set the new password
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordChangedAt = Date.now();
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Update changedPasswordAt property for the user

    // Log user in, send JWT
    const token = user.createJWT()

    res.status(200).json({
        status: 'success',
        token,
    })
})

exports.updatePassword = catchAsync(async (req, res, next) => {
    // Get user from collection
    const user = await User.findById(req.user.id).select('+password')
    
    // Check if current password is correct
    if(!req.body.currentPassword){
        return next(new AppError('Please Provide the current password.', 401));
    }
    if(!(await user.correctPassword(req.body.currentPassword, user.password))){
        return next(new AppError('Current password is incorrect', 401));
    }

    // If so, update password
    user.password = req.body.newPassword;
    user.passwordConfirm = req.body.newPasswordConfirm;
    user.passwordChangedAt = Date.now();
    await user.save()

    // Log user in, send JWT
    const token = user.createJWT()

    res.status(200).json({
        status:'success',
        token,
    })
})