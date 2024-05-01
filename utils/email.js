const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Create a transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
        
        // Activate in Gmail
    })
    
    // Define email options
    const mailOptions = {
        from: 'Nate Oh <nate@jonas.io>',
        to: options.email,
        subject: options.subject,
        text: options.message
    }

    // Send mail with defined transport object
    await transporter.sendMail(mailOptions)
}

module.exports = sendEmail;