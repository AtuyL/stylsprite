var fs = require('fs'),
    join = require('path').join,
    sep = require('path').sep,
    relative = require('path').relative,
    // extname = require('path').extname,
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

    compile = function (str, path) {
        var destFile,
            dest = this.dest,
            src = this.src,
            root = this.root,
            context = stylus(str);
        context.set('filename', path);
        context.set('paths', this.paths);
        context.set('compress', this.compress);
        context.set('firebug', this.firebug);
        context.set('linenos', this.linenos);
        try {
            context.use(require('nib')());
        } catch (ignore) {
            // console.log(ignore);
        }
        destFile = join(dest, relative(src, path).replace(/\.styl$/, '.css'));
        context.define('stylsprite', define(destFile, root));
        return context;
    };

/*jslint unparam: true */
module.exports = function (options) {
    if (!options.src) {
        throw new Error('stylsprite.middleware() requires "src" directory');
    }
    var url = require('url'),
        src = options.src,
        dest = options.dest || src,
        root = options.root || dest,
        imgsrc = options.imgsrc || root;

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

        options.stylPath = typeof src === "function" ? src(path) : join(src, path.replace('.css', '.styl'));
        options.cssPath = typeof dest === "function" ? dest(path) : join(dest, path);
        options.root = typeof root === "function" ? root(path) : root;
        options.imgsrc = typeof imgsrc === "function" ? imgsrc(path) : imgsrc;

        var str = fs.readFileSync(options.stylPath).toString();

        return new Renderer(str, options).render(function (updated) {
            if (updated) {
                try {
                    fs.unlinkSync(options.cssPath);
                } catch (ignore) {
                    // console.log(ignore);
                }
            }
            return next();
        });
    };
};
/*jslint unparam: false */

module.exports.compile = compile;

module.exports.options = function (src, dest, root, imgsrc, options) {
    if (!src) {
        throw new Error('stylsprite.middleware() requires "src" directory');
    }
    dest = dest || src;
    root = root || dest;
    imgsrc = imgsrc || root;
    return {
        src: src,
        dest: dest,
        root: root,
        imgsrc: imgsrc,
        compile: compile,
        padding: options.padding || 0,
        verbose: options.verbose || false
    };
};