'use strict';

var fs = require('fs'),
    exec = require('child_process').exec,
    async = require('async'),

    chalk = require('chalk'),

    Lab = require('lab'),
    lab = Lab.script(),

    suite = lab.suite,
    test = lab.test,
    before = lab.before,
    after = lab.after,
    expect = Lab.expect;

exports.lab = lab;

lab.experiment('utils', function () {
    var flatten = require('../lib/utils/array').flatten,
        uniq = require('../lib/utils/array').uniq,
        readFilesDeep = require('../lib/utils/fs').readFilesDeep;
    lab.test('array.flatten', function (done) {
        var cases = [
            null, [1], 2, [
                [3, 4], 5
            ],
            [
                [
                    []
                ]
            ],
            [
                [
                    [6]
                ]
            ], 7, 8, [], null
        ];
        cases = flatten(cases);
        // console.log(JSON.stringify(cases, null, '  '));
        expect(cases.join(',')).to.equal(',1,2,3,4,5,6,7,8,');
        done();
    });
    lab.test('array.uniq', function (done) {
        var cases = ['a', 'b', 'a', null, undefined, null, undefined, NaN],
            equal = ['a', 'b', null, undefined],
            result;
        cases = uniq(cases);
        result = cases.every(function (value, index) {
            return equal[index] === value;
        });
        expect(result).to.equal(true);
        done();
    });
    lab.test('fs.readFilesDeep', function (done) {
        /*jslint unparam: true */
        readFilesDeep('test/public', null, null, function (error, result) {
            // console.log('');
            // console.log(JSON.stringify(result, null, '  '));
            // result = flatten(result);
            // console.log(JSON.stringify(result, null, '  '));
            async.each(flatten(result), fs.unlink, function () {
                done();
            });
        });
        /*jslint unparam: false */
    });
});

lab.experiment('middleware', function () {
    var express = require('express'),
        stylus = require('stylus'),
        stylsprite = require('../lib');

    lab.before(function (done) {
        var readFilesDeep = require('../lib/utils/fs').readFilesDeep;
        /*jslint unparam: true */
        readFilesDeep('test/public', null, null, function (error, result) {
            var array = require('../lib/utils/array'),
                flatten = array.flatten;
            async.each(flatten(result), fs.unlink, function () {
                done();
            });
        });
        /*jslint unparam: false */
    });

    lab.test('dummy requests', function (done) {
        var requests = ['/relative.css', '/absolute.css'],
            options = stylsprite.middleware.options(
                'test/src/stylus',
                'test/public/css',
                'test/public',
                'test/src/imgsrc'
            ),
            stylsprite_mw = stylsprite.middleware(options, {
                // verbose: true,
                padding: 2
            }),
            stylus_mw = stylus.middleware(options);
        requests = requests.map(function (cssPath) {
            return {
                method: 'GET',
                url: cssPath
            };
        });
        // simulate `express().use` expression
        return async.each(requests, function (req, next) {
            return stylsprite_mw(req, {}, function () {
                return stylus_mw(req, {}, next);
            });
        }, done);
    });

    lab.test('curl requests', function (done) {
        var app = express(),
            options = stylsprite.middleware.options(
                'test/src/stylus',
                'test/public/css',
                'test/public',
                'test/src/imgsrc'
            ),
            stylsprite_mw = stylsprite.middleware(options, {
                // verbose: true,
                padding: 2
            }),
            stylus_mw = stylus.middleware(options);

        app.set('views', __dirname + '/src');
        app.set('view engine', 'jade');
        app.use('/css', stylsprite_mw);
        app.use('/css', stylus_mw);
        app.use(express["static"](__dirname + '/public'));
        /*jslint unparam: true */
        app.get('/', function (req, res) {
            return res.render('index');
        });
        app.listen(8080, function () {
            exec('curl http://localhost:8080/css/absolute.css', function (error, stdout, stderr) {
                done(error);
            });
        });
        /*jslint unparam: false */
    });
});