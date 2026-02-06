require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('../models/listing');
const listingController = require('../controllers/listing');

async function main(){
  await mongoose.connect('mongodb://127.0.0.1:27017/mydatabase');
  console.log('Connected to DB for simulation');

  const req = {
    body: {
      listing: {
        title: 'Simulated Test Listing',
        description: 'This is a test created by simulateCreateListing script',
        price: 100,
        location: 'Test City',
        country: 'Testland'
      }
    },
    file: {
      filename: 'MAJORPROJECT_test/simulatedfile',
      path: 'https://res.cloudinary.com/demo/image/upload/sample.jpg'
    },
    user: { _id: new mongoose.Types.ObjectId() },
    flash: (type, msg) => console.log('FLASH', type, msg)
  };

  const res = {
    redirect: (url) => { console.log('Redirected to', url); },
    status: (code) => ({ send: (msg) => console.log('Response status', code, msg) }),
    render: (view, obj) => console.log('Render', view, obj)
  };

  const next = (err) => { if(err) console.error('Next called with error:', err); else console.log('Next called without error'); };

  try{
    console.log('Calling createListing...');
    await listingController.createListing(req, res, next);
    console.log('createListing completed');

    // find and remove the created listing to clean up
    const l = await Listing.findOne({ title: 'Simulated Test Listing' });
    if(l){
      console.log('Found created listing, removing as cleanup:', l._id.toString());
      await Listing.findByIdAndDelete(l._id);
    } else {
      console.warn('Created listing not found for cleanup');
    }
  }catch(e){
    console.error('Exception during simulateCreateListing:', e);
  }finally{
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

main();