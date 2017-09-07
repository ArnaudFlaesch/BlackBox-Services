"use strict";

const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    "email": String,
    "password": String,
    "firstname": String,
    "name": String
});

module.exports = mongoose.model("User", UserSchema, "user");