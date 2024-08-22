'use strict';

var server = require('server');
server.extend(module.superModule);

server.append(
    'Start',
    function (req, res, next) {
        var datalayer = require('*/cartridge/scripts/datalayer.js');
        datalayer.populate(datalayer.CONTEXT.ERROR, req);
        next();
    }
);

module.exports = server.exports();
