"use strict";

const Element = require("../model/element"),
    exec = require("child_process").exec,
    express = require("express"),
    elementRouter = express.Router(),
    fs = require("fs"),
    getSize = require("get-folder-size"),
    log = require("winston"),
    multer = require("multer"),
    storage = multer.diskStorage({
        "destination": function (req, file, cb) {
            cb(null, "./blackbox/" + req.query.path);
        },
        "filename": function (req, file, cb) {
            cb(null, file.originalname);
        }
    }),
    upload = multer({"storage": storage }).array("documents");

elementRouter.post("/newFile", function (req, res, next) {
    const elementName = req.body.elementName,
        userId = req.body.userId;
    let path = "./blackbox" + req.body.path;
    Element.findOne({"path": path}, function (err, element) {
        if (!err) {
            if (element !== null) {
                if (path === "./blackbox" || (element.owner === userId || element.sharedWithUsers.indexOf(userId)) > -1) {
                    path = (req.body.folderTo !== "") ? path + "/" + req.body.folderTo : path;
                    fs.open(path + "/" + elementName, "wx", function (err, fd) {
                        if (err) {
                            next(new Error("Un fichier du même nom existe déjà !"));
                        } else {
                            Element.create({"path": path, "name": elementName, "owner": userId, "deleted": false, "sharedWithUsers": element.sharedWithUsers});
                            fs.close(fd, function (err) {
                                if (err) {
                                    next(err);
                                }
                            });
                        }
                    });
                }
            }
        }
    });
});

elementRouter.post("/newFolder", function (req, res, next) {
    const elementName = req.body.elementName,
        userId = req.body.userId;
    let path = "./blackbox" + req.body.path;
    Element.findOne({"path": path}, function (err, element) {
        if (!err) {
            if (element !== null) {
                if (path === "./blackbox" || (element.owner === userId || element.sharedWithUsers.indexOf(userId)) > -1) {
                    path = (req.body.folderTo !== "") ? path + "/" + req.body.folderTo : path;
                    exec("shx mkdir " + path + "/" + elementName, function (error, stdout, stderr) {
                        if (error !== null) {
                            next(new Error("Un dossier du même nom existe déjà !"));
                        } else {
                            let elementToCreate = {"path": path, "name": elementName, "owner": userId, "deleted": false, "sharedWithUsers": element.sharedWithUsers};
                            Element.create(elementToCreate);
                        }
                    });
                }
            }
        }
    });
});

elementRouter.get("/getUserSpace", function (req, res, next) {
    getSize("./blackbox/59ba45a747ee3218100b7c92", function (err, size) {
        if (err) {
            next(err);
        }
        log.info(size + " bytes");
        log.info((size / 1024 / 1024).toFixed(2) + " Mb");
    });
});

function getSharedFolders (req, res, next) {
    const userId = req.query.userId;
    Element.find({"$and": [{"$and": [{"$or": [{"owner": userId }, {"sharedWithUsers": userId}]}, {"name": {"$ne": userId}}]}, {"path": "./blackbox"}]}, function (err, folders) {
        if (!err) {
            let folderList = [];
            folders.map(function (folder) {
                folderList.push(folder.name);
            });
            res.json(folderList);
        } else {
            next(err);
        }
    });
}

elementRouter.get("/directory", function (req, res, next) {
    const elementName = req.query.elementName,
        userId = req.query.userId;
    let path = "./blackbox" + req.query.path;
    if (req.query.path === "" && elementName === "") {
        getSharedFolders(req, res, next);
    } else {
        Element.findOne({"$and": [{"name": elementName}, {"path": path}]}, function (err, element) {
            if (!err) {
                if (element !== null) {
                    if (element.owner === userId || element.sharedWithUsers.indexOf(userId) > -1) {
                        exec("shx ls " + path + "/" + elementName, function (error, stdout, stderr) {
                            if (error !== null) {
                                next(new Error("Impossible d'accéder à ce répertoire !"));
                            }
                            res.send(stdout.split("\n").filter(Boolean));
                        });
                    }
                }
            } else {
                next(err);
            }
        });
    }
});

elementRouter.get("/sharedFolders", function (req, res, next) {
    getSharedFolders(req, res, next);
});

elementRouter.get("/download", function (req, res, next) {
    const elementName = req.query.elementName,
        userId = req.query.userId;
    let path = "./blackbox" + req.query.path;
    Element.findOne({"$and": [{"name": elementName}, {"path": path}]}, function (error, element) {
        if (!error) {
            if (element !== null) {
                if (element.owner === userId || element.sharedWithUsers.indexOf(userId) > -1) {
                    res.sendFile(path + "/" + elementName, {"root": "./" });
                }
            }
        }
        else {
            next(error)
        }
    });
});

