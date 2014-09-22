var join = require('path').join,
    chalk = require('chalk'),
    uniq = require('../utils/array').uniq;

module.exports = function Helper(data) {
    if (!(this instanceof Helper)) {
        return new Helper(data);
    }
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
        var sprites = this.sprites,
            filtered = {};
        Object.keys(sprites).forEach(function (src) {
            var srcdata = sprites[src];
            if (!srcdata.sheets[dest]) {
                return;
            }
            filtered[src] = srcdata;
        });
        return filtered;
    },

    removeSrc: function (src) {
        if (this.sprites[src]) {
            delete this.sprites[src];
        }
    },

    removeDest: function (dest) {
        var sprites = this.sprites;
        Object.keys(sprites).forEach(function (src) {
            delete sprites[src].sheets[dest];
        });
        Object.keys(sprites).forEach(function (src) {
            if (!Object.keys(sprites[src].sheets).length) {
                delete sprites[src];
            }
        });
    },

    clearHash: function (srcs) {
        var sprites = this.sprites;
        if (srcs === null) {
            srcs = Object.keys(sprites);
        } else if (typeof srcs === 'string') {
            srcs = [srcs];
        }
        Object.keys(sprites).forEach(function (src) {
            if (srcs.indexOf(src) >= 0) {
                sprites[src].hash = null;
            }
        });
    },

    collectSrc: function () {
        var src = this.src;
        return Object.keys(this.sprites).map(function (file) {
            return join(src, file);
        });
    },

    collectDest: function (srcs) {
        if (srcs === null) {
            srcs = Object.keys(this.sprites);
        } else if (typeof srcs === 'string') {
            srcs = [srcs];
        }
        var sprites = this.sprites,
            dests = [];
        Object.keys(sprites).forEach(function (src) {
            if (srcs.indexOf(src) >= 0) {
                Object.keys(sprites[src].sheets).forEach(function (dest) {
                    if (dests.indexOf(dest) < 0) {
                        dests.push(dest);
                    }
                });
            }
        });
        return uniq(dests);
    },

    collectFellow: function (srcs) {
        return this.collectSrc(this.collectDest(srcs));
    },

    valueOf: function () {
        return {
            version: this.version,
            src: this.src,
            dest: this.dest,
            sprites: this.sprites
        };
    },

    toString: function () {
        return JSON.stringify(this.valueOf(), null, '  ');
    },

    log: function () {
        var sprites = this.sprites,
            results = [];
        Object.keys(sprites).forEach(function (src) {
            var srcdata = this.sprites[src];
            console.log(chalk.cyan(src));
            console.log('  ', chalk.gray('hash:'), srcdata.hash);
            console.log('  ', chalk.gray('geom:'), srcdata.geom);
            if (Object.keys(srcdata.sheets)) {
                console.log('  ', chalk.gray('sheets:'));
                Object.keys(srcdata.sheets).forEach(function (dest) {
                    results.push(['    ', dest, ':', srcdata.sheets[dest]]);
                });
            } else {
                results.push(['  ', chalk.gray('sheets:'), '{}']);
            }
        });
        return results;
    }
};