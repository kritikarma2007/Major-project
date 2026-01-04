//  const mongoose = require("mongoose");
//  const Schema  =mongoose.Schema;

//  const listingSchema =new Schema({
//     title :{
//         type:String,
//         required:true
//     },
//     description :String,
//     image:{
//         type:String,
//         set:(V)=> v===""? "default link":V,
//     },
//     price: Number,
//     location :String,
//     country:String,
//  });

//  const Listing =mongoose.model("Listing",listingSchema);
// module.exports =Listing;




// ...existing code...
const { ref } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review=require("./review.js");
const user = require("./user.js");

const listingSchema = new Schema({
    title: { type: String, required: true },
    description: String,
    image: {
        // type: String,
        // set: (v) => v === "" ? "default link" : v,
         filename: String,
        url: { type: String, default: "default link" },
    },
    price: Number,
    location: String,
    country: String,
    reviews:[
        { 
           type : Schema.Types.ObjectId,
           ref:"Review",
        },
    ],
    // Bookings as subdocuments so owner can see requests
    bookings: [
      {
        name: String,
        contact: String,
        from: Date,
        to: Date,
        user: { type: Schema.Types.ObjectId, ref: 'user' },
        status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
        approvedAt: Date,
        userMessage: String,
        userMessageShown: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    owner:{
        type :Schema.Types.ObjectId,
        ref:"user",

    }
});
listingSchema.post("findOneAndDelete",async(listing)=>{
    if(listing){ 
    await Review.deleteMany({ _id:{ $in: listing.reviews}})
}})


const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
// ...existing code...