var flatten = function (array) {
        var flatten = function (a, b) {
            if (!Array.isArray(a)) {
                a = [a];
            } else {
                a = a.reduce(flatten, []);
            }
            if (!Array.isArray(b)) {
                b = [b];
            } else {
                b = b.reduce(flatten, []);
            }
            return a.concat(b);
        }
        return array.reduce(flatten);
    },
    uniq = function (array) {
        if (array.length <= 1) return array;
        return array.reduce(function (a, b) {
            if (a == null) {
                a = [];
            }
            if (!Array.isArray(a)) {
                a = [a];
            }
            if (~(a.indexOf(b)) || typeof b === 'number' && isNaN(b)) {
                return a;
            } else {
                return a.concat(b);
            }
        });
    };

module.exports = {
    flatten: flatten,
    uniq: uniq
};