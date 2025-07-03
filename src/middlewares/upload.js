const multer = require('multer');
const path =require('path')
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../public/logo')); // go 2 levels up to reach /public/images
  },
  filename: function (req, file, cb) {
    console.log(file)
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const uploadImage = multer({ storage: storage });

module.exports=uploadImage
