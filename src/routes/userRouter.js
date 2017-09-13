"use strict";

const bcrypt = require("bcrypt"),
    express = require("express"),
    Element = require("../model/element"),
    exec = require("child_process").exec,
    User = require("../model/user");

const userRouter = express.Router();

userRouter.use(function (req, res, next) {
    next();
});

userRouter.get("/list", function (req, res, next) {
    User.find(function (err, users) {
        if (err) {
            next(err);
        }
        res.json(users);
    });
});

userRouter.get("/info/:userid", function (req, res, next) {
    User.findById(req.params.userid, function (err, user) {
        if (err) {
            next(err);
        }
        res.json(user);
    });
});

userRouter.post("/login", function (req, res, next) {
    User.findOne({ "email": req.body.email}, function (err, user) {
        if (err) {
            next(err);
        }
        else {
            if (user === null) {
                next(new Error("Aucun utilisateur n'existe avec cet email."));
            }
            else {
                bcrypt.compare(req.body.password, user.password, function(err, result) {
                    if (result) {
                        res.json(user);
                    }
                    else {
                        next(new Error("Mot de passe invalide."));
                    }
                });
            }
        }
    });
});

userRouter.post("/register", function (req, res, next) {
    User.find({ "email": req.body.email},
        function (err, user){
            if (err) {
                next(err);
            }
            else {
                if (user.length === 0) {
                   bcrypt.hash(req.body.password, 10, function(err, hash) {
                        req.body.password = hash;
                        User.create(req.body, function (err, user) {
                            if (err) {
                                next(err);
                            }
                            else {
                                exec("shx mkdir " + "./blackbox" + "/" + user._id, function (error, stdout, stderr) {
                                    if (error !== null) {
                                        console.log('exec error: ' + error);
                                    }
                                    else {
                                        Element.create({path: "./blackbox", name : user._id, owner : user._id, deleted: false });
                                        res.send(user);
                                    }
                                });
                            }
                        });
                    })
                }
                else {
                    next(new Error("L'email est déjà utilisé."));
                }
            }
        });
});

userRouter.post("/update", function (req, res, next) {
    User.findById(req.body._id, function (err, userFromDatabase) {
        if (err) {
            next(err);
        }
        userFromDatabase.firstname = req.body.firstname;
        userFromDatabase.name = req.body.name;
        userFromDatabase.email = req.body.email;
        userFromDatabase.save(function (err) {
            if (err) {
                next(err);
            }
            res.send(req.body);
        });
    });
});


userRouter.post("/updateUserPassword", function (req, res, next) {
    User.findById(req.body.userId, function (err, userFromDatabase) {
        if (err) {
            next(err);
        }
        bcrypt.compare(req.body.oldPassword, userFromDatabase.password, function(err, result) {
            if (result) {
                bcrypt.hash(req.body.newPassword, 10, function(err, hash) {
                    req.body.newPassword = hash;
                    userFromDatabase.password = req.body.newPassword;
                    userFromDatabase.save(function (err) {
                        if (err) {
                            next(err);
                        }
                        res.json(userFromDatabase);
                    });
                });
            }
            else {
                next(new Error("Mot de passe invalide."));
            }
        });
    });
});

userRouter.delete("/delete", function (req, res, next) {
    User.findById(req.query.userId, function (err, userFromDatabase) {
        if (err) {
            next(err);
        }
        bcrypt.compare(req.query.password, userFromDatabase.password, function(err, result) {
            if (result) {
                Element.remove({"path" : "./blackbox/" + req.query.userId}, function(err, result) {
                    User.remove({"_id": req.query.userId}, function (err, user) {
                        if (err) {
                            next(err);
                        }
                        exec("shx rm -rf " + "./blackbox/" + req.query.userId, null);
                        res.json({"message": "User successfully deleted."});
                    });
                });
            }
            else {
                next(new Error("Mot de passe invalide."));
            }
        });
    });
});

module.exports = userRouter;