elementRouter.post("/upload", function (req, res, next) {
    upload(req, res, function (err) {
        if (err) {
            next(err);
        }
        let splittedPath = req.query.path.split("/"),
            elementName = splittedPath[splittedPath.length - 1];
        splittedPath.pop();
        let path = "./blackbox" + Array.prototype.join.call(splittedPath, "/");

        Element.findOne({"$and": [{"name": elementName}, {"path": path}]}, function (error, element) {
            if (!error) {
                if (element !== null) {
                    req.files.map(function (file) {
                        Element.create({"path": file.destination.replace("//", "/"), "name": file.filename, "owner": req.query.userId, "deleted": false, "sharedWithUsers": element.sharedWithUsers });
                    });
                    res.status(204).end();
                }
            } else {
                next(error)
            }
        });
    });
});

elementRouter.get("/listOfSharedUsers", function (req, res, next) {
    const elementName = req.query.elementName,
        userId = req.query.userId;
    let path = "./blackbox" + req.body.path;
    Element.findOne({"$and": [{"name": elementName}, {"path": path}]}, function (error, element) {
        if (!error) {
            if (element !== null) {
                if (element.owner === userId || element.sharedWithUsers.indexOf(userId) > -1) {
                    res.send(element.sharedWithUsers);
                }
            }
        } else {
            next(error);
        }
    });
});

elementRouter.get("/saveSharedUser", function (req, res, next) {
    const elementName = req.body.elementName,
        userId = req.body.userId;
    let path = "./blackbox" + req.body.path;
    Element.findOne({"$and": [{"name": elementName}, {"path": path}]}, function (error, element) {
        if (!error) {
            if (element !== null) {
                if (element.owner === userId || element.sharedWithUsers.indexOf(userId) > -1) {
                    if (req.body.sharedUserId) {

                    }
                    //let sharedUserInfo = element.sharedWithUsers.
                }
            }
        } else {
            next(error);
        }
    });
});

elementRouter.delete("/deleteSharedUser", function (req, res, next) {
    const elementName = req.query.elementName,
        userId = req.query.userId;
    let path = "./blackbox" + req.query.path;
    Element.findOne({"$and": [{"name": elementName}, {"path": path}]}, function (error, element) {
        if (!error) {
            if (element !== null) {
                if (element.owner === userId || element.sharedWithUsers.indexOf(userId) > -1) {

                }
            }
        } else {
            next(error);
        }
    });
});

elementRouter.post("/renameElement", function (req, res, next) {
    const elementName = req.body.elementName,
        newElementName = req.body.newElementName,
        userId = req.body.userId;
    let path = "./blackbox" + req.body.path;
    Element.find({"path": {"$regex": path + "/" + elementName + '.*' }}, function (err, elements) {
        if (!err) {
            if (elements.length > 0) {
                elements.map(function (element) {
                    if (element.owner === userId || element.sharedWithUsers.indexOf(userId) > -1) {
                        //element.path = path + "/" + newElementName + element.path.substr(0, path + "/" + elementName.length) + path;
                        log.info(element.path);
                        log.info(path + "/" + elementName);
                        log.info(path + "/" + newElementName);
                        log.info("");
                    }
                });
            }
        }
    });
    Element.findOne({"$and": [{"name": elementName}, {"path": path}]}, function (error, element) {
        if (!error) {
            if (element !== null) {
                if (element.owner === userId || element.sharedWithUsers.indexOf(userId) > -1) {
                    element.name = newElementName;
                    element.save(function (err) {
                        if (err) {
                            next(err);
                        }
                        exec("cd " + path + " && shx mv " + elementName + " " + newElementName, null);
                    });
                }
            }
        } else {
            next(error);
        }
    });
});

elementRouter.delete("/deleteElement", function (req, res, next) {
    const elementName = req.query.elementName,
        userId = req.query.userId;
    let path = "./blackbox" + req.query.path;
    Element.findOne({"$and": [{"name": elementName}, {"path": path}]}, function (err, element) {
        if (!err) {
            if (element !== null) {
                if (element.owner === userId || element.sharedWithUsers.indexOf(userId) > -1) {
                    Element.remove({"$or": [{"name": elementName, "path": path}, {"path": path + "/" + elementName}]}, function (err, elementRemoved) {
                        if (err) {
                            next(err);
                        }
                        exec("shx rm -rf " + path + "/" + elementName, function (error, stdout, stderr) {
                            if (error !== null) {
                                next(error);
                            } else {
                                res.json({"message": "Element successfully deleted."});
                            }
                        });
                    });
                }
            }
        }
    });
});

module.exports = elementRouter;
