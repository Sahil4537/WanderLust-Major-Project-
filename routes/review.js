const express = require("express");
const router = express.Router({mergeParams: true});
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("../schema.js");
const Review = require("../models/review.js");
const Listing = require("../models/listing.js");



const validateReview = (req, res, next) => {
  let {error} = reviewSchema.validate(req.body);  //yeh line schema validate krri gi with the help of joi.
  if(error) {  //joi ne individual fields k upr validation error apply krdia.
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(404, errMsg);
  } else {
    next();
  }
};

//Review Route
router.post("/",validateReview,
  wrapAsync( async(req, res) => {
  let listing = await Listing.findById(req.params.id);
  let newReview = new Review(req.body.review);

  listing.reviews.push(newReview);

  await newReview.save();
  await listing.save();
  req.flash("success", "New Review Created!");

  res.redirect(`/listings/${listing._id}`);
}));

//Delete Review Route
router.delete(
  "/:reviewId",
  wrapAsync(async (req, res) => {
    let {id, reviewId} = req.params;

    await Listing.findByIdAndUpdate(id, {$pull: {review: reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Review Deleted!");

    res.redirect(`/listings/${id}`);
  })
)

module.exports = router;