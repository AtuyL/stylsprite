var path = require('path'),
    chalk = require('chalk'),

    parseUrl = function (url) {
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
    };

module.exports = function (url, cssFile, rootPath) {
    this.cssFile = cssFile;
    this.rootPath = path.resolve(rootPath);
    this.value = parseUrl(url);
};

module.exports.prototype = {
    cssFile: '.',
    rootPath: '.',
    spritePath: null,
    toSpritePath: function () {
        if (this.spritePath) {
            return this.spritePath;
        }
        var abspath = this.toAbsolutePath();
        this.spritePath = path.relative(path.dirname(abspath), abspath);
        return this.spritePath;
    },
    absolutePath: null,
    toAbsolutePath: function () {
        if (this.absolutePath) {
            return this.absolutePath;
        }
        if (/^https?:\/\//i.test(this.value)) {
            throw new Error('sorry. not supported yet.. : ' + this.value);
        }
        var abspath;
        if (/^\//i.test(this.value)) {
            abspath = path.join(this.rootPath, this.value);
        } else {
            abspath = path.join(this.rootPath, this.cssFile, this.value);
        }
        this.absolutePath = abspath;
        return this.absolutePath;
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
};