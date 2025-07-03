const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const {isLoggedIn, isOwner, validateListing} = require("../middleware.js");
const listingController = require("../controller/listings.js");
const multer  = require('multer');
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage });

router.route("/")
  .get( wrapAsync(listingController.index)) //Index route
  .post( isLoggedIn, //phale listing aaygi. //Create route
  upload.single("listing[image]"),
  validateListing,     //then first usko validate krra jaega
  wrapAsync(listingController.createListing));
 

//New Route
router.get("/new",isLoggedIn, listingController.renderNewForm);

router.route("/:id")
    .get( wrapAsync(listingController.showListing)) //Show route
    .put( isLoggedIn, isOwner,     //Update route
    upload.single("listing[image]"),
    validateListing,  //listing aane pr phale vlaidate hongi cheje
    wrapAsync(listingController.updateListing))
    .delete(isLoggedIn,isOwner, wrapAsync(listingController.destroyListing));  //Delete route



//Edit Route
router.get("/:id/edit",isLoggedIn,isOwner, wrapAsync(listingController.renderEditForm));

module.exports = router;


