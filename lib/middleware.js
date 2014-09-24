var fs = require('fs'),
    join = require('path').join,
    sep = require('path').sep,
    relative = require('path').relative,
    // extname = require('path').extname,
    chalk = require('chalk'),
    stylus = require('stylus'),
    Renderer = require('./renderer'),
    define = require('./define'),

    compare = function (pathA, pathB) {
        pathA = pathA.split(sep);
        pathB = pathB.split(sep);
        var overlap = [];
        while (pathA[pathA.length - 1] === pathB[0]) {
            overlap.push(pathA.pop());
            pathB.shift();
        }
        return overlap.join(sep);
    },

    compile = function (str, stylFile) {
        var context = stylus(str);
        context.set('filename', stylFile);
        context.set('paths', this.paths);
        context.set('compress', this.compress);
        context.set('firebug', this.firebug);
        context.set('linenos', this.linenos);
        try {
            context.use(require('nib')());
        } catch (ignore) {
            // console.log(ignore);
        }
        var cssFile = join(this.dest, relative(this.src, stylFile).replace(/\.styl$/, '.css'));
        context.define('stylsprite', define(cssFile, this.root));
        return context;
    };

/*jslint unparam: true */
module.exports = function (stylusOptions, spriteOptions) {
    if (!stylusOptions || !stylusOptions.src) {
        throw new Error('stylsprite.middleware() requires first-arguments and `src` param.');
    }
    stylusOptions.compile = stylusOptions.compile || compile;
    spriteOptions = spriteOptions || {};

    var onestop = stylusOptions.onestop || spriteOptions.onestop || false,
        stylus_mw = onestop ? stylus.middleware(stylusOptions) : null,
        url = require('url'),
        src = stylusOptions.src,
        dest = stylusOptions.dest || src,
        root = stylusOptions.root || dest,
        imgsrc = stylusOptions.imgsrc || root,
        padding = spriteOptions.padding || stylusOptions.padding || 0,
        verbose = spriteOptions.verbose || stylusOptions.verbose || false;

    return function (req, res, next) {
        if ('GET' !== req.method && 'HEAD' !== req.method) {
            return next();
        }

        var overlap,
            path = url.parse(req.url).pathname;

        if (!/\.css$/i.test(path)) {
            return next();
        }

        if (typeof dest === 'string' || typeof dest === 'function') {
            overlap = compare(typeof dest === "function" ? dest(path) : dest, path);
            path = path.slice(overlap.length);
        }

        var options = {
                stylFile: typeof src === "function" ? src(path) : join(src, path.replace('.css', '.styl')),
                cssFile: typeof dest === "function" ? dest(path) : join(dest, path),

                src: typeof src === "function" ? src(path) : src,
                dest: typeof dest === "function" ? dest(path) : dest,
                root: typeof root === "function" ? root(path) : root,
                imgsrc: typeof imgsrc === "function" ? imgsrc(path) : imgsrc,

                padding: padding,
                verbose: verbose
            },
            str = fs.readFileSync(options.stylFile).toString();

        new Renderer(str, options).render(function (updated) {
            if (updated) {
                try {
                    fs.unlinkSync(options.cssFile);
                } catch (ignore) {
                    // console.log(ignore);
                }
                if (stylus_mw) {
                    stylus_mw(req, res, next);
                } else {
                    next();
                }
            } else {
                next();
            }
        });
    };
};
/*jslint unparam: false */

module.exports.compile = compile;