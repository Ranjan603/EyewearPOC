'use strict';

/**
 * @namespace RedirectURL
 */

var server = require('server');
const base = module.superModule;
server.extend(base);

server.append('Start', function (req, res, next) {
    if (res.getViewData().is404) {
        var datalayer = require('*/cartridge/scripts/datalayer.js');
        datalayer.populate(datalayer.CONTEXT.ERRORNOTFOUND, req, 'error-general');
    }

    return next();
});

module.exports = server.exports();
