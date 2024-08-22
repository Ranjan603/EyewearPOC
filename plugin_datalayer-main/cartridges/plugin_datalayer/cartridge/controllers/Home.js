'use strict';

var server = require('server');
server.extend(module.superModule);

server.append(
    'Show',
    function (req, res, next) {
        var datalayer = require('*/cartridge/scripts/datalayer.js');
        datalayer.populate(datalayer.CONTEXT.HOMEPAGE, req);

        next();
    }
);

server.append(
    'ErrorNotFound',
    function (req, res, next) {
        var datalayer = require('*/cartridge/scripts/datalayer.js');
        datalayer.populate(datalayer.CONTEXT.ERRORNOTFOUND, req, 'error-general');
        next();
    }
);

module.exports = server.exports();
