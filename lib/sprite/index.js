var version = (require('../../package.json')).version,
    fs = require('fs'),
    resolve = require('path').resolve,
    relative = require('path').relative,
    join = require('path').join,
    async = require('async'),
    chalk = require('chalk'),
    _ = require('lodash'),
    fsUtils = require('../utils/fs'),
    arrayUtils = require('../utils/array'),
    packer = require('./packer'),
    helper = require('./helper'),
    io = require('./io'),

    readCurrent = function (src, dest, options, callback) {
        if (options.verbose) {
            console.log(chalk.red('---------------- readCurrent ----------------'));
        }
        fsUtils.checkExist(src, function (is_exist) {
            var current = io(dest).read() || {};
            if (!is_exist || current.version !== version) {
                current.version = version;
                current.sprites = {};
            } else {
                if (current.sprites == null) current.sprites = {};
            }
            current.src = src;
            current.dest = dest;
            current = new helper(current);
            return callback(null, current, options);
        });
    },

    prepareCurrent = function (current, options, callback) {
        if (options.verbose) {
            console.log(chalk.red('---------------- prepareCurrent ----------------'));
        }
        var files, iterator;
        files = current.collectSrc();
        if (!files.length) return callback(null, current, options);
        iterator = function (file, callback) {
            fsUtils.checkExist(file, function (is_exist) {
                var sprite, src;
                if (!is_exist) {
                    for (src in current.sprites) {
                        sprite = current.sprites[src];
                        sprite.hash = '';
                    }
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
            if (stat.isFile() && REG_IMG.test(path)) {
                return path;
            } else {
                return null;
            }
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
            src = src.reduce(arrayUtils.flatten);
            src = src.reduce(arrayUtils.uniq);
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
            if (error) return callback(error);
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
        var a, b, src,
            requireUpdate = Object.keys(current.sprites).length !== Object.keys(sprites).length;
        if (!requireUpdate) {
            for (src in sprites) {
                b = sprites[src];
                if (!(a = current.sprites[src])) {
                    requireUpdate = true;
                    break;
                }
                if (a.hash !== b.hash) {
                    requireUpdate = true;
                    break;
                }
            }
        }
        if (requireUpdate) {
            return callback(null, current, sprites, options);
        } else {
            return callback('cached.');
        }
    },

    execPacking = function (current, sprites, options, callback) {
        if (options.verbose) {
            console.log(chalk.red('---------------- execPacking ----------------'));
        }
        var pos, sprite, src, packed,
            padding = options.padding || 0,
            pack_list = [];
        for (src in sprites) {
            sprite = sprites[src];
            pack_list.push((function () {
                return {
                    src: src,
                    width: sprite.geom.width + padding,
                    height: sprite.geom.height + padding
                };
            })());
        }
        packed = packer.execPacking(pack_list);
        for (src in packed) {
            pos = packed[src];
            sprite = sprites[src];
            sprite.geom.x = pos.x;
            sprite.geom.y = pos.y;
            sprites[src] = sprite;
        }
        callback(null, current, sprites, options);
    },

    outputSprite = function (current, sprites, options, callback) {
        if (options.verbose) {
            console.log(chalk.red('---------------- outputSprite ----------------'));
        }
        var dest, images, sprite, src;
        if (io(current.dest).isLocked()) {
            return callback("" + current.dest + " : io is locked");
        }
        io(current.dest).lock();
        images = {};
        for (src in sprites) {
            sprite = sprites[src];
            images[join(current.src, src)] = sprite.geom;
        }
        dest = current.dest;
        fsUtils.checkExist(dest, function (is_exist) {
            var msgtag;
            msgtag = is_exist ? chalk.green('update:') : chalk.cyan('create:');
            return packer.outputSpriteSheet(dest, images, function (error) {
                return callback(null, current, sprites, options);
            });
        });
    },

    updateData = function (current, sprites, options, callback) {
        if (options.verbose) {
            console.log(chalk.red('---------------- updateData ----------------'));
        }
        var sprite, src;
        for (src in sprites) {
            sprite = sprites[src];
            current.sprites[src] = sprite;
        }
        io(current.dest).write(current.valueOf());
        if (options.verbose) {
            console.log(JSON.stringify(current, null, '  '));
        }
        callback();
    };


/*
 * execute task.
 */

module.exports = function (dir, options, callback) {
    var dest, destPath, done, imgPath, rootPath, src, srcPath, tasks;
    srcPath = options.srcPath, destPath = options.destPath, rootPath = options.rootPath, imgPath = options.imgPath;
    src = resolve(dir);
    dest = resolve(join(rootPath, relative(imgPath, src)) + '.png');
    if (typeof callback !== 'function') {
        callback = (function () {});
    }
    done = function (error) {
        io(dest).unlock();
        if (options.verbose) {
            console.log(chalk.red("---------------- " + (error || "DONE") + " ----------------"));
        }
        callback(error);
    };
    options.verbose = false;
    options.padding = 0;
    tasks = [

        function (next) {
            return next(null, src, dest, options);
        },
        readCurrent, prepareCurrent, prepareTasks, readIdentifyAll, formatIdentifies, extractDiff, execPacking, outputSprite, updateData
    ];
    async.waterfall(tasks, done);
};