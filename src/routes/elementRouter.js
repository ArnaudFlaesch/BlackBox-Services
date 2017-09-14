"use strict";

const express = require("express"),
    Element = require("../model/element"),
    exec = require("child_process").exec,
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

elementRouter.post("/newFile", function(req, res, next) {
    var userId = req.body.userId;
    var elementName = req.body.elementName;
    var path = "./blackbox" + req.body.path;
    Element.findOne( {"path" : path}, function (err, element) {
        if (!err) {
            if (element !== null) {
                if (path === "./blackbox" || (element.owner === userId || element.sharedWithUsers.indexOf(userId)) > -1) {
                    path = (req.body.folderTo !== "") ? path + "/" + req.body.folderTo : path;
                    exec("shx touch " + path + "/" +  elementName, function (error, stdout, stderr) {
                        if (error !== null) {
                            next(error);
                        }
                        else {
                            Element.create({path: path, name: elementName, owner: userId, deleted: false});
                        }
                    });
                }
            }
        }
    });
});

elementRouter.post("/newFolder", function(req, res, next) {
    var userId = req.body.userId;
    var elementName = req.body.elementName;
    var path = "./blackbox" + req.body.path;
    Element.findOne( {"path" : path}, function (err, element) {
        if (!err) {
            if (element !== null) {
                if (path === "./blackbox" || (element.owner === userId || element.sharedWithUsers.indexOf(userId)) > -1) {
                    path = (req.body.folderTo !== "") ? path + "/" + req.body.folderTo : path;
                    exec("shx mkdir " + path + "/" +  elementName, function (error, stdout, stderr) {
                        if (error !== null) {
                            next(error);
                        }
                        else {
                            Element.create({path: path, name: elementName, owner: userId, deleted: false});
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
    if (req.query.path === "" && elementName === "") {
        getSharedFolders(req, res, next);
    }
    else {
        Element.findOne( {$and:[ {"name" : elementName }, {"path" : path} ]}, function (err, element) {
            if (!err) {
                if (element !== null) {
                    if (element.owner === userId || element.sharedWithUsers.indexOf(userId) > -1) {
                        exec("shx ls " + path + "/" + elementName, function (error, stdout, stderr) {
                            if (error !== null) {
                                next(error);
                            }
                            res.send(stdout.split("\n").filter(Boolean));
                        });
                    }
                }
            }
            else {
                next(err);
            }
        });
    }
});

elementRouter.get("/sharedFolders", function (req, res, next) {
    getSharedFolders(req, res, next);
});

function getSharedFolders(req, res, next) {
    var userId = req.query.userId;
    Element.find( {$and: [{$and: [ {$or:[ {"owner" : userId }, {"sharedWithUsers" : userId}]}, {"name": {$ne: userId}} ]}, {"path": "./blackbox"} ]}, function (err, result) {
        if (!err) {
            let folderList = [];
            result.map(function(folder) {
                folderList.push(folder.name);
            });
            res.json(folderList);
        }
        else {
            next(err);
        }
    });
}

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
