var fs = require('fs'),
    dirname = require('path').dirname,
    relative = require('path').relative,
    join = require('path').join,
    chalk = require('chalk'),
    async = require('async'),
    stylus = require('stylus'),
    URL = require('../url'),
    sprite = require('../sprite'),
    uniq = require('../utils/array').uniq,

    renderAsync = function (callback) {
        this.parser = new stylus.Parser(this.str, this.options);
        var ast = this.parser.parse();
        this.evaluator = new stylus.Evaluator(ast, this.options);
        this.nodes = stylus.nodes;
        this.evaluator.renderer = this;
        ast = this.evaluator.evaluate();
        return callback();
    };

module.exports = function (paths, options, callback) {
    var stylPath = paths.stylPath,
        cssPath = paths.cssPath,
        rootPath = paths.rootPath,
        imgPath = paths.imgPath,
        cssPathRelative = relative(rootPath, dirname(cssPath) || '.'),
        srcCode = fs.readFileSync(stylPath).toString(),
        context = stylus(srcCode),
        dirs = [];
    /*jslint unparam: true */
    context.define('stylsprite', function (url, pixelRatio) {
        url = new URL(url, cssPathRelative, rootPath);
        var abspath = url.toAbsolutePath(),
            dir = dirname(abspath);
        dir = join(imgPath, relative(rootPath, dir));
        dirs.push(dir);
    });
    /*jslint unparam: false */
    dirs = uniq(dirs);
    return renderAsync.call(context, function () {
        if (!dirs.length) {
            callback();
            return;
        }
        async.map(dirs, function (dir, callback) {
            return sprite(dir, rootPath, imgPath, options,
                function (error) {
                    return callback(null, !error);
                });
        }, function (error, results) {
            if (error) {
                console.log(error);
            }
            callback(results.some(function (updated) {
                return updated;
            }));
        });
    });
};