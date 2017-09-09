"use strict";

const exec = require("child_process").exec;

const shellScripts = {

    createFolder : function(path, folderName) {
        exec("shx mkdir " + path + "/" + folderName + "/", function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
                return (false);
            }
        });
        return (true);
    },

    createFile : function(fileName) {
        exec("shx touch " + path + fileName, function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            }
        });
    }

}

module.exports = shellScripts;
