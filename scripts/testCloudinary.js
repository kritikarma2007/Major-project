require('dotenv').config();
const cloudinary = require('cloudinary').v2;

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_KEY || !process.env.CLOUDINARY_SECRET) {
  console.error('Missing Cloudinary environment variables. Copy .env.example to .env and fill values.');
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

(async () => {
  try {
    console.log('Uploading a sample image to Cloudinary...');
    const result = await cloudinary.uploader.upload('https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
      folder: 'MAJORPROJECT_test'
    });
    console.log('Upload successful. public_id:', result.public_id);

    // Cleanup the test upload
    await cloudinary.uploader.destroy(result.public_id);
    console.log('Test image deleted from Cloudinary.');
    process.exit(0);
  } catch (err) {
    console.error('Cloudinary upload test failed:', err);
    process.exit(1);
  }
})();