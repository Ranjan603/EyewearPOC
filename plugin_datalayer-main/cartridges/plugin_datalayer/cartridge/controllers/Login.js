'use strict';

var server = require('server');
server.extend(module.superModule);

server.append(
    'Show',
    function (req, res, next) {
        var datalayer = require('*/cartridge/scripts/datalayer.js');
        datalayer.populate(datalayer.CONTEXT.LOGIN, req);
        next();
    }
);

module.exports = server.exports();
