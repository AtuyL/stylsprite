var fs = require('fs'),
    join = require('path').join,
    sep = require('path').sep,
    relative = require('path').relative,
    stylus = require('stylus'),
    compileStylusAsync = require('./compileStylusAsync'),
    define = require('../define');

compare = function (pathA, pathB) {
    pathA = pathA.split(sep);
    pathB = pathB.split(sep);
    var overlap = [];
    while (pathA[pathA.length - 1] === pathB[0]) {
        overlap.push(pathA.pop());
        pathB.shift();
    }
    return overlap.join(sep);
};

module.exports = function (options) {
    var url = require('url'),
        dest = options.dest,
        src = options.src,
        root = options.root,
        imgsrc = options.imgsrc;
    if (!src) {
        throw new Error('stylsprite.middleware() requires "src" directory');
    }
    if (dest == null) dest = src;
    if (root == null) root = dest;
    if (imgsrc == null) imgsrc = root;
    return function (req, res, next) {
        var overlap, path, paths;
        if ('GET' !== req.method && 'HEAD' !== req.method) {
            return next();
        }
        path = url.parse(req.url).pathname;
        if (!/\.css$/.test(path)) {
            return next();
        }
        if (typeof dest === 'string' || typeof dest === 'function') {
            overlap = compare((typeof dest === "function" ? dest(path) : void 0) || dest, path);
            path = path.slice(overlap.length);
        }
        paths = {
            srcPath: (typeof src === "function" ? src(path) : void 0) || join(src, path.replace('.css', '.styl')),
            destPath: (typeof dest === "function" ? dest(path) : void 0) || join(dest, path),
            rootPath: (typeof root === "function" ? root(path) : void 0) || root,
            imgPath: (typeof imgsrc === "function" ? imgsrc(path) : void 0) || imgsrc
        };
        return compileStylusAsync(paths, function (updated) {
            if (updated) {
                try {
                    fs.unlinkSync(paths.destPath);
                } catch (_error) {}
            }
            return next();
        });
    };
};

module.exports.compile = function (str, path) {
    var destFile,
        dest = this.dest,
        src = this.src,
        root = this.root,
        imgsrc = this.imgsrc,
        context = stylus(str);
    context.set('filename', path);
    context.set('compress', this.compress);
    context.set('firebug', this.firebug);
    context.set('linenos', this.linenos);
    try {
        context.use(require('nib')());
    } catch (_error) {}
    destFile = join(dest, relative(src, path).replace(/\.styl$/, '.css'));
    context.define('stylsprite', define(destFile, root));
    return context;
};