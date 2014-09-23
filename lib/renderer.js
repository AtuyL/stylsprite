var fs = require('fs'),
    dirname = require('path').dirname,
    relative = require('path').relative,
    join = require('path').join,
    chalk = require('chalk'),
    async = require('async'),
    stylus = require('stylus'),
    URL = require('./url'),
    sprite = require('./sprite'),
    uniq = require('./utils/array').uniq,

    renderAsync = function (callback) {
        this.parser = new stylus.Parser(this.str, this.options);
        var ast = this.parser.parse();
        this.evaluator = new stylus.Evaluator(ast, this.options);
        this.nodes = stylus.nodes;
        this.evaluator.renderer = this;
        ast = this.evaluator.evaluate();
        callback();
    };

module.exports = function (srcCode, options) {
    // console.log(options);
    var stylPath = options.stylPath,
        cssPath = options.cssPath,
        root = options.root,
        imgsrc = options.imgsrc,
        cssPathRelative = relative(root, dirname(cssPath) || '.'),
        context = stylus(srcCode.toString()),
        dirs = [];

    context.set('filename', stylPath);

    // collect sprite directories
    /*jslint unparam: true */
    context.define('stylsprite', function (url, pixelRatio) {
        url = new URL(url, cssPathRelative, root);
        var abspath = url.toAbsolutePath(),
            dir = dirname(abspath);
        dir = join(imgsrc, relative(root, dir));
        dirs.push(dir);
    });
    /*jslint unparam: false */

    this.render = function (callback) {
        renderAsync.call(context, function () {
            dirs = uniq(dirs);
            if (!dirs.length) {
                callback();
                return;
            }
            async.map(dirs, function (dir, callback) {
                sprite(dir, root, imgsrc, options,
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
};