var fs = require('fs'),
    join = require('path').join,
    sep = require('path').sep,
    relative = require('path').relative,
    // extname = require('path').extname,
    stylus = require('stylus'),
    compileStylusAsync = require('./compileStylusAsync'),
    define = require('../define'),

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
module.exports = function (paths, options) {
    if (!paths.src) {
        throw new Error('stylsprite.middleware() requires "src" directory');
    }
    var url = require('url'),
        src = paths.src,
        dest = paths.dest || src,
        root = paths.root || dest,
        imgsrc = paths.imgsrc || root;

    return function (req, res, next) {
        if ('GET' !== req.method && 'HEAD' !== req.method) {
            return next();
        }

        var overlap, resolved,
            path = url.parse(req.url).pathname;

        if (!/\.css$/i.test(path)) {
            return next();
        }

        if (typeof dest === 'string' || typeof dest === 'function') {
            overlap = compare(typeof dest === "function" ? dest(path) : dest, path);
            path = path.slice(overlap.length);
        }

        resolved = {
            stylPath: typeof src === "function" ? src(path) : join(src, path.replace('.css', '.styl')),
            cssPath: typeof dest === "function" ? dest(path) : join(dest, path),
            rootPath: typeof root === "function" ? root(path) : root,
            imgPath: typeof imgsrc === "function" ? imgsrc(path) : imgsrc
        };

        return compileStylusAsync(resolved, options, function (updated) {
            if (updated) {
                try {
                    fs.unlinkSync(resolved.cssPath);
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

module.exports.options = function (src, dest, root, imgsrc) {
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
        compile: compile
    };
};