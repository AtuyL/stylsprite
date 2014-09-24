var stream = require('stream'),
    stylus = require('stylus'),
    compile = require('./middleware').compile,
    Renderer = require('./renderer');
module.exports = function (stylFile, options) {
    var stream = require('stream'),
        transform = new stream.Transform({
            objectMode: true
        });
    transform._transform = function (chunk, encoding, done) {
        var str = chunk.toString();
        if (!this.readable) {
            this.push(str, encoding);
        } else {
            // var self = this;

            options.stylFile = stylFile;
            options.cssFile = this._readableState.pipes.path;

            new Renderer(str, options).render(function () {
                done();
            });
        }
    };
    return transform;
};