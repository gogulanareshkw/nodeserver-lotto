const express = require('express');
const multer = require('multer');
const apiRouter = express.Router({ mergeParams: true });
var mediaController = require('../controllers/media');
const superAdminAuth = require("../middlewares/superAdminAuth");
const commonAdminAuth = require("../middlewares/commonAdminAuth");
const publicAuth = require("../middlewares/publicAuth");

const storage = multer.diskStorage({
    destination: './uploads',
    filename: function (req, file, callback) {
        callback(null, file.originalname.split(' ').join('-'));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
            cb(null, true);
        } else {
            cb(null, false);
            return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
        }
    }
});

apiRouter
    .get('/public/assets', publicAuth, mediaController.getMediaAssetFromCloudinary)
    .post('/upload', commonAdminAuth, upload.single('uploaded_file'), mediaController.uploadImageFileIntoCloudinary)
    .delete('/delete/:publicId', commonAdminAuth, mediaController.deleteCloudinaryImageByPublicId)
    .delete('/localdelete', superAdminAuth, mediaController.deleteAllImageFilesFromUploadsFolder)

module.exports = apiRouter;