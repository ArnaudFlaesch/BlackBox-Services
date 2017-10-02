"use strict";

const algorithm = "aes-256-ctr",
    async = require("async"),
    crypto = require("crypto"),
    Element = require("../model/element"),
    exec = require("child_process").exec,
    express = require("express"),
    elementRouter = express.Router(),
    fs = require("fs"),
    getSize = require("get-folder-size"),
    log = require("winston"),
    multer = require("multer"),
    password = "d6F3Efeq",
    storage = multer.diskStorage({
        "destination": function (req, file, cb) {
            cb(null, "./blackbox/" + req.query.path);
        },
        "filename": function (req, file, cb) {
            cb(null, file.originalname + "_old");
        }
    }),
    upload = multer({"storage": storage}).array("documents"),
    User = require("../model/user");

elementRouter.post("/newFile", function (req, res, next) {
    const elementName = req.body.elementName,
        userId = req.body.userId;
    let path = "./blackbox" + req.body.path;
    Element.findOne({"$and": [{"path": path}, {"name": req.body.folderTo}]}, function (err, element) {
        if (!err) {
            if (element !== null) {
                path = (req.body.folderTo !== "") ? path + "/" + req.body.folderTo : path;
                if (path === "./blackbox" || (element.owner === userId || element.sharedWithUsers.indexOf(userId)) > -1) {
                    fs.open(path + "/" + elementName, "wx", function (err, fd) {
                        if (err) {
                            next(new Error("Un fichier du même nom existe déjà !"));
                        } else {
                            Element.create({"path": path, "name": elementName, "owner": userId, "deleted": false, "sharedWithUsers": element.sharedWithUsers, "isFolder": false});
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
    Element.findOne({"$and": [{"path": path}, {"name": req.body.folderTo}]}, function (err, element) {
        if (!err) {
            if (element !== null) {
                path = (req.body.folderTo !== "") ? path + "/" + req.body.folderTo : path;
                if (path === "./blackbox" || (element.owner === userId || element.sharedWithUsers.indexOf(userId)) > -1) {
                    exec("shx mkdir " + path + "/" + elementName, function (error, stdout, stderr) {
                        if (error !== null) {
                            next(new Error("Un dossier du même nom existe déjà !"));
                        } else {
                            let elementToCreate = {"path": path, "name": elementName, "owner": userId, "deleted": false, "sharedWithUsers": element.sharedWithUsers, "isFolder": true};
                            Element.create(elementToCreate);
                        }
                    });
                }
            }
        }
    });
});

function getSharedFolders (req, res, next) {
    const userId = req.query.userId;
    Element.find({"$and": [{"$and": [{"$or": [{"owner": userId }, {"sharedWithUsers": userId}]}, {"name": {"$ne": userId}}]}, {"path": "./blackbox"}]}, function (err, folders) {
        if (!err) {
            res.json(folders);
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
                        Element.find({"path": path + "/" + elementName}, function (err, elements) {
                            if (err) {
                                next(new Error("Impossible d'accéder à ce répertoire !"));
                            }
                            res.send(elements);
                        });
                    }
                }
            } else {
                next(err);
            }
        });
    }
});

elementRouter.get("/searchElements", function (req, res, next) {
    const elementName = req.query.elementName,
        userId = req.query.userId;
    let path = "./blackbox" + req.query.path;

    Element.find({"$and": [{"$and": [{"name": {"$regex": ".*" + elementName + ".*" }}, {"path":  {"$regex": path + ".*" }}]}, {"name" : {"$ne": userId}}]}, function (err, elements) {
        if (!err) {
            res.send(elements.filter(function (element) {
                return (element.owner === userId || element.sharedWithUsers.indexOf(userId) > -1);
            }));
        } else {
            next(err);
        }
    });
});

elementRouter.post("/moveElement", function (req, res, next) {
    const userId = req.body.userId,
        elementName = req.body.elementName,
        originFolder = req.body.originFolder,
        destinationFolder = req.body.destinationFolder;
    let destinationPath = req.body.destinationPath,
        originPath = req.body.originPath;

    if (originPath === "") { originPath = "/"};
    if (destinationPath === "") { destinationPath = "/"};

    originPath = "./blackbox" + originPath + "/" + originFolder;
    let path = "./blackbox" + destinationPath;

    Element.findOne({"$and": [{"name": destinationFolder}, {"path": path}]}, function (error, element) {
        if (!error) {
            if (element !== null) {
                if (element.owner === userId || element.sharedWithUsers.indexOf(userId) > -1) {
                    if (req.body.moveOrCopy) {
                        fs.copyFile(originPath + "/" + elementName, path + "/" + elementName, function(copyError) {
                            if (copyError) {
                                next(copyError);
                            }
                        });
                    } else {
                        fs.rename(originPath + "/" + elementName, path + "/" + elementName, function (renameError) {
                            if (renameError) {
                                next(renameError);
                            }
                        });
                    }
                }
            }
        } else {
            next(error);
        }
    });
});

elementRouter.get("/sharedFolders", function (req, res, next) {
    getSharedFolders(req, res, next);
});

elementRouter.get("/download", function (req, res, next) {
    const elementName = req.query.elementName,
        decrypt = crypto.createDecipher(algorithm, password),
        userId = req.query.userId;
    let path = "./blackbox" + req.query.path;
    Element.findOne({"$and": [{"name": elementName}, {"path": path}]}, function (error, element) {
        if (!error) {
            if (element !== null) {
                if (element.owner === userId || element.sharedWithUsers.indexOf(userId) > -1) {
                    fs.createReadStream(path + "/" + elementName).pipe(decrypt).pipe(res);
                }
            }
        }
        else {
            next(error);
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

        User.findById(req.query.userId, function(err, user) {
            Element.findOne({"$and": [{"name": elementName}, {"path": path}]}, function (error, element) {
                if (!error) {
                    if (element !== null) {
                        req.files.map(function (file) {
                            const destination = file.destination.replace("//", "/"),
                                filePath = destination + "/" + file.filename,
                                r = fs.createReadStream(filePath),
                                encrypt = crypto.createCipher(algorithm, password),
                                w = fs.createWriteStream(filePath.substring(0, filePath.length - 4));
                            getUserSpace(req.query.userId, null, null, function (sizeOfAllFolders) {
                                if (file.size + sizeOfAllFolders >= user.storageSpace) {
                                    next(new Error("Vous n'avez plus assez d'espace ! Pensez à souscrire à un compte Premium ou à libérer de la place !"))
                                } else {
                                    r.pipe(encrypt).pipe(w);
                                    fs.unlink(filePath, function(err) {
                                        Element.findOne({"path": destination, "name": file.filename.substring(0, file.filename.length - 4)}, function (getFileError, fileFromDB) {
                                            if (!fileFromDB) {
                                                Element.create({"path": destination, "name": file.filename.substring(0, file.filename.length - 4), "owner": req.query.userId, "deleted": false, "sharedWithUsers": element.sharedWithUsers, "isFolder": false });
                                            }
                                        });
                                    });
                                }
                            });
                        });
                    }
                } else {
                    next(error)
                }
            });
        })
    });
});

function getUserSpace (userId, req, res, callback) {
    Element.find({"$and": [{"owner": userId}, {"path": "./blackbox"}]}, function (getFoldersError, userDirectories) {
        if (getFoldersError) {
            next(getFoldersError);
        }
        else {
            let sizeOfAllFolders = 0;
            async.each(userDirectories,
                function (directory, done) {
                    getSize("./blackbox/" + directory.name, function (err, size) {
                        if (err) {
                            next(err);
                        }
                        sizeOfAllFolders += size;
                        done();
                    });
                },
                function () {
                    if (req && res) {
                        res.json({"message": sizeOfAllFolders});
                    } else {
                        callback(sizeOfAllFolders);
                    }
                });
        }
    });
}

elementRouter.post("/getUserSpace", function (req, res, next) {
     getUserSpace(req.body.userId, req, res);
});

elementRouter.get("/listOfSharedUsers", function (req, res, next) {
    const elementName = req.query.elementName,
        userId = req.query.userId;
    let path = "./blackbox" + req.query.path;
    Element.findOne({"$and": [{"name": elementName}, {"path": path}]}, function (error, element) {
        if (!error) {
            if (element !== null) {
                if (element.owner === userId || element.sharedWithUsers.indexOf(userId) > -1) {
                    let sharedUsers = [];
                    async.each(element.sharedWithUsers,
                        function(userId, done) {
                            User.findById(userId, function (err, user) {
                                if (err) {
                                    next(err);
                                } else if (user) {
                                    user.password = null;
                                    sharedUsers.push(user);
                                    done();
                                }
                            });
                        },
                        function (err){
                            res.send(sharedUsers);
                        }
                    );
                } else {
                    next(new Error("Vous n'avez pas les droits d'accès !"));
                }
            }
        } else {
            next(error);
        }
    });
});

elementRouter.post("/saveSharedUser", function (req, res, next) {
    const elementName = req.body.elementName,
        userId = req.body.userId;
    let path = "./blackbox" + req.body.path;
    Element.findOne({"$and": [{"name": elementName}, {"path": path}]}, function (error, element) {
        if (!error) {
            if (element !== null) {
                if (element.owner === userId || element.sharedWithUsers.indexOf(userId) > -1) {
                    User.findOne({"email": req.body.sharedUserEmail}, function (error, user) {
                        if (error) {
                            next(error);
                        } else if (user) {
                            if (element.sharedWithUsers.indexOf(user._id) > -1 || user._id === userId || user._id == element.owner) {
                                next(new Error("L'utilisateur dispose déjà des droits d'accès."));
                            } else {
                                element.sharedWithUsers.push(user._id);
                                element.save(function (err) {
                                    if (err) {
                                        next(err);
                                    }
                                });
                            }
                        } else {
                            next(new Error("Aucun utilisateur n'existe avec cet email."));
                        }
                    });
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
                    element.sharedWithUsers = element.sharedWithUsers.filter(user => user != req.query.sharedUserId);
                    element.save(function (error) {
                        if (error) {
                            next(error);
                        }
                        else {
                            Element.find({"path": {"$regex": path + "/" + elementName + ".*" }}, function (err, elements) {
                                if (!err) {
                                    if (elements.length > 0) {
                                        async.each(elements(
                                            function (element, done) {
                                            element.sharedWithUsers = element.sharedWithUsers.filter(user => user != req.query.sharedUserId);
                                            element.save();
                                            done();
                                        }),
                                        function() {
                                            res.json({"message": "L'accès de l'utilisateur a bien été révoqué."});
                                        });
                                    }
                                }
                            });

                        }
                    })
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
    Element.find({"path": {"$regex": path + "/" + elementName + ".*" }}, function (err, elements) {
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
