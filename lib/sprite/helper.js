var join = require('path').join,
    chalk = require('chalk'),
    uniq = function (a, b) {
        if (~(a.indexOf(b))) {
            return a;
        } else {
            return a.concat(b);
        }
    };

module.exports = function helper(data) {
    if (!(this instanceof helper)) return new helper(data);
    this.version = data.version;
    this.src = data.src;
    this.dest = data.dest;
    this.sprites = data.sprites;
    return this;
};

module.exports.prototype = {
    version: null,
    src: null,
    dest: null,
    sprites: null,

    filterByDest: function (dest) {
        var sprites = null,
            src, srcdata;
        for (src in this.sprites) {
            srcdata = this.sprites[src];
            if (!srcdata.sheets[dest]) continue;
            if (sprites == null) sprites = {};
            sprites[src] = srcdata;
        }
        return sprites;
    },

    removeSrc: function (src) {
        if (this.sprites[src]) delete this.sprites[src];
    },

    removeDest: function (dest) {
        var src, srcdata;
        for (src in this.sprites) {
            srcdata = this.sprites[src];
            delete srcdata.sheets[dest];
        }
        for (src in this.sprites) {
            srcdata = this.sprites[src];
            if (!Object.keys(srcdata.sheets).length) {
                delete this.sprites[src];
            }
        }
    },

    clearHash: function (srcs) {
        var src, srcdata;
        if (srcs == null) srcs = null;
        if (srcs === null) {
            srcs = Object.keys(this.sprites);
        } else if (typeof srcs === 'string') {
            srcs = [srcs];
        }
        for (src in this.sprites) {
            srcdata = this.sprites[src];
            if (~srcs.indexOf(src)) srcdata.hash = null;
        }
    },

    collectSrc: function () {
        var src;
        src = this.src;
        return Object.keys(this.sprites).map(function (file) {
            return join(src, file);
        });
    },

    collectDest: function (srcs) {
        var dest, dests, pos, src, srcdata;
        if (srcs == null) srcs = null;
        if (srcs === null) {
            srcs = Object.keys(this.sprites);
        } else if (typeof srcs === 'string') {
            srcs = [srcs];
        }
        dests = [];
        for (src in this.sprites) {
            srcdata = this.sprites[src];
            if (~srcs.indexOf(src)) {
                for (dest in srcdata.sheets) {
                    pos = srcdata.sheets[dest];
                    if (!~dests.indexOf(dest)) dests.push(dest);
                }
            }
        }
        return dests.reduce(uniq, []);
    },

    collectFellow: function (srcs) {
        if (srcs == null) srcs = null;
        return this.collectSrc(this.collectDest(srcs));
    },

    valueOf: function () {
        return {
            version: this.version,
            src: this.src,
            dest: this.dest,
            sprites: this.sprites
        }
    },

    toString: function () {
        return JSON.stringify(this.valueOf(), null, '  ');
    },

    log: function () {
        var dest, pos, src, srcdata, results;
        results = [];
        for (src in this.sprites) {
            srcdata = this.sprites[src];
            console.log(chalk.cyan(src));
            console.log('  ', chalk.gray('hash:'), srcdata.hash);
            console.log('  ', chalk.gray('geom:'), srcdata.geom);
            if (Object.keys(srcdata.sheets)) {
                console.log('  ', chalk.gray('sheets:'));
                results.push((function () {
                    var row = [];
                    for (dest in srcdata.sheets) {
                        pos = srcdata.sheets[dest];
                        row.push(console.log('    ', dest, ':', pos));
                    }
                    return row;
                })());
            } else {
                results.push(console.log('  ', chalk.gray('sheets:'), '{}'));
            }
        }
        return results;
    }
}