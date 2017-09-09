"use strict";

const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ElementSchema = new Schema({
    "name": String,
    "path": String,
    "owner": String,
    "deleted": Boolean,
    "dateOfDeletion": Date,
    "sharedWithUsers": [String]
});

module.exports = mongoose.model("Element", ElementSchema, "element");
