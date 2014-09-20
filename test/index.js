'use strict';

var chalk = require('chalk'),

    Lab = require('lab'),
    lab = exports.lab = Lab.script(),

    suite = lab.suite,
    test = lab.test,
    before = lab.before,
    after = lab.after,
    expect = Lab.expect;

lab.experiment('utils/array', function () {
    var array = require('../lib/utils/array'),
        flatten = array.flatten,
        uniq = array.uniq;
    lab.test('flatten', function (done) {
        var cases = [null, [1], 2, [
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
        expect(cases.join(',')).to.equal(',1,2,3,4,5,6,7,8,');
        done();
    });
    lab.test('uniq', function (done) {
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
});

lab.experiment('middleware', function () {
    var stylus = require('stylus'),
        stylsprite = require('../lib'),
        options = stylsprite.middleware.options(
            'test/src/stylus',
            'test/public/css',
            'test/public',
            'test/src/imgsrc'
        ),
        stylsprite_mw = stylsprite.middleware(options),
        stylus_mw = stylus.middleware(options);

    lab.test('dummy requests', function (done) {
        var async = require('async'),
            i,
            requests = ['/hoge.css','/fuga.css'];
        requests = requests.map(function(cssPath){
            return {
                method: 'GET',
                url: cssPath
            }
        });
        return async.each(requests, function (req, next) {
            return stylsprite_mw(req, {}, function () {
                return stylus_mw(req, {}, next);
            });
        }, done);
    });
});