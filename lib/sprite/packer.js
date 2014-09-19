var fs = require('fs'),
    path = require('path'),
    async = require('async'),
    mkdirp = require('mkdirp'),
    imagemagick = require("imagemagick"),
    boxpack = require('boxpack'),
    chalk = require('chalk'),
    readIdentifyAsync = function (src, callback) {
        imagemagick.identify(['-format', '%w %h %#', src], function (error, w_h_hash) {
            if (error) return callback(error);
            var parsed = /(\d+)\s+(\d+)\s+([a-z0-9]+)/i.exec(w_h_hash),
                match = parsed[0],
                width = parsed[1],
                height = parsed[2],
                hash = parsed[3],
                geom = {
                    x: 0,
                    y: 0,
                    width: width | 0,
                    height: height | 0
                };
            callback(null, {
                src: src,
                hash: hash,
                geom: geom
            });
        });
    };

module.exports = {
    readIdentify: function (srcs, callback) {
        if (!srcs) return callback('arguments[0] is invalid');
        return async.map(srcs, readIdentifyAsync, callback);
    },
    execPacking: function (pieces) {
        var index, packed, piece, result, src, x, y, _i, _len, _ref;
        result = {};
        packed = boxpack().pack(pieces);
        for (index = _i = 0, _len = pieces.length; _i < _len; index = ++_i) {
            piece = pieces[index];
            _ref = packed[index], src = _ref.src, x = _ref.x, y = _ref.y;
            piece.x = x;
            piece.y = y;
            result[src] = {
                x: x,
                y: y
            };
        }
        return result;
    },
    outputSpriteSheet: function (dest, images, callback) {
        var bottom, canvas, destdir, geom, right, src, stack;
        canvas = {
            width: 0,
            height: 0
        };
        for (src in images) {
            geom = images[src];
            right = geom.x + geom.width;
            bottom = geom.y + geom.height;
            if (right > canvas.width) {
                canvas.width = right;
            }
            if (bottom > canvas.height) {
                canvas.height = bottom;
            }
        }
        stack = ["-size", "" + canvas.width + "x" + canvas.height, "xc:none"];
        for (src in images) {
            geom = images[src];
            stack.push(src, "-geometry", "+" + geom.x + "+" + geom.y, "-composite");
        }
        stack.push(dest);
        destdir = path.dirname(dest);
        if (!fs.existsSync(destdir)) {
            mkdirp.sync(destdir);
        }
        imagemagick.convert(stack, 10000, callback);
    }
};