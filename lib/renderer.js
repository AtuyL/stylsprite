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

/**
 * Render CSS-Sprite
 *
 * @param {String} str
 * @param {Object} options
 * @api public
 */
module.exports = function Renderer(str, options) {
    if (!(this instanceof Renderer)) {
        return new Renderer(str, options);
    }
    // arguments check
    if (typeof str !== 'string') {
        console.log(chalk.red('invalid: arguments[0]'));
        return;
    }
    if (!options || !options.stylFile || !options.cssFile || !options.root) {
        if (!options) {
            console.log(chalk.red('invalid: arguments[1]'));
            return;
        }
        if (!options.stylFile) {
            console.log(chalk.red('options.stylFile is required'));
        }
        if (!options.cssFile) {
            console.log(chalk.red('options.cssFile is required'));
        }
        if (!options.root) {
            console.log(chalk.red('options.root is required'));
        }
        return;
    }

    // console.log(options);
    var stylFile = options.stylFile,
        cssFile = options.cssFile,
        root = options.root,
        imgsrc = options.imgsrc || root,
        cssFileRelative = relative(root, dirname(cssFile) || '.'),
        context = stylus(str.toString()),
        dirs = [];

    context.set('filename', stylFile);

    // collect sprite directories
    /*jslint unparam: true */
    context.define('stylsprite', function (url, pixelRatio) {
        url = new URL(url, cssFileRelative, root);
        var abspath = url.toAbsolutePath(),
            dir = dirname(abspath);
        dir = join(imgsrc, relative(root, dir));
        dirs.push(dir);
    });
    /*jslint unparam: false */

    /**
     * Execute Render an CSS-Sprite
     *
     * @param {Function} callback
     * @api public
     */
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