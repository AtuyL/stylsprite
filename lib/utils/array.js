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
    },
    uniq = function (a, b) {
        if (a == null) {
            a = [];
        }
        if (!Array.isArray(a)) {
            a = [a];
        }
        if (~(a.indexOf(b))) {
            return a;
        } else {
            return a.concat(b);
        }
    };

module.exports = {
    flatten: flatten,
    uniq: uniq
};