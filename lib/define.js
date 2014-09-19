var dirname = require('path').dirname,
    relative = require('path').relative,
    chalk = require('chalk'),
    stylus = require('stylus'),

    URL = require('./url'),
    io = require('./sprite/io'),

    execDefine = function (url, pixelRatio) {
        var data, dir, sprite, src, target,
            canvas_width, canvas_height,
            right, bottom,
            x, y, width, height;
        dir = dirname(url.toAbsolutePath());
        data = io(dir + '.png').read();
        if (!data) {
            return {};
        }
        target = data.sprites[url.toSpritePath()];
        if (!target) {
            return {};
        }
        canvas_width = 0;
        canvas_height = 0;
        for (src in data.sprites) {
            sprite = data.sprites[src];
            x = sprite.geom.x;
            y = sprite.geom.y;
            width = sprite.geom.width;
            height = sprite.geom.height;
            right = x + width;
            bottom = y + height;
            if (right > canvas_width) {
                canvas_width = right;
            }
            if (bottom > canvas_height) {
                canvas_height = bottom;
            }
        }
        x = target.geom.x;
        y = target.geom.y;
        width = target.geom.width;
        height = target.geom.height;
        if (pixelRatio !== 1) {
            canvas_width /= pixelRatio;
            canvas_height /= pixelRatio;
            x /= pixelRatio;
            y /= pixelRatio;
            width /= pixelRatio;
            height /= pixelRatio;
        }
        return {
            'width': width + "px",
            'height': height + "px",
            'background-image': "url('" + url.getSpritePath() + "')",
            'background-position': (-x) + "px " + (-y) + "px",
            'background-size': canvas_width + "px " + canvas_height + "px",
            'background-repeat': "no-repeat"
        };
    };

module.exports = function (destFile, rootPath) {
    var destDir = dirname(destFile),
        cssPath = relative(rootPath, destDir) || '.'
    return function (url, pixelRatio) {
        url = new URL(url, cssPath, rootPath || '.');
        pixelRatio = pixelRatio ? (parseFloat(pixelRatio.val) || 1) : 1;

        var block = this.closestBlock,
            nodes = block.nodes,
            nodesIndex = block.index + 1;
        props = execDefine(url, pixelRatio);
        Object.keys(props).forEach(function (key) {
            var value = props[key],
                prop = new stylus.nodes.Property([key], value);
            nodes.splice(nodesIndex++, 0, prop);
        });
        return null;
    }
}