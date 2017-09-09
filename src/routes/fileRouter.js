"use strict";

const express = require("express"),
    File = require("../model/file"),
    multer = require("multer");

const fileRouter = express.Router();

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "/uploads")
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

var upload = multer({ storage: storage }).array("documents");

fileRouter.post("/upload", function (req, res, next) {
    console.log(req.query.path);
    upload(req, res, function (err) {
        if (err) {
            return (err);
        }
        res.status(204).end();
    });
})


module.exports = fileRouter;
