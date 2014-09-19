var fs = require('fs'),
    dirname = require('path').dirname,
    relative = require('path').relative,
    join = require('path').join,
    chalk = require('chalk'),
    _ = require('lodash'),
    async = require('async'),
    stylus = require('stylus'),
    URL = require('../url'),
    sprite = require('../sprite'),
    arrayUtils = require('../utils/array'),

    renderAsync = function(callback) {
        var parser = this.parser = new stylus.Parser(this.str, this.options),
            ast = parser.parse();
        this.evaluator = new stylus.Evaluator(ast, this.options);
        this.nodes = stylus.nodes;
        this.evaluator.renderer = this;
        ast = this.evaluator.evaluate();
        return callback();
    },

    generate = function(params, callback) {
        var dir = params.dir,
            paths = params.paths;
        return sprite(dir, paths, function(error) {
            return callback(null, !error);
        });
    };

module.exports = function(paths, callback) {
    var srcPath = paths.srcPath,
        destPath = paths.destPath,
        rootPath = paths.rootPath,
        imgPath = paths.imgPath,
        cssPath = relative(rootPath, dirname(destPath) || '.'),
        options = {
            filename: srcPath
        },
        srcCode = fs.readFileSync(srcPath).toString(),
        context = stylus(srcCode),
        dirs = [];
    context.define('stylsprite', function(url, pixelRatio) {
        var abspath, dir;
        url = new URL(url, cssPath, rootPath);
        abspath = url.toAbsolutePath();
        dir = dirname(abspath);
        dir = join(imgPath, relative(rootPath, dir));
        dirs.push(dir);
    });
    return renderAsync.call(context, function() {
        if (!dirs.length) {
            return callback();
        }
        dirs = dirs.reduce(arrayUtils.uniq);
        dirs = dirs.map(function(dir, index) {
            return {
                dir: dir,
                paths: paths
            };
        });
        async.map(dirs, generate, function(error, results) {
            callback(results.some(function(updated) {
                return updated;
            }));
        });
    });
};
