const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dnsstej2v',
  api_key: '129194194858512',
  api_secret: 'k0FQlU63izeHM190r9mRdLsQ1tI',
});

module.exports = cloudinary;
