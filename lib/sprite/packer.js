var fs = require('fs'),
    path = require('path'),
    async = require('async'),
    mkdirp = require('mkdirp'),
    imagemagick = require("imagemagick"),
    boxpack = require('boxpack'),
    chalk = require('chalk'),
    readIdentifyAsync = function (src, callback) {
        imagemagick.identify(['-format', '%w %h %#', src], function (error, w_h_hash) {
            if (error) {
                return callback(error);
            }
            var parsed = /(\d+)\s+(\d+)\s+([a-z0-9]+)/i.exec(w_h_hash);
            callback(null, {
                src: src,
                hash: parsed[3],
                geom: {
                    x: 0,
                    y: 0,
                    width: parsed[1] | 0,
                    height: parsed[2] | 0
                }
            });
        });
    };

module.exports = {
    readIdentify: function (srcs, callback) {
        if (!srcs) {
            return callback('arguments[0] is invalid');
        }
        return async.map(srcs, readIdentifyAsync, callback);
    },
    execPacking: function (pieces) {
        var result = {},
            packed = boxpack().pack(pieces);
        pieces.forEach(function (piece, index) {
            piece = packed[index];
            result[piece.src] = {
                x: piece.x,
                y: piece.y
            };
        });
        return result;
    },
    outputSpriteSheet: function (dest, images, callback) {
        var canvas = {
                width: 0,
                height: 0
            },
            stack = [],
            destdir = path.dirname(dest);
        Object.keys(images).forEach(function (src) {
            var geom = images[src],
                right = geom.x + geom.width,
                bottom = geom.y + geom.height;
            if (right > canvas.width) {
                canvas.width = right;
            }
            if (bottom > canvas.height) {
                canvas.height = bottom;
            }
        });
        stack.push("-size", canvas.width + "x" + canvas.height, "xc:none");
        Object.keys(images).forEach(function (src) {
            var geom = images[src];
            stack.push(src, "-geometry", "+" + geom.x + "+" + geom.y, "-composite");
        });
        stack.push(dest);
        if (!fs.existsSync(destdir)) {
            mkdirp.sync(destdir);
        }
        imagemagick.convert(stack, 10000, callback);
    }
};