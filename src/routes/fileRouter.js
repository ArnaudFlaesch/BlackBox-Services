"use strict";

const express = require("express"),
    multer = require("multer"),
    File = require("../model/file");

const fileRouter = express.Router(),
    upload = multer({ dest: "uploads/" }),
    uploadConfig = upload.fields( {name: "documents", maxCount: 8 });

fileRouter.post("/upload", uploadConfig, function (req, res, next) {
    console.log(req.body);
    console.log(req.files);
    res.status(204).end()
})


module.exports = fileRouter;
