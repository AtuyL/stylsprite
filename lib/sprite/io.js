var fs = require('fs'),
    path = require('path'),
    crypto = require('crypto'),
    os = require('os'),
    chalk = require('chalk'),
    mkhash = function(value) {
        var md5sum = crypto.createHash('md5');
        md5sum.update(value, 'utf8');
        return md5sum.digest('hex');
    },
    lockFiles = [];

module.exports = function io(token) {
    if (!(this instanceof io)) return new io(token);
    if (token) this.token = token;
}

module.exports.prototype = {
    token:null,

    lock:function() {
        var index;
        if (!~(index = lockFiles.indexOf(this.token))) {
            lockFiles.push(this.token);
        }
    },

    unlock:function() {
        var index;
        if (~(index = lockFiles.indexOf(this.token))) {
            lockFiles.splice(index, 1);
        }
    },

    isLocked:function() {
        var index;
        if (~(index = lockFiles.indexOf(this.token))) {
            return true;
        } else {
            return false;
        }
    },

    getFilePath:function() {
        var filename, filepath, tmpdir, token;
        token = this.token || process.cwd();
        tmpdir = os.tmpdir();
        filename = mkhash(token) + '.json';
        filepath = path.join(tmpdir, filename);
        return filepath;
    },

    read:function() {
        var e, json_path, json_str;
        json_path = this.getFilePath();
        try {
            json_str = fs.readFileSync(json_path);
            return JSON.parse(json_str) || null;
        } catch (_error) {
            e = _error;
            return null;
        }
    },

    write:function(data) {
        var json_path;
        json_path = this.getFilePath();
        fs.writeFileSync(json_path, JSON.stringify(data));
    }
}