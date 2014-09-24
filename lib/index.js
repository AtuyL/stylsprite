module.exports = require('./sprite');
module.exports.define = require('./define');
module.exports.transform = require('./transform');
module.exports.middleware = require('./middleware');

var Renderer = require('./renderer');
module.exports.render = function(str, options, callback){
    new Renderer(str, options).render(callback);
}