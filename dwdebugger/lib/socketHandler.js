'use strict';

var net = require('net'),
    EventEmitter = require('events').EventEmitter,
    util = require('util');

var byteArrayToString = function (bytes) {
    return (new Buffer(bytes)).toString('utf8');
}

var parseMessage = function (message) {
    var data = byteArrayToString(message);
    var item = data.replace(/^Content-Length:(\s?)*[0-9]+$/gm, '').replace(/^\r?\n/gm, '');
    if (!item) {
        return null;
    }
    try {
        return JSON.parse(item);
    } catch (e) {
        throw new Error('Couldn\'t parser message', e);
    }
};

var SocketHandler = function (port) {
    this.server = net.createServer();

    ['close', 'error', 'listning'].forEach(function (item) {
        this.server.on(item, function (args) {
            this.emit(item, args);
        }.bind(this));
    }.bind(this));

    this.server.on('connection', function (socket) {
        socket.on('data', function (data) {
            var messageString = byteArrayToString(data);
            if (messageString.indexOf('}Content-Length') >= 0) {
                //multiple message in one request
                var messages = [];
                var index = messageString.indexOf('}Content-Length');
                while (index >= 0) {
                    messages.push(messageString.substr(0, index + 1));
                    messageString = messageString.substr(index + 1, messageString.length - index + 1);
                    index = messageString.indexOf('}Content-Length');
                }
                messages.forEach(function (item) {
                    var message = parseMessage(item);
                    if (message) {
                        this.emit('data', message);
                    }
                }, this);
            } else {
                var message = parseMessage(data);
                if (message) {
                    this.emit('data', message);
                }
            }
        }.bind(this));

        socket.on('end', function () {
            this.emit('end');
        }.bind(this));
        this.emit('connection', socket);
    }.bind(this));

    this.server.listen(port, function (err) {
        if (err) {
            this.emit('error', err);
        }
        this.emit('start', port);
    }.bind(this));
};

util.inherits(SocketHandler, EventEmitter);

module.exports = SocketHandler;