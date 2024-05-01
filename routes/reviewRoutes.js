const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);
// router.param('id', tourController.checkID);

// POST /tour/id/reviews
// POST/reviews

// POST /tour/234afsadf/reviews
// GET /tour/234afsadf/reviews
router.route('/')
.get(reviewController.getAllReviews)
.post(authController.restrictTo('user'), reviewController.createReview);

router.route('/:id')
.get(reviewController.getReview)
.delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview);

module.exports = router;