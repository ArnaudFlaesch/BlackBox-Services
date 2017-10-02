"use strict";

const app = require("express")(),
    bodyParser = require("body-parser"),
    cors = require("cors"),
    exec = require("child_process").exec,
    express = require("express"),
    elementRouter = require("./routes/elementRouter"),
    log = require("winston"),
    methodOverride = require("method-override"),
    mongoose = require("mongoose"),
    Element = mongoose.model("Element"),
    port = process.env.PORT || 3000,
    router = express.Router(),
    server = require("http").Server(app),
    userRouter = require("./routes/userRouter");

mongoose.connect("mongodb://localhost/blackbox", { "useMongoClient": true });

app.use(bodyParser.urlencoded({"extended": true}));
app.use(bodyParser.json());
app.use(cors());
app.use(methodOverride());

app.use("/", router);
app.use("/user", userRouter);
app.use("/element", elementRouter);

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Length, X-Requested-With");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

    if ("OPTIONS" == req.method) {
        res.send(200);
    } else {
        next();
    }
});

router.get("/", function (req, res) {
    res.json({"message": "Welcome to BlackBox's Services !"});
});

router.use(function (req, res, next) {
    next();
});

app.use(function (err, req, res, next) {
    res.status(500).json({"error": err.message});
});



server.listen(port, function () {
    exec("shx mkdir " + "./blackbox", function (error, stdout, stderr) {
        if (!error) {
            Element.create({"path": "./blackbox", "name": "", "owner": "blackbox", "deleted": false, "sharedWithUsers": []});
        }
    });
    log.info("Starting server on port " + port);
});

module.exports = server;
