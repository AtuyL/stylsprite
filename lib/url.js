var path = require('path'),
    chalk = require('chalk');

var parseUrl = function (url) {
    if (!url.args) {
        url = url.val || url;
    } else {
        var urlArgs = url.args.nodes[0];
        if (urlArgs.nodes.length) {
            url = urlArgs.nodes.map(function (node) {
                return node.string;
            }).join('');
        } else {
            url = urlArgs.nodes[0];
        }
    }
    return url;
}

module.exports = function (url, cssPath, rootPath) {
    this.cssPath = cssPath;
    this.rootPath = path.resolve(rootPath);
    this.value = parseUrl(url);
}

module.exports.prototype = {
    cssPath: '.',
    rootPath: '.',
    spritePath: null,
    toSpritePath: function () {
        if (this.spritePath) return this.spritePath;
        var abspath = this.toAbsolutePath();
        return this.spritePath = path.relative(path.dirname(abspath), abspath);
    },
    absolutePath: null,
    toAbsolutePath: function () {
        if (this.absolutePath) return this.absolutePath;
        if (/^https?:\/\//i.test(this.value)) {
            throw new Error('sorry. not supported yet.. : ' + this.value);
        }
        var abspath;
        if (/^\//i.test(this.value)) {
            abspath = path.join(this.rootPath, this.value);
        } else {
            abspath = path.join(this.rootPath, this.cssPath, this.value);
        }
        return this.absolutePath = abspath
    },
    getSpritePath: function () {
        return path.dirname(this.value) + '.png';
    },
    valueOf: function () {
        return this.value;
    },
    toString: function () {
        return this.value;
    }
}


/*
this.test = ->
    chalk = require 'chalk'
    basename = path.basename process.cwd()
    rootPaths = [
        'b'
        './b'
        "../#{basename}/b"
        '/b'
    ]
    cssPaths = [
        'a'
        './a'
        '../b/a'
        '/a'
    ]
    values = [
        'c.png'
        './c.png'
        '../a/c.png'
        '/c.png'
    ]
    for value in values
        for css in cssPaths
            for root in rootPaths
                url = new URL value,css,root
                abspath = do url.toAbsolutePath
                if 'b/a/c.png' is abspath
                    console.log chalk.cyan('OK:'),
                        chalk.green('root:'),chalk.bold(root)
                        chalk.green('css:'),chalk.bold(css)
                        chalk.green('value:'),chalk.bold(value)
                        chalk.gray('-->'),chalk.green(abspath)
                else
                    console.log chalk.red('NG:'),
                        chalk.red('root:'),chalk.bold(root)
                        chalk.red('css:'),chalk.bold(css)
                        chalk.red('value:'),chalk.bold(value)
                        chalk.gray('-->'),chalk.red(abspath)
*/