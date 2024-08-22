'use strict';

var server = require('server');
server.extend(module.superModule);

server.get('UncachedData', function (req, res, next) {
    var datalayer = require('*/cartridge/scripts/datalayer.js');
    datalayer.populate(datalayer.CONTEXT.PERSONALIZED, req);
    res.render('/header/uncachedData');
    next();
});

server.append(
    'Show',
    function (req, res, next) {
        var datalayer = require('*/cartridge/scripts/datalayer.js');
        datalayer.populate(datalayer.CONTEXT.CONTENT, req);

        next();
    }
);

module.exports = server.exports();
