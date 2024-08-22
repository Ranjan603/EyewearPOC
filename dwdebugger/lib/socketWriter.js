var assign = require('object-assign'),
    chalk = require('chalk');

function SocketWriter(socket) {
    this.socket = socket;
    this.lock = false;
    this.messageQueue = [];
}

SocketWriter.prototype = {
    writeHeader: function () {
        this.send('Type: connect\r\nV8-Version: 0.0.0.1\r\nProtocol-Version: 1\r\nEmbedding-Host: node v0.12.9\r\nContent-Length: 0\r\n');
    },

    write: function (data, appendLength) {
        if (typeof data !== 'object') {
            throw new Error('Can\'t send anything other then JSON');
        }
        var payload = JSON.stringify(data);
        console.log(chalk.yellow('Sending back'), payload);
        if (typeof appendLength === 'undefined') {
            appendLength = true;
        }
        var message = appendLength ? 'Content-Length: ' + Buffer.byteLength(payload, 'utf8') + '\r\n\r\n' + payload : payload;
        this.send(message);
    },

    send: function (message) {
        if (this.lock || !this.socket.writable) {
            this.messageQueue.push(message);
        } else {
            this.lock = this.socket.write(message, this.processQueue.bind(this));
        }
    },

    processQueue: function () {
        this.lock = false;
        if (this.messageQueue.length > 0) {
            var messageToSend = this.messageQueue[0];
            this.messageQueue.splice(0, 1);
            this.send(messageToSend);
        }
    },

    buildEvent: function (seq, body) {
        var response = {
            seq: seq,
            type: 'event',
            event: 'break'
        };
        return assign({}, response, body);
    },

    buildResponse: function (requestSeq, seq, command, output, isSuccess, isRunning) {
        var customResponse = {
            request_seq: requestSeq,
            command: command,
            success: typeof isSuccess === 'undefined' ? true : isSuccess,
            running: typeof isRunning === 'undefined' ? true : isSuccess
        };

        if (typeof output === 'object') {
            assign(customResponse, output);
        } else {
            customResponse.body = output;
        }

        return assign({}, {
            seq: seq,
            type: 'response',
            success: true,
            running: false
        }, customResponse);
    }
};

module.exports = SocketWriter;