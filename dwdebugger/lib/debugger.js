'use strict';

var SocketHandler = require('./socketHandler'),
    SocketWriter = require('./socketWriter'),
    assign = require('object-assign'),
    chalk = require('chalk'),
    path = require('path'),
    fs = require('fs'),
    requestProcessor = require('./requestProcessor'),
    vsc = require('./vscRequestProcessor'),
    ni = require('./niRequestProcessor'),
    RefManager = require('./refManager');

function Debugger(options, serverRequest) {
    this.options = assign({}, {
        port: 5858
    }, options);
    this.serverRequest = serverRequest;
    this.initialize();
    this.state = {
        lastSeq: 0,
        initializing: false,
        currentThread: null,
        isRunning: false,
        activeBreakpoints: {},
        onBreakPoint: false,
        haltedBreakpointData: null,
        refManager: new RefManager(),
        files: {},
        addFile: function (fileName) {
            this.files[fileName] = Object.keys(this.files).length;
            return Object.keys(this.files).length;
        },
        getId: function (fileName) {
            return Object.keys(this.files).indexOf(fileName) + 1;
        }
    }
}

Debugger.prototype = {
    initialize: function () {
        this.socketHandler = new SocketHandler(this.options.port);
        this.socketHandler.on('connection', function (socket) {
            console.log(chalk.green('Client connected'));
            this.socketWriter = new SocketWriter(socket);
            this.socketWriter.writeHeader();
            this.state.initializing = true;
        }.bind(this));

        this.socketHandler.on('close', function () {
            console.log('All clients disconnected');
        }.bind(this));

        this.socketHandler.on('error', function (error) {
            console.error(chalk.red('Sockets error'), error);
        }.bind(this));

        this.socketHandler.on('start', function () {
            console.log('Debugger listening on port ' + this.options.port);
            this.serverRequest.createClient().then(function () {
                console.info(chalk.green('Connection to the server opened'));
            }).catch(function (err) {
                console.error(chalk.red('Couldn\'t create server connection'), err);
            });
        }.bind(this));

        this.socketHandler.on('data', function (message) {
            this.state.lastSeq = message.seq;
            this.processRequest(message).then(function (response) {
                if (response === null) {
                    return;
                }
                if (Array.isArray(response)) {
                    response.forEach(function (item) {
                        this.socketWriter.write(this.socketWriter.buildResponse(message.seq, ++this.state.lastSeq, message.command, item));
                    }, this);
                } else {
                    this.socketWriter.write(this.socketWriter.buildResponse(message.seq, ++this.state.lastSeq, message.command, response));
                }
            }.bind(this));
        }.bind(this));

        this.socketHandler.on('end', function () {
            this.state.onBreakPoint = false;
            this.state.isRunning = false;
            console.log(chalk.red('Client disconnected'));
            this.serverRequest.destroyClient();
        }.bind(this));

        this.serverRequest.events.on('break', function (thread) {
            this.state.onBreakPoint = true;
            var callstack = thread.call_stack[0];
            this.state.currentThread = thread;
            var breakpointId = -1;
            Object.keys(this.state.activeBreakpoints).forEach(function (key) {
                if (this.state.activeBreakpoints[key].filePath === callstack.location.script_path && this.state.activeBreakpoints[key].lineNumber === callstack.location.line_number + 1) {
                    breakpointId = parseInt(key);
                }
            }, this);
            console.log(chalk.red('Halted on breakpoint'), breakpointId);

            var file = fs.readFileSync(path.join(this.options.cwd, callstack.location.script_path), 'utf8');
            var lines = file.split('\n');
            var workingLine = lines[callstack.location.line_number - 1];

            function countLeadingSpaces(str) {
                return str.match(/^(\s*)/)[1].length;
            }

            this.socketWriter.write(this.socketWriter.buildEvent(++this.state.lastSeq, {
                body: {
                    invocationText: 'dummyValue',
                    sourceLine: callstack.location.line_number - 1,
                    sourceColumn: countLeadingSpaces(workingLine),
                    sourceLineText: workingLine,
                    script: {
                        id: this.state.files[path.join(this.options.cwd, callstack.location.script_path)],
                        name: path.join(this.options.cwd, callstack.location.script_path),
                        lineOffset: 0,
                        columnOffset: 0,
                        lineCount: lines.length + 1
                    },
                    breakpoints: [breakpointId]
                }
            }));
            this.state.isRunning = false;
            this.serverRequest.clearServerEvent();
        }.bind(this));
    },

    processRequest: function (request) {
        console.log(chalk.green('Recieved request'), JSON.stringify(request));
        if (request.type === 'request') {
            switch (this.options.environment) {
                // vsc is Visual Studio Code
                case 'vsc':
                    if (request.command !== 'evaluate') {
                        this.state.initializing = false;
                    }

                    if (vsc[request.command]) {
                        return vsc[request.command](request, this.state, this.serverRequest, this.options);
                    } else {
                        return requestProcessor[request.command](request, this.state, this.serverRequest, this.options);
                    }
                    break;
                //ni is Node Inspector
                case 'ni':
                    if (request.command !== 'evaluate') {
                        this.state.initializing = false;
                    }
                    if (request.command === 'evaluate') {
                        return ni.evaluate(request, this.state, this.serverRequest, this.options);
                    } else {
                        var requestProc = requestProcessor[request.command](request, this.state, this.serverRequest, this.options);
                        return requestProc;
                    }
                default:
            }
        }
    }
};

module.exports = Debugger;