"use strict";

const mongoose = require("mongoose");

module.exports = mongoose.model("Element",
    new mongoose.Schema({
        "name": String,
        "path": String,
        "owner": String,
        "deleted": Boolean,
        "dateOfDeletion": Date,
        "sharedWithUsers": [String],
        "isFolder": Boolean
    }),
    "element");
