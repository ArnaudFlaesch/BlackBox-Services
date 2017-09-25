"use strict";

const mongoose = require("mongoose");

module.exports = mongoose.model("Element",
    new mongoose.Schema({
        "name": String,
        "path": String,
        "displayName": String,
        "owner": String,
        "deleted": Boolean,
        "dateOfDeletion": Date,
        "sharedWithUsers": [{
            "sharedUserId": String,
            "canUpload": Boolean,
            "canDownload": Boolean
        }]
    }),
    "element");
