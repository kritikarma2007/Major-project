 const  mongoose= require("mongoose");
 const initData = require("./data.js")
 const Listing =require("../models/listing.js");

 main().then(()=>{
     console.log("connected to db");
 }).catch((err)=>{
     console.log(err);
 });
 
 async function main(){
     await mongoose.connect("mongodb://127.0.0.1:27017/mydatabase");
 }
 
//  const initDB=async()=>{
//     await Listing.deleteMany({});
//     initData.data.map((obj)=>({...obj,owner:'69511498e6622a40e1825753'}));
//     await Listing.insertMany(initData.data);
//     console.log("data was initilized");
//  }
const initDB = async () => {
    await Listing.deleteMany({});

    // Correctly add owner to each object
    const dataWithOwner = initData.data.map(obj => ({
        ...obj,
        owner: '69511498e6622a40e1825753' // Make sure this is a valid User _id
    }));

    await Listing.insertMany(dataWithOwner);
    console.log("Data was initialized with owner!");
}



 initDB();