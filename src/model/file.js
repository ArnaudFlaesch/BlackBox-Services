"use strict";

const mongoose = require("mongoose");

const User = require("./user");

const Schema = mongoose.Schema;

const FileSchema = new Schema({
    "filename": String,
    "path": String,
    "owner": String,
    "deleted": Boolean,
    "dateOfDeletion": Date,
    "sharedWithUsers": [String]
});

module.exports = mongoose.model("File", FileSchema, "file");
