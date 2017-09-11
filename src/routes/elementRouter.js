"use strict";

const express = require("express"),
    Element = require("../model/element"),
    exec = require("child_process").exec,
    shellScripts = require("../shellScripts"),
    multer = require("multer");

const elementRouter = express.Router();

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./blackbox/" + req.query.path);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

var upload = multer({ storage: storage }).array("documents");

elementRouter.post("/newFolder", function(req, res, next) {
    var userId = req.query.userId;
    var elementName = req.query.elementName;
    var path = "./blackbox" + req.query.path;

    Element.findOne( {"path" : path}, function (err, element) {
        if (!err) {
            if (element !== null) {
                if (element.owner === userId || element.sharedWithUsers.indexOf(userId) > -1) {
                    exec("shx mkdir " + path + "/" + elementName, function (error, stdout, stderr) {
                        if (error !== null) {
                            console.log('exec error: ' + error);
                        }
                        else {
                            Element.create({path: path + "/" + elementName, name: userId, owner: userId, deleted: false});
                        }
                    });
                }
            }
        }
    });
});

elementRouter.get("/directory", function (req, res, next) {
    var userId = req.query.userId;
    var elementName = req.query.elementName;
    var path = "./blackbox" + req.query.path;
    Element.findOne( {$and:[ {"name" : elementName }, {"path" : path} ]}, function (err, element) {
        if (!err) {
            if (element !== null) {
                if (element.owner === userId || element.sharedWithUsers.indexOf(userId) > -1) {
                    exec("shx ls " + path + "/" + elementName, function (error, stdout, stderr) {
                        res.send(stdout.split("\n").filter(Boolean));
                        if (error !== null) {
                            console.log('exec error: ' + error);
                        }
                    });
                }
            }
        }
    });
});

elementRouter.get("/download", function(req, res, next) {
    var userId = req.query.userId;
    var elementName = req.query.elementName;
    var path = "./blackbox" + req.query.path;
    Element.findOne({ $and:[ {"name" : elementName }, {"path" : path} ]}, function (err, element) {
        if (!err) {
            if (element !== null ){
                if (element.owner === userId || element.sharedWithUsers.indexOf(userId) > -1) {
                    res.sendFile(path + "/" + elementName, { root: "./" });
                }
            }
        }
    });
})

elementRouter.post("/upload", function (req, res, next) {
    upload(req, res, function (err) {
        if (err) {
            return (err);
        }
        req.files.map(function(file) {
            Element.create({path: file.destination, name : file.filename, owner : req.query.userId, deleted: false });
        })
        res.status(204).end();
    });
});


module.exports = elementRouter;
