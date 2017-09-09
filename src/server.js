"use strict";

const app = require("express")(),
    bodyParser = require("body-parser"),
    cors = require("cors"),
    express = require("express"),
    methodOverride = require("method-override"),
    mongoose = require("mongoose"),
    router = express.Router(),
    server = require("http").Server(app),
    elementRouter = require("./routes/elementRouter"),
    userRouter = require("./routes/userRouter");

const port = process.env.PORT || 3000;

mongoose.connect("mongodb://localhost/blackbox");

app.use(bodyParser.urlencoded({"extended": true}));
app.use(bodyParser.json());
app.use(cors());
app.use(methodOverride());

router.get("/", function (req, res) {
    res.json({"message": "Welcome to BlackBox's Services !"});
});

router.use(function (req, res, next) {
    next();
});

app.use("/", router);
app.use("/user", userRouter);
app.use("/element", elementRouter);

app.use(function (req, res, next) {
    var err = new Error("Not Found");
    err.status = 404;
    next(err);
});

app.use(function (err, req, res, next) {
    res.status(500).json({"error": err.message});
});

server.listen(port, function () {
    console.log("Starting server on port " + port);
});

module.exports = server;
