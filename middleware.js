 const Listing =require("./models/listing");
 const Review =require("./models/review");
 const {listingSchema,reviewSchema}=require("./schema.js");
 const ExpressError= require("./utils/ExpressError.js");
 const multer = require('multer');
 const { storage } = require('./cloudinary');

 // Multer setup with Cloudinary storage + server-side validation
 const upload = multer({
   storage,
   limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
   fileFilter: (req, file, cb) => {
     // Accept only images
     if (/^image\/(jpe?g|png|gif)$/.test(file.mimetype)) {
       console.log('Multer: accepting file', file.originalname, file.mimetype);
       cb(null, true);
     } else {
       console.warn('Multer: rejecting file', file.originalname, file.mimetype);
       const err = new Error('Only image files are allowed');
       err.statusCode = 400;
       cb(err, false);
     }
   }
 });
 module.exports.upload = upload;
 
 module.exports.isLoggedIn=(req,res,next)=>{
     if(!req.isAuthenticated()){
        req.session.redirectUrl =req.originalUrl;
    req.flash("error","you must be locked in to create listing !");
     return res.redirect("/login");
  }
  next();
 };

 module.exports.saveRedirectUrl =(req,res,next)=>{
    if( req.session.redirectUrl){
        res.locals.redirectUrl=req.session.redirectUrl;
    }
    next();
 };

 module.exports.isOwner = async (req, res, next) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash('error', 'Listing not found');
    return res.redirect('/listings');
  }
  // listing.owner may be an ObjectId or populated document
  const ownerId = listing.owner && listing.owner._id ? listing.owner._id : listing.owner;
  const currUserId = res.locals.currUser && res.locals.currUser._id ? res.locals.currUser._id : res.locals.currUser;
  if (!ownerId || !currUserId || String(ownerId) !== String(currUserId)) {
    req.flash('error', 'You are not the owner of this listing!');
    return res.redirect(`/listings/${id}`);
  }
  next();
};

 module.exports.validateListing =(req,res,next)=>{
 let {error}=listingSchema.validate(req.body);
  if(error){
    let errMsg=error.details.map((el)=>el.message).join(",");
   throw new ExpressError(400, errMsg);
  }else{
   next();
  }
 };

 module.exports.validateReview =(req,res,next)=>{
 let {error}=reviewSchema.validate(req.body);
  if(error){
   let errMsg=error.details.map((el)=>el.message).join(",");
   throw new ExpressError(400, errMsg);
  }else{
   next();
  }
 }


 module.exports.isReviewAuthor=async(req,res,next)=>{
       let{id,reviewId}=req.params;
       let review=await Review.findById(reviewId);
       if(!review || !res.locals.currUser) {
         req.flash("error","Unauthorized action");
         return res.redirect(`/listings/${id}`);
       }
       if(String(review.author) !== String(res.locals.currUser._id)){
         req.flash("error","You are not the author of this review!");
         return res.redirect(`/listings/${id}`);
       }
       next();
 };