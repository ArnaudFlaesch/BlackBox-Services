"use strict";

const bcrypt = require("bcrypt"),
    express = require("express"),
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
                                res.send(user);
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

userRouter.put("/update", function (req, res, next) {
    User.findById(req.body._id, function (err, userFromDatabase) {
        if (err) {
            next(err);
        }
        userFromDatabase.email = req.body.email;
        userFromDatabase.save(function (err) {
            if (err) {
                next(err);
            }
            res.send(req.body);
        });
    });
});

userRouter.delete("/delete/:userid", function (req, res, next) {
    User.remove({"id": req.params.userid}, function (err, user) {
        if (err) {
            next(err);
        }
        res.json({"message": "User successfully deleted."});
    });
});

module.exports = userRouter;
