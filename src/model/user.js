"use strict";

const mongoose = require("mongoose");

module.exports = mongoose.model("User",
    new mongoose.Schema({
        "email": String,
        "password": String,
        "firstname": String,
        "name": String,
        "isPremiumUser": Boolean,
        "premiumDateOfExpiration": Date,
        "storageSpace": Number
    }),
    "user");
