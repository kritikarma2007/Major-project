//  const Listing = require("../models/listing.js");
 const express=require("express");
 const router=express.Router();
 const wrapAsync =require("../utils/wrapAsync.js");
 const {listingSchema}=require("../schema.js");
//  const Listing = require("../models/listing.js");
 const{isLoggedIn,isOwner,validateListing, upload} =require("../middleware.js");
 const listingController =require("../controllers/listing.js");


 // index route
 router.get("/", wrapAsync(listingController.index));
  
 // new route
 router.get("/new",isLoggedIn, listingController.renderNewForm);
  // At top, ensure Listing model import
const Listing = require('../models/listing.js');  // Adjust path if needed

// NEW SEARCH ROUTE - ADD BEFORE :id route
router.get('/search', wrapAsync(async (req, res) => {
  const searchQuery = req.query.q?.trim();
  if (!searchQuery) {
    return res.redirect('/listings');
  }
  
  const words = searchQuery.split(/\s+/).filter(w => w.length > 2);
  const searchConditions = words.map(word => ({
    $or: [
      { title: { $regex: word, $options: 'i' } },
      { description: { $regex: word, $options: 'i' } }
    ]
  }));
  
  const allListings = await Listing.find(searchConditions.length ? 
    { $and: searchConditions } : {}
  ).sort({ createdAt: -1 });
  
  res.render('listings/index', { allListings, searchQuery });
}));

// Booking routes (must come before :id route)
router.get('/:id/book', isLoggedIn, wrapAsync(listingController.renderBookForm));
router.post('/:id/book', isLoggedIn, wrapAsync(listingController.createBooking));
// Owner actions on bookings
router.patch('/:id/bookings/:bookingId', isLoggedIn, isOwner, wrapAsync(listingController.updateBookingStatus));
// Booking user actions
router.patch('/:id/bookings/:bookingId/seen', isLoggedIn, wrapAsync(listingController.markBookingSeen));
// Delete booking (owner or requester)
router.delete('/:id/bookings/:bookingId', isLoggedIn, wrapAsync(listingController.deleteBooking));
// Fallback POST route for delete (useful if method-override fails in some environments)
router.post('/:id/bookings/:bookingId/delete', isLoggedIn, wrapAsync(listingController.deleteBooking));

 // ṣhow route
 router.get("/:id", wrapAsync(listingController.showListing)
);
 // create route
 router.post("/",isLoggedIn,
   upload.single('image'),
   validateListing,
   wrapAsync(listingController.createListing)
  );
 // Edit route
 router.get("/:id/edit",isLoggedIn,isOwner,
   wrapAsync(listingController.renderEditForm));

 // update toute
 router.put("/:id",
  isLoggedIn,
  isOwner,
  upload.single('image'),
  validateListing,
    wrapAsync(listingController.updateListing)
  );

 // delete route
 router.delete("/:id", 
  wrapAsync(listingController.destroyListing)
);

 module.exports= router;