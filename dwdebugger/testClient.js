var net = require('net'),
    EventEmitter = require('events').EventEmitter,
    util = require('util');

function Event() {
    EventEmitter.call(this);
}

util.inherits(Event, EventEmitter);

var event = new Event();

var connection = net.createConnection(5858);

connection.
    on('connect', function() {
        console.log('Connection opened');
        event.emit('connect');
        console.log('___________________________');
    }).
    on('data', function(message) {
        console.log(message);
        console.log('___________________________');
    }).
    on('error', function(error) {
        console.log(error);
        console.log('___________________________');
    }).
    on('end', function() {
        console.log('Connection ended');
        console.log('___________________________');
    }).
    on('close', function() {
        console.log('Connection closed');
        console.log('___________________________');
    }).
    setEncoding('utf8');

event.on('connect', function() {
    var messages = ['{ "command": "evaluate", "arguments": { "expression": "process.pid", "global": true }, "type": "request", "seq": 0 }',
        '{ "command": "frame", "type": "request", "seq": 1 }',
        '{ "command": "listbreakpoints", "type": "request", "seq": 4 }',
        '{ "command": "setbreakpoint", "arguments": { "type": "scriptRegExp", "target": "^\/Users\/ivolodin\/Documents\/Code\/debugger\/abasdfasdf\.js$", "line": 4, "column": 0 }, "type": "request", "seq": 5 }',
        '{ "command": "threads", "type": "request", "seq": 7 }']
        // '{ "type": "request", "command": "scripts", "seq": 4 }'];
    var sendMessage = function(index) {
        if (messages[index]) {
            console.log('Sending ', messages[index]);
            connection.write('Content-Length: ' + Buffer.byteLength(messages[index], 'utf8') + '\r\n\r\n' + messages[index]);
            setTimeout(function() { sendMessage(index + 1); }, 3000);
        }
    }
    setTimeout(function() { sendMessage(0); }, 1000);
});