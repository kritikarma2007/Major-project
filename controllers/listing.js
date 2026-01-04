 const Listing =require("../models/listing");
const {listingSchema}=require("../schema.js");
const { cloudinary } = require('../cloudinary');
const ExpressError = require('../utils/ExpressError');
 module.exports.index= async(req,res)=>{
      try {
     const allListings = await Listing.find({});
     // res.json(allListings);
      res.render("listings/index.ejs",{allListings});
       } catch (err) {
   res.status(500).send(err.message);
  }
 };

 module.exports.renderNewForm=(req,res)=>{
    res.render("listings/new.ejs");
 };


 module.exports.showListing=async(req,res)=>{
      let{id} =req.params;
      const listing=await Listing.findById(id).populate({path:"reviews",populate:{path:"author",},}).populate("owner");
      if(!listing){
       req.flash("error","  Listing you requested does not exist!");
       res.redirect( "/listings")
      }
      console.log(listing);
      res.render("listings/show.ejs",{listing});
  };

  // Render booking form
  module.exports.renderBookForm = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash('error', 'Listing not found');
      return res.redirect('/listings');
    }
    res.render('listings/book.ejs', { listing });
  };

  // Handle booking submission
  module.exports.createBooking = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate('owner');
    if (!listing) {
      req.flash('error', 'Listing not found');
      return res.redirect('/listings');
    }

    try {
      const b = req.body.booking || {};
      // Basic validation
      if (!b.name || !b.contact || !b.from || !b.to) {
        req.flash('error', 'Please fill all required fields');
        return res.redirect(`/listings/${id}/book`);
      }
      const fromDate = new Date(b.from);
      const toDate = new Date(b.to);
      if (isNaN(fromDate) || isNaN(toDate) || fromDate > toDate) {
        req.flash('error', 'Please provide valid from and to dates');
        return res.redirect(`/listings/${id}/book`);
      }

      const booking = {
        name: b.name,
        contact: b.contact,
        from: fromDate,
        to: toDate,
        user: req.user ? req.user._id : undefined,
        status: 'pending',
        userMessage: null,
        userMessageShown: false
      };

      listing.bookings = listing.bookings || [];
      listing.bookings.push(booking);
      await listing.save();

      // Flash message for requester (keeps 'Booked' wording as requested)
      req.flash('success', 'Booked');
      return res.redirect(`/listings/${id}`);
    } catch (err) {
      console.error('createBooking error:', err);
      req.flash('error', 'Failed to create booking. Please try again.');
      return res.redirect('back');
    }
  };

  // Update booking status (approve/reject) - owner only
  module.exports.updateBookingStatus = async (req, res) => {
    const { id, bookingId } = req.params;
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      req.flash('error', 'Invalid booking status');
      return res.redirect(`/listings/${id}`);
    }
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash('error', 'Listing not found');
      return res.redirect('/listings');
    }
    const booking = listing.bookings.id(bookingId);
    if (!booking) {
      req.flash('error', 'Booking not found');
      return res.redirect(`/listings/${id}`);
    }
    booking.status = status;
    if (status === 'approved') booking.approvedAt = new Date();
    // Set a message for the requesting user to see next time they visit
    if (status === 'approved') {
      booking.userMessage = `Your booking from ${new Date(booking.from).toLocaleDateString()} to ${new Date(booking.to).toLocaleDateString()} has been approved.`;
    } else if (status === 'rejected') {
      booking.userMessage = `Your booking from ${new Date(booking.from).toLocaleDateString()} to ${new Date(booking.to).toLocaleDateString()} has been rejected.`;
    } else {
      booking.userMessage = null;
    }
    booking.userMessageShown = false;
    await listing.save();
    req.flash('success', `Booking ${status}.`);
    return res.redirect(`/listings/${id}`);
  };

  // Delete a booking (owner or booking requester can delete)
  module.exports.deleteBooking = async (req, res) => {
    const { id, bookingId } = req.params;
    console.log('deleteBooking called:', req.method, req.originalUrl, 'body:', req.body);
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash('error', 'Listing not found');
      return res.redirect('/listings');
    }
    const booking = listing.bookings.id(bookingId);
    if (!booking) {
      req.flash('error', 'Booking not found');
      return res.redirect(`/listings/${id}`);
    }
    const isOwner = String(listing.owner && listing.owner._id ? listing.owner._id : listing.owner) === String(req.user && req.user._id);
    const isBookingUser = booking.user && String(booking.user) === String(req.user && req.user._id);
    if (!isOwner && !isBookingUser) {
      req.flash('error', 'You are not authorized to delete this booking.');
      return res.redirect(`/listings/${id}`);
    }

    // Remove booking and save
    try {
      if (typeof listing.bookings.pull === 'function') {
        listing.bookings.pull(booking._id);
      } else {
        listing.bookings = listing.bookings.filter(b => String(b._id) !== String(bookingId));
      }
      await listing.save();
      req.flash('success', 'Booking deleted.');
      return res.redirect(`/listings/${id}`);
    } catch (err) {
      console.error('Error deleting booking:', err);
      req.flash('error', 'Failed to delete booking. Please try again.');
      return res.redirect('back');
    }
  }; 

  module.exports.createListing=async (req, res, next) => {
    // DEBUG: log incoming form and file to trace errors
    console.log('createListing called. user:', req.user && req.user._id);
    console.log('createListing - req.file:', req.file);
    console.log('createListing - req.body:', JSON.stringify(req.body).slice(0, 1000));

    let result = listingSchema.validate(req.body);
    if (result.error) {
      const msg = result.error.details.map(el => el.message).join(',');
      console.warn('Validation failed:', msg);
      req.flash('error', msg);
      return res.redirect('back');
    }

    const data = req.body.listing;
    if (req.file) {
      data.image = {
        filename: req.file.filename,
        url: req.file.path || req.file.secure_url || req.file.url
      };
    } else if (typeof data.image === 'string' && data.image.trim() !== '') {
      data.image = {
        filename: 'listingimage',
        url: data.image
      };
    }

    try {
      const newListing = new Listing(data);
      newListing.owner = req.user._id;
      await newListing.save();
      req.flash('success', 'New Listing Created!');
      return res.redirect('/listings');
    } catch (err) {
      console.error('Error creating listing:', err);
      // If an image was uploaded to Cloudinary but DB save failed, attempt to remove uploaded image
      if (req.file && req.file.filename) {
        try {
          await cloudinary.uploader.destroy(req.file.filename);
          console.log('Rolled back uploaded image:', req.file.filename);
        } catch (cleanupErr) {
          console.error('Cleanup failed:', cleanupErr);
        }
      }
      req.flash('error', 'Failed to create listing. Please try again.');
      return res.redirect('back');
    }
  };

   module.exports.renderEditForm=async(req,res)=>{
        let{id} =req.params;
        const listing =await Listing.findById(id);
        if(!listing){
         req.flash("error","  Listing you requested does not exist!");
         res.redirect( "/listings")
        }
        res.render("listings/edit.ejs",{listing});
    };

    module.exports.updateListing=async (req, res) => {
       const { id } = req.params;
       const data = req.body.listing;

       const listing = await Listing.findById(id);
       if(!listing){
         req.flash("error","Listing not found");
         return res.redirect('/listings');
       }

          // If a new file was uploaded, delete the old file from Cloudinary and set new image data
       if (req.file) {
         try {
           if (listing.image && listing.image.filename) {
             await cloudinary.uploader.destroy(listing.image.filename);
           }
         } catch (err) {
           console.error('Error deleting old cloudinary image:', err.message);
           // continue - do not block update for cleanup failures
         }
         data.image = {
           filename: req.file.filename,
           url: req.file.path || req.file.secure_url || req.file.url
         };
       }

       try {
         await Listing.findByIdAndUpdate(id, data, {
           runValidators: true
         });
         req.flash('success', 'Listing Updated!');
         return res.redirect(`/listings/${id}`);
       } catch (err) {
         console.error('Error updating listing:', err);
         // If new file was uploaded but DB update failed, try to delete the new upload to avoid orphaned images
         if (req.file && req.file.filename) {
           try {
             await cloudinary.uploader.destroy(req.file.filename);
           } catch (cleanupErr) {
             console.error('Cleanup failed for new upload:', cleanupErr);
           }
         }
         req.flash('error', 'Failed to update listing. Please try again.');
         return res.redirect('back');
       }
     };


     module.exports.destroyListing=async(req,res)=>{
     let{id}=req.params;
     const listing = await Listing.findById(id);
     if(listing && listing.image && listing.image.filename){
       try{
         await cloudinary.uploader.destroy(listing.image.filename);
       }catch(err){
         console.error('Error deleting cloudinary image:', err.message);
         // continue, still attempt to delete listing in DB
       }
     }
     try{
       await Listing.findByIdAndDelete(id);
       req.flash('success','Listing Deleted!');
       return res.redirect('/listings');
     }catch(err){
       console.error('Error deleting listing:', err);
       req.flash('error','Failed to delete listing. Please try again.');
       return res.redirect('back');
     }
 };