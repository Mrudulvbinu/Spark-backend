const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Force HTTPS
});

// Set up storage engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hackathon_proposals',
    resource_type: 'auto', // Let Cloudinary detect the resource type
    allowed_formats: ['pdf'],
    format: async (req, file) => 'pdf', // Force PDF format
    public_id: (req, file) => {
      const name = file.originalname.split('.')[0];
      return `${name}_${Date.now()}`;
    }
  }
});

module.exports = {
  cloudinary,
  storage
};