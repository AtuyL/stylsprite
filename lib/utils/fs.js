var fs = require('fs'),
    path = require('path'),
    async = require('async'),

    readFilesDeep = function (exists, depth, modifier, done) {
        if (!Array.isArray(exists)) exists = [exists];
        exists = exists.filter(function(filename){
            return typeof filename === 'string'
        });
        if (typeof depth === 'number') {
            depth--;
        }
        var enable_deep_read = depth === null || depth >= 0,
            defsMapping = function (def, callback) {
                var file = def.file,
                    stat = def.stat;
                if (stat.isDirectory() && enable_deep_read) {
                    fs.readdir(file, function (error, children) {
                        if (children) {
                            children = children.map(function (child) {
                                return path.join(file, child);
                            });
                            readFilesDeep(children, depth, modifier, callback);
                        } else {
                            callback(null, null);
                        }
                    });
                    return;
                }
                if (typeof modifier === 'function') {
                    callback(null, modifier(file, stat));
                } else {
                    callback(null, file);
                }
            };
        async.map(exists, fs.stat, function (error, stats) {
            if (error) return done(error, null);
            var defs = stats.map(function (stat, index) {
                return {
                    file: exists[index],
                    stat: stat
                };
            });
            async.map(defs, defsMapping, done);
        });
    },

    checkExist = function (path, callback) {
        fs.open(path, 'r', function (error, fd) {
            if (!fd) {
                return callback(!error);
            }
            return fs.close(fd, function () {
                return callback(!error);
            });
        });
    };
module.exports = {
    readFilesDeep: readFilesDeep,
    checkExist: checkExist
};