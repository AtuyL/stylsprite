var fs = require('fs'),
    http = require('http'),
    express = require('express'),
    stylus = require('stylus'),
    stylsprite = require('../lib'),
    arrayUtils = require('../lib/utils/array'),
    async = require('async'),
    join = require('path').join,
    relative = require('path').relative,
    tests = [];

tests.push(function (next) {
    var cases = [null, [1], 2, [[3, 4], 5], [[[]]], [[[6]]], 7, 8, [], null];
    console.log(cases.reduce(arrayUtils.flatten));
    return next();
});

tests.push(function (next) {
    var eachRequest, index, options, requests, stylsprite_mw, stylus_mw, i;
    options = {
        src: 'test/src/stylus',
        dest: 'test/public/css',
        root: 'test/public',
        imgsrc: 'test/src/imgsrc'
    };
    stylsprite_mw = stylsprite.middleware(options);
    options.compile = stylsprite.middleware.compile;
    options.compile = function (str, path) {
        var context, dest, destFile, root, src;
        dest = this.dest, src = this.src, root = this.root;
        context = stylus(str);
        destFile = join(dest, relative(src, path).replace(/\.styl$/, '.css'));
        context.define('stylsprite', stylsprite(destFile, root));
        return context;
    };
    stylus_mw = stylus.middleware(options);
    requests = [];
    for (index = i = 0; i < 5; index = ++i) {
        requests.push({
            method: 'GET',
            url: '/hoge.css'
        });
        requests.push({
            method: 'GET',
            url: '/fuga.css'
        });
    }
    eachRequest = function (req, next) {
        return stylsprite_mw(req, {}, function () {
            return stylus_mw(req, {}, next);
        });
    };
    return async.each(requests, eachRequest, function () {
        return next();
    });
});

async.series(tests, function (error) {
    var app, options;
    if (error) {
        return console.log(error);
    }
    app = express();
    app.set('views', __dirname + '/src');
    app.set('view engine', 'jade');
    options = {
        src: 'test/src/stylus',
        dest: 'test/public/css',
        root: 'test/public',
        imgsrc: 'test/src/imgsrc'
    };
    app.use('/css', stylsprite.middleware(options));
    options.compile = stylsprite.middleware.compile;
    app.use('/css', stylus.middleware(options));
    app.use(express["static"](__dirname + '/public'));
    app.get('/', function (req, res) {
        return res.render('index');
    });
    return app.listen(8080);
});