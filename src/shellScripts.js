"use strict";

const exec = require("child_process").exec;

const shellScripts = {

    createFile : function(path, fileName) {
        exec("shx touch " + path + fileName, function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            }
        });
    }

}

module.exports = shellScripts;
