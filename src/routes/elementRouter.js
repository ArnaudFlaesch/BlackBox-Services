"use strict";

const express = require("express"),
    Element = require("../model/element"),
    exec = require("child_process").exec,
    multer = require("multer");

const elementRouter = express.Router();

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "/blackbox" + req.params.path);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

var upload = multer({ storage: storage }).array("documents");

elementRouter.get("/directory", function (req, res, next) {
    var userId = req.query.userId;
    var elementName = req.query.elementName;
    var path = "/blackbox/" + req.query.path;

    Element.findOne({ $and:[ {"name" : elementName }, {"path" : path} ]}, function (err, element) {
        if (!err) {
            if (element !== null ){
                if (element.owner === userId || element.sharedWithUsers.indexOf(userId) > -1) {
                    exec("shx ls " + path + "/" + elementName, function (error, stdout, stderr) {
                        res.send(stdout.split("\n"));
                        if (error !== null) {
                            console.log('exec error: ' + error);
                        }
                    });
                }
            }
        }
    });
});

elementRouter.post("/upload", function (req, res, next) {
    upload(req, res, function (err) {
        if (err) {
            return (err);
        }
        res.status(204).end();
    });
});


module.exports = elementRouter;
