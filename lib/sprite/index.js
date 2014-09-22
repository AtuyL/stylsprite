var version = (require('../../package.json')).version,
    fs = require('fs'),
    resolve = require('path').resolve,
    relative = require('path').relative,
    join = require('path').join,
    async = require('async'),
    chalk = require('chalk'),

    fsUtils = require('../utils/fs'),

    flatten = require('../utils/array').flatten,
    uniq = require('../utils/array').uniq,

    packer = require('./packer'),
    Helper = require('./helper'),
    IO = require('./io'),

    readCurrent = function (src, dest, options, callback) {
        if (options.verbose) {
            console.log(chalk.red('---------------- readCurrent ----------------'));
        }
        async.every([src, dest], fsUtils.checkExist, function (is_exist) {
            var current = new IO(dest).read() || {};
            if (!is_exist || current.version !== version) {
                current.version = version;
                current.sprites = {};
            } else {
                current.sprites = current.sprites || {};
            }
            current.src = src;
            current.dest = dest;
            current = new Helper(current);
            return callback(null, current, options);
        });
    },

    prepareCurrent = function (current, options, callback) {
        if (options.verbose) {
            console.log(chalk.red('---------------- prepareCurrent ----------------'));
        }
        var files = current.collectSrc(),
            iterator;
        if (!files.length) {
            return callback(null, current, options);
        }
        iterator = function (file, callback) {
            fsUtils.checkExist(file, function (is_exist) {
                if (!is_exist) {
                    Object.keys(current.sprites).forEach(function (src) {
                        current.sprites[src].hash = '';
                    });
                }
                callback();
            });
        };
        async.each(files, iterator, function () {
            return callback(null, current, options);
        });
    },

    prepareTasks = function (current, options, callback) {
        var REG_IMG, isImage, isNotSprite;
        if (options.verbose) {
            console.log(chalk.red('---------------- prepareTasks ----------------'));
        }
        REG_IMG = /\.(?:png|je?pg|gif|bmp)$/i;
        isImage = function (path, stat) {
            return stat.isFile() && REG_IMG.test(path) ? path : null;
        };
        isNotSprite = function (file, next) {
            file = file.replace(REG_IMG, '');
            return fsUtils.checkExist(file, function (is_exist) {
                return next(!is_exist);
            });
        };
        return fsUtils.readFilesDeep(current.src, 1, isImage, function (error, src) {
            if (error) {
                return callback(current.src + error.toString());
            }
            src = flatten(src);
            src = uniq(src);
            src = src.filter(function (path) {
                return path !== null;
            });
            async.filter(src, isNotSprite, function (src) {
                return callback(error, current, src, options);
            });
        });
    },

    readIdentifyAll = function (current, src, options, callback) {
        if (options.verbose) {
            console.log(chalk.red('---------------- readIdentifyAll ----------------'));
        }
        packer.readIdentify(src, function (error, prepered) {
            if (error) {
                return callback(error);
            }
            if (options.verbose) {
                console.log(chalk.green.bold(current.src));
                src.forEach(function (file) {
                    console.log(chalk.cyan(file));
                });
            }
            callback(error, current, prepered, options);
        });
    },

    formatIdentifies = function (current, prepered, options, callback) {
        if (options.verbose) {
            console.log(chalk.red('---------------- formatIdentifies ----------------'));
        }
        var sprites = {};
        prepered.forEach(function (image) {
            var src = image.src,
                hash = image.hash,
                geom = image.geom;
            src = relative(current.src, src);
            sprites[src] = {
                hash: hash,
                geom: geom
            };
        });
        callback(null, current, sprites, options);
    },

    extractDiff = function (current, sprites, options, callback) {
        if (options.verbose) {
            console.log(chalk.red('---------------- extractDiff ----------------'));
        }
        // console.log('current:',current);
        // console.log('sprites:',sprites);
        var requireUpdate = Object.keys(current.sprites).length !== Object.keys(sprites).length;
        if (!requireUpdate) {
            requireUpdate = Object.keys(sprites).some(function (src) {
                var a = current.sprites[src],
                    b = sprites[src];
                return (!a || a.hash !== b.hash);
            });
        }
        if (requireUpdate) {
            return callback(null, current, sprites, options);
        }
        return callback('cached.');
    },

    execPacking = function (current, sprites, options, callback) {
        if (options.verbose) {
            console.log(chalk.red('---------------- execPacking ----------------'));
        }
        var padding = options.padding || 0,
            pack_list = Object.keys(sprites).map(function (src) {
                var sprite = sprites[src];
                return {
                    src: src,
                    width: sprite.geom.width + padding,
                    height: sprite.geom.height + padding
                };
            }),
            packed = packer.execPacking(pack_list);
        Object.keys(packed).forEach(function (src) {
            var pos = packed[src];
            var sprite = sprites[src];
            sprite.geom.x = pos.x;
            sprite.geom.y = pos.y;
            sprites[src] = sprite;
        });
        callback(null, current, sprites, options);
    },

    outputSprite = function (current, sprites, options, callback) {
        if (options.verbose) {
            console.log(chalk.red('---------------- outputSprite ----------------'));
        }
        var dest_io = new IO(current.dest),
            images;
        if (dest_io.isLocked()) {
            return callback(current.dest + " : io is locked");
        }
        dest_io.lock();
        images = {};
        Object.keys(sprites).forEach(function (src) {
            images[join(current.src, src)] = sprites[src].geom;
        });
        fsUtils.checkExist(current.dest, function (is_exist) {
            if (options.verbose) {
                var msgtag = is_exist ? chalk.green('update:') : chalk.cyan('create:');
                console.log(msgtag, current.dest);
            }
            return packer.outputSpriteSheet(current.dest, images, function (error) {
                if (error) {
                    console.log(error);
                }
                return callback(null, current, sprites, options);
            });
        });
    },

    updateData = function (current, sprites, options, callback) {
        if (options.verbose) {
            console.log(chalk.red('---------------- updateData ----------------'));
        }
        Object.keys(sprites).forEach(function (src) {
            current.sprites[src] = sprites[src];
        });
        new IO(current.dest).write(current.valueOf());
        if (options.verbose) {
            console.log(JSON.stringify(current, null, '  '));
        }
        callback();
    };


/*
 * execute task.
 */

module.exports = function (dir, root, imgsrc, options, callback) {
    if (typeof callback !== 'function') {
        callback = function () {
            console.log('callback');
        };
    }

    var src = resolve(dir),
        dest = resolve(join(root, relative(imgsrc, src)) + '.png'),
        done = function (error) {
            new IO(dest).unlock();
            if (options.verbose) {
                console.log(chalk.red("---------------- " + (error || "DONE") + " ----------------"));
            }
            callback(error);
        };

    options = {
        verbose: options.verbose || false,
        padding: isNaN(options.padding) ? 0 : options.padding
    };

    // console.log(src, dest, options);

    async.waterfall(
        [

            function (next) {
                return next(null, src, dest, options);
            },
            readCurrent,
            prepareCurrent,
            prepareTasks,
            readIdentifyAll,
            formatIdentifies,
            extractDiff,
            execPacking,
            outputSprite,
            updateData
        ],
        done
    );
};