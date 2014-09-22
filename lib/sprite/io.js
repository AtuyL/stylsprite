var fs = require('fs'),
    path = require('path'),
    crypto = require('crypto'),
    os = require('os'),
    chalk = require('chalk'),
    mkhash = function (value) {
        var md5sum = crypto.createHash('md5');
        md5sum.update(value, 'utf8');
        return md5sum.digest('hex');
    },
    lockFiles = [];

module.exports = function IO(token) {
    if (!(this instanceof IO)) {
        return new IO(token);
    }
    if (token) {
        this.token = token;
    }
};

module.exports.prototype = {
    token: null,

    lock: function () {
        if (lockFiles.indexOf(this.token) < 0) {
            lockFiles.push(this.token);
        }
    },

    unlock: function () {
        var index = lockFiles.indexOf(this.token);
        if (index >= 0) {
            lockFiles.splice(index, 1);
        }
    },

    isLocked: function () {
        return lockFiles.indexOf(this.token) >= 0;
    },

    getFilePath: function () {
        var filename, filepath, tmpdir, token;
        token = this.token || process.cwd();
        tmpdir = os.tmpdir();
        filename = mkhash(token) + '.json';
        filepath = path.join(tmpdir, filename);
        return filepath;
    },

    read: function () {
        var json_path = this.getFilePath(),
            json_str;
        try {
            json_str = fs.readFileSync(json_path);
            return JSON.parse(json_str) || null;
        } catch (error) {
            console.log(error);
            return null;
        }
    },

    write: function (data) {
        var json_path;
        json_path = this.getFilePath();
        fs.writeFileSync(json_path, JSON.stringify(data));
    }
};