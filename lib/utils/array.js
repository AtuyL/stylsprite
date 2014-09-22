var flatten = function (array) {
        var reducer = function (a, b) {
            a = Array.isArray(a) ? a.reduce(reducer,[]) : a;
            b = Array.isArray(b) ? b.reduce(reducer,[]) : b;
            return a.concat(b);
        }
        return array.reduce(reducer,[]);
    },
    uniq = function (array) {
        if (array.length <= 1) return array;
        return array.reduce(function (a, b) {
            a = a == null ? [] : Array.isArray(a) ? a : [a];
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