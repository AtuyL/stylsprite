var stream = require('stream'),
    stylus = require('stylus'),
    compile = require('./middleware').compile,
    compileStylusAsync = require('./middleware/compileStylusAsync');
module.exports = function (paths, options) {
    var stream = require('stream'),
        transform = new stream.Transform({
            objectMode: true
        }),
        src = paths.src,
        root = paths.root,
        imgsrc = paths.imgsrc || root;
    transform._transform = function (chunk, encoding, done) {
        // console.log(chunk.toString());
        if (!this.readable) {
            this.push(chunk, encoding);
        } else {
            var self = this,
                cssPath = this._readableState.pipes.path;
            compileStylusAsync(chunk, {
                    stylPath: src,
                    cssPath: cssPath,
                    rootPath: root,
                    imgPath: imgsrc
                },
                options,
                function () {
                    // console.log(self);
                    compile.call({
                        src: src,
                        dest: cssPath,
                        root: root,
                        compress: options.compress,
                        firebug: options.firebug,
                        linenos: options.linenos
                        // paths: [require('path').dirname(src)]
                    }, chunk, src).render(function (error, css) {
                        self.push(css, encoding);
                        done();
                    });
                });
        }
    };
    return transform;
}