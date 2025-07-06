var commonDbFuncs = require("../utils/commonDbFuncs");
const fs = require('fs');
const path = require('path');
const config = require('../../config');
var _ = require('lodash');
var cloudinary = require('cloudinary');


exports.getMediaAssetFromCloudinary = async function (req, res, next) {
    // #swagger.tags = ['Media']	
    // #swagger.summary = '(P) -> get all assets from cloudinary'
    try {
        let gameSettings = commonDbFuncs.getGameSettings();

        cloudinary.config({
            cloud_name: gameSettings.cloudinaryCloudName || config.CLOUDINARY_CLOUDNAME,
            api_key: gameSettings.cloudinaryApiKey || config.CLOUDINARY_APIKEY,
            api_secret: gameSettings.cloudinaryApiSecret || config.CLOUDINARY_APISECRET,
            secure: true
        });

        let result = await cloudinary.v2.search
            //			.expression('resource_type:image')
            .sort_by('public_id', 'asc')
            .max_results(500)
            .execute();

        let imagesList = [];
        result.resources.forEach(image => {
            let obj = {
                asset_id: image.asset_id,
                public_id: image.public_id,
                filename: image.filename || image.original_filename,
                format: image.format,
                resource_type: image.resource_type,
                url: image.url,
                secure_url: image.secure_url
            };
            imagesList.push(obj);
        });
        return res.status(200).json({
            success: true,
            imagesList: imagesList
        });

    } catch (ex) {
        config.logger.error({ ex }, 'Error in mediaController->getMediaAssetFromCloudinary');
        commonDbFuncs.createApplicationLog(req.user?._id, "mediaController->getMediaAssetFromCloudinary", JSON.stringify({ userId: req.user?._id }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.uploadImageFileIntoCloudinary = async function (req, res, next) {
    // #swagger.tags = ['Media']
    // #swagger.summary = '(C) -> upload image file into cloudinary'
    try {
        if (!req.file?.path === '') {
            return res.status(400).json({ success: false, message: "File is missing" });
        }

        let gameSettings = commonDbFuncs.getGameSettings();

        cloudinary.config({
            cloud_name: gameSettings.cloudinaryCloudName || config.CLOUDINARY_CLOUDNAME,
            api_key: gameSettings.cloudinaryApiKey || config.CLOUDINARY_APIKEY,
            api_secret: gameSettings.cloudinaryApiSecret || config.CLOUDINARY_APISECRET,
            secure: true
        });

        let options = {
            use_filename: true,
            unique_filename: false,
            overwrite: true,
        };

        let image = await cloudinary.v2.uploader.upload(req.file.path, options);

        let obj = {
            asset_id: image.asset_id,
            public_id: image.public_id,
            filename: image.filename || image.original_filename,
            format: image.format,
            resource_type: image.resource_type,
            url: image.url,
            secure_url: image.secure_url
        };

        return res.status(200).json({
            success: true,
            uploadedFile: obj
        });

    } catch (ex) {
        config.logger.error({ ex }, 'Error in mediaController->uploadImageFileIntoCloudinary');
        commonDbFuncs.createApplicationLog(req.user?._id, "mediaController->uploadImageFileIntoCloudinary", JSON.stringify({ userId: req.user?._id }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.deleteCloudinaryImageByPublicId = async function (req, res, next) {
    // #swagger.tags = ['Media']
    // #swagger.summary = '(C) -> delete image file from cloudinary by publicId'
    let publicId = req.params.publicId || '';
    try {
        if (!publicId) {
            return res.status(400).json({ success: false, message: "publicId is required" });
        }

        let gameSettings = commonDbFuncs.getGameSettings();

        cloudinary.config({
            cloud_name: gameSettings.cloudinaryCloudName || config.CLOUDINARY_CLOUDNAME,
            api_key: gameSettings.cloudinaryApiKey || config.CLOUDINARY_APIKEY,
            api_secret: gameSettings.cloudinaryApiSecret || config.CLOUDINARY_APISECRET,
            secure: true
        });

        let result = await cloudinary.v2.uploader.destroy(publicId);

        return res.status(200).json({
            success: true,
            isDeleted: true,
            deletedFile: result
        });

    } catch (ex) {
        config.logger.error({ ex }, 'Error in mediaController->deleteCloudinaryImageByPublicId');
        commonDbFuncs.createApplicationLog(req.user?._id, "mediaController->deleteCloudinaryImageByPublicId", JSON.stringify({ userId: req.user?._id, publicId }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.deleteAllImageFilesFromUploadsFolder = async function (req, res, next) {
    // #swagger.tags = ['Media']
    // #swagger.summary = '(S) -> delete files from local folder uploads'
    try {
        let files = await fs.readdir("uploads");

        if (files.length === 0) {
            return res.status(200).json({ success: true, message: "0 files removed" });
        }
        else {
            for (const file of files) {
                let deleted = await fs.unlink(path.join("uploads", file));
                if (deleted) {
                    // file removed...
                }
                else {
                    return res.status(400).json({ success: false, message: err });
                }
            }
            return res.status(200).json({ success: true, message: files.length + " files removed" });
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in mediaController->deleteAllImageFilesFromUploadsFolder');
        commonDbFuncs.createApplicationLog(req.user?._id, "mediaController->deleteAllImageFilesFromUploadsFolder", JSON.stringify({ userId: req.user?._id, publicId }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}
