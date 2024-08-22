'use strict';

function find(array, matcher) {
    for (var i = 0, l = array.length; i < l; i++) {
        if (matcher(array[i], i)) {
            return array[i];
        }
    }

    return undefined;
}

module.exports = {
    find: find
};
