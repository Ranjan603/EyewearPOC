'use strict';

/* eslint require-jsdoc: 0 */  // --> OFF
/* eslint valid-jsdoc: 0 */  // --> OFF

/**
 * Create a mock module.superModule
 */
function create(mock) {
    module.__proto__.superModule = mock;     // eslint-disable-line
}

/**
 * Delete the mock module.superModule
 */
function remove() {
    delete module.__proto__.superModule;     // eslint-disable-line
}

module.exports = {
    create: create,
    remove: remove
};
