'use strict';

var path = require('path'),
    fs = require('fs'),
    globData = require('./globData.js');

function getFrameVariables(frameId, threadId, serverRequest) {
    return new Promise(function (resolve) {
        serverRequest.send('/threads/' + threadId + '/frames/' + frameId + '/members', 'get').then(function (result) {
            var properties = result.body.object_members.map(function (object) {
                return {
                    name: object.name,
                    propertyType: 0
                }
            });
            resolve(properties);
        }).catch(function () {
            resolve([]);
        });
    });
}

var RequestProcessor = function () {
};

RequestProcessor.prototype = {
    evaluate: function (payload, state) {
        //evaluate expression
        if (state.initializing) {
            return new Promise(function (resolve) {
                resolve({ body: { handle: 13131, type: 'boolean', value: true, text: 'true' }, refs: [] });
            });
        } else {
            if (state.currentThread) {
                // send request to the server
            } else {
                state.refManager.resetRefTable();
                return new Promise(function (resolve) {
                    var item = {
                        body: state.refManager.addHandler({
                            type: 'object',
                            className: 'Object',
                            constructorFunction: {
                                ref: state.refManager.undefinedRef
                            },
                            protoObject: {
                                ref: state.refManager.undefinedRef
                            },
                            prototypeObject: {
                                ref: state.refManager.undefinedRef
                            },
                            properties: [],
                            text: '#'
                        }),
                        refs: state.refManager.getRefs()
                    };
                    resolve(item);
                });
            }
            return new Promise(function (resolve) {
                resolve({});
            });
        }
    },

    frame: function (payload, state, serverRequest) {
        return serverRequest.send('/threads', 'get').then(function (res) {
            if (res.body.script_threads) {
                //get first thread
                var id = res.body.script_threads[0].id;
                var frameId = res.body.script_threads[0].call_stack[0].index;
                return serverRequest.send('/threads/' + id + '/frames/' + frameId, 'get');
            } else {
                return new Promise(function (resolve) {
                    resolve({ message: 'No frames', success: false });
                });
            }
        }).catch(function (err) {
            console.error(err);
        });
    },

    listbreakpoints: function (payload, state, serverRequest) {
        return serverRequest.send('/breakpoints', 'get').then(function (res) {
            if (res.body.breakpoints) {
                return {
                    body: {
                        breakpoints: res.body.breakpoints.map(function (breakpoint) {
                            return { type: 'script', breakpoint: breakpoint.id };
                        }), breakOnExceptions: false, breakOnUncaughtExceptions: false
                    }
                };
            } else {
                return { body: { breakpoints: [], breakOnExceptions: false, breakOnUncaughtExceptions: false } };
            }
        });
    },

    setexceptionbreak: function (payload) {
        return new Promise(function (resolve) {
            resolve({ body: payload.arguments });
        });
    },

    setbreakpoint: function (payload, state, serverRequest, options) {
        var setBreakpoint = function (breakpoint) {
            return serverRequest.send('/breakpoints', 'post', JSON.stringify(breakpoint)).then(function (res) {
                state.activeBreakpoints[res.body.breakpoints[0].id] = {
                    filePath: res.body.breakpoints[0].script_path,
                    lineNumber: res.body.breakpoints[0].line_number + 1
                };

                if (!state.isRunning && state.currentThread) {
                    var action = '';
                    serverRequest.send('/threads/' + state.currentThread.id + '/' + action, 'post').then(function () {
                        serverRequest.waitForServerEvent(state.currentThread.id);
                        state.isRunning = true;
                    });
                } else if (!state.isRunning && !state.currentThread) {
                    serverRequest.waitForServerEvent(null);
                    state.isRunning = true;
                }
                return {
                    body: {
                        type: 'scriptName',
                        breakpoint: res.body.breakpoints[0].id,
                        script_name: path.join(options.cwd, breakpoint.breakpoints[0].script_path),
                        line: payload.arguments.line,
                        column: payload.arguments.column,
                        actual_locations: [

                        ],
                        refs: [],
                        running: false
                    }
                };
            });
        };

        var breakpoint = null;

        switch (payload.arguments.type) {
            case 'script':
                breakpoint = {
                    breakpoints: [{
                        line_number: payload.arguments.line + 1,
                        script_path: '/' + path.relative(options.cwd, payload.arguments.target)
                    }]
                };
                return setBreakpoint(breakpoint);
            case 'scriptRegExp':
                var fixedTarget = payload.arguments.target.replace(/\^|\(.*\)|\?|\\|\$/g, '');
                if (fixedTarget) {
                    breakpoint = {
                        breakpoints: [{
                            line_number: payload.arguments.line + 1,
                            script_path: '/' + path.relative(options.cwd, fixedTarget)
                        }]
                    };
                    return serverRequest.send('/breakpoints', 'post', JSON.stringify(breakpoint)).then(function (res) {
                        state.activeBreakpoints[res.body.breakpoints[0].id] = {
                            filePath: res.body.breakpoints[0].script_path,
                            lineNumber: res.body.breakpoints[0].line_number - 1
                        };

                        return {
                            body: {
                                type: 'scriptRegExp',
                                breakpoint: res.body.breakpoints[0].id,
                                script_regexp: payload.arguments.target,
                                line: payload.arguments.line,
                                column: payload.arguments.column,
                                actual_locations: [{
                                    line: payload.arguments.line,
                                    column: 4,
                                    script_id: 42
                                }]
                            }
                        };
                    });
                } else {
                    return new Promise(function (resolve) {
                        resolve({
                            body: {
                                type: 'scriptRegExp',
                                breakpoint: 2222,
                                script_regexp: payload.arguments.target,
                                line: payload.arguments.line,
                                column: null,
                                actual_locations: [{ line: 0, column: 0, script_id: 72 }]
                            }, refs: []
                        });
                    });
                }
            case 'function':
            case 'scriptId':
            default:
                return new Promise(function (resolve) {
                    resolve({ body: { type: 'function', breakpoint: -1 } });
                });
        }
    },

    'continue': function (payload, state, serverRequest) {
        // continue has 4 state: into, out, over and resume
        var action = 'resume';
        if (payload.arguments) {
            switch (payload.arguments.stepaction) {
                case 'in': action = 'into'; break;
                case 'next': action = 'over'; break;
                case 'out': action = 'out'; break;
                default: action = 'resume'; break;
            }
        }

        if (!state.isRunning && state.currentThread) {
            serverRequest.send('/threads/' + state.currentThread.id + '/' + action, 'post').then(function () {
                if (action === 'resume') {
                    serverRequest.waitForServerEvent(state.currentThread.id);
                    state.isRunning = true;
                } else {
                    //get new thread information
                    serverRequest.checkForHaltedThread().then(function (thread) {
                        serverRequest.events.emit('break', thread);
                    });
                }
            });
        } else if (!state.isRunning && !state.currentThread) {
            serverRequest.waitForServerEvent(null);
            state.isRunning = true;
        }

        return new Promise(function (resolve) {
            resolve('');
        });
    },

    threads: function (payload, state) {
        if (state.currentThread) {
            return new Promise(function (resolve) {
                resolve({ body: { totalThreads: 1, threads: [{ current: true, id: 1 }] }, running: false, refs: [] });
            });
        } else {
            return new Promise(function (resolve) {
                resolve({ body: { totalThreads: 0 } });
            });
        }
    },

    lookup: function (payload, state) {
        var handles = [],
            refs = [];
        payload.arguments.handles.forEach(function (handle) {
            var ref = state.refManager.findRefByHandle(handle);
            handles.push(ref);
            refs = refs.concat(state.refManager.getAllRefsForHandle(ref).map(function (item) {
                return state.refManager.findRefByHandle(item);
            }));
        });
        return new Promise(function (resolve) {
            var body = {};
            handles.forEach(function (handle) {
                body[handle.handle] = handle;
            });
            resolve({
                body: body,
                refs: refs
            });
        });
    },

    backtrace: function (payload, state, serverRequest, options) {
        if (state.curentThread !== null) {
            state.refManager.resetRefTable();

            var callStack = state.currentThread.call_stack,
                frames = callStack.map(function (frame) {
                    var script = frame.location.script_path,
                        file = fs.readFileSync(path.resolve(path.join(options.cwd, script)), 'utf8'),
                        lines = file.split(/\n/g),
                        codeLine = lines[frame.location.line_number - 1],
                        column = 0,
                        totalLength = lines.reduce(function (prev, current, index) {
                            return prev + lines[index].length;
                        }, 0),
                        positionToCodeLine = lines.reduce(function (prev, current, index) {
                            return index > frame.location.line_number - 1 ? prev : prev + lines[index].length;
                        }, 0),
                        scopeId = 0;

                    if (codeLine) {
                        column = codeLine.indexOf(frame.location.function_name.replace(/\(\)/g, ''));
                    }

                    column = column === -1 ? 0 : column;

                    var filename = path.join(options.cwd, script);
                    var fileId = state.getId(filename);
                    var fileRefIndex = state.refManager.addRef({
                        type: 'script',
                        name: path.join(options.cwd, script),
                        id: fileId,
                        lineOffset: 0,
                        columnOffset: 0,
                        lineCount: lines.length + 1,
                        sourceStart: codeLine,
                        sourceLength: totalLength,
                        scriptType: 2,
                        compilationType: 0
                    }, 'files');

                    var funcRefIndex = state.refManager.addRef({
                        type: 'function',
                        className: 'Function',
                        name: frame.location.function_name.replace(/\(\)/g, '').replace('-anonymous-', '(anonymous function)'),
                        inferredName: '',
                        resolved: true,
                        script: { ref: fileRefIndex },
                        scriptId: fileId,
                        line: frame.location.line_number - 1,
                        column: column,
                        scopes: [{ type: 3, index: scopeId++ }]
                    }, 'functions');

                    return {
                        index: frame.index,
                        receiver: {},
                        func: { ref: funcRefIndex, scriptId: fileId },
                        script: { ref: fileRefIndex },
                        constructCall: codeLine.indexOf('new ') >= 0,
                        atReturn: codeLine.indexOf('return ') >= 0,
                        debuggerFrame: codeLine.indexOf('debugger') >= 0,
                        arguments: [],
                        locals: [],
                        position: positionToCodeLine + column,
                        line: frame.location.line_number - 1,
                        column: column,
                        sourceLineText: codeLine,
                        scopes: [{ type: 3, index: scopeId }]
                    }
                });

            var frameVars = frames.map(function (frame) {
                return getFrameVariables(frame.index, state.currentThread.id, serverRequest);
            });

            return new Promise(function (resolve) {
                Promise.all(frameVars).then(function (results) {
                    for (var i = 0, l = frames.length; i < l; i++) {
                        frames[i].properties = results[i];
                    }
                    resolve({
                        running: false,
                        body: {
                            fromFrame: 0,
                            toFrame: frames.length,
                            totalFrames: frames.length,
                            frames: frames
                        },
                        refs: state.refManager.getRefs()
                    });
                });
            });
        } else {
            return new Promise(function (resolve) {
                resolve({
                    running: true,
                    body: {
                        fromFrame: 0,
                        toFrame: 0,
                        totalFrames: 0,
                        frames: []
                    },
                    refs: []
                });
            });
        }
    },

    scopes: function (payload, state, serverRequest) {
        state.refManager.resetRefTable();

        return new Promise(function (resolve) {
            if (state.currentThread) {
                var callStack = state.currentThread.call_stack,
                    frameId = callStack[0].index;

                serverRequest.send('/threads/' + state.currentThread.id + '/frames/' + frameId + '/members', 'get').then(function (result) {
                    var variableRequests = {};

                    variableRequests = result.body.object_members.map(function (object) {
                        return serverRequest.send('/threads/' + state.currentThread.id + '/frames/' + frameId + '/eval?expr=JSON.stringify(' + object.name + ')');
                    });

                    Promise.all(variableRequests).then(function (variables) {
                        var i = 0;
                        var refId = state.refManager.addRef({
                            type: 'object',
                            className: 'Object',
                            constructorFunction: {
                                ref: state.refManager.undefinedRef
                            },
                            protoObject: {
                                ref: state.refManager.undefinedRef
                            },
                            prototypeObject: {
                                ref: state.refManager.undefinedRef
                            },
                            properties: result.body.object_members.map(function (object) {
                                var matchingEval = variables.filter(function (output) {
                                        return output.body.expression === 'JSON.stringify(' + object.name + ')';
                                    }),
                                    type = object.type,
                                    variable = null;

                                if (type === 'org.mozilla.javascript.Function') {
                                    variable = {
                                        name: object.name,
                                        propertyType: 3,
                                        ref: state.refManager.addRef({
                                            type: 'function',
                                            className: 'Function',
                                            constructorFunction: {
                                                ref: state.refManager.undefinedRef
                                            },
                                            protoObject: {
                                                ref: state.refManager.undefinedRef
                                            },
                                            prototypeObject: {
                                                ref: state.refManager.undefinedRef
                                            },
                                            name: '',
                                            inferredName: '',
                                            resolved: true,
                                            source: 'function() {}',
                                            scopes: [],
                                            properties: [],
                                            text: 'function() {}'
                                        }, 'functions')
                                    }
                                } else {
                                    var parsedValue = JSON.parse(matchingEval[0].body.result);
                                    variable = {
                                        name: object.name,
                                        propertyType: 1,
                                        ref: state.refManager.addRefForVar(parsedValue)
                                    }
                                }

                                return variable;
                            }),
                            text: '#'
                        }, 'scopes');
                        var scope = {
                            type: 1,
                            index: i++,
                            frameIndex: 0,
                            object: {
                                ref: refId
                            },
                            text: '#'
                        };
                        resolve({
                            body: {
                                fromScope: 0,
                                toScope: 1,
                                totalScopes: 1,
                                scopes: [scope]
                            },
                            refs: state.refManager.getRefs()
                        });
                    });
                }).catch(function () {
                    return this.default(payload);
                }.bind(this));
            }
        });
    },

    scripts: function (payload, state, serverRequest) {
        state.refManager.resetRefTable();

        return new Promise(function (resolve) {
            if (typeof payload.arguments.ids === 'undefined') {
                resolve({
                    body: globData.readFileList(),
                    refs: []
                });
            } else {
                resolve({
                    body: globData.readFileSource(payload.arguments.ids[0]),
                    refs: []
                });
            }
        });
    },

    scope: function (payload, state, serverRequest) {
        state.refManager.resetRefTable();

        return new Promise(function (resolve) {
            if (state.currentThread) {
                var callStack = state.currentThread.call_stack,
                    frameId = callStack[0].index;

                serverRequest.send('/threads/' + state.currentThread.id + '/frames/' + frameId + '/members', 'get').then(function (result) {
                    var variableRequests = {};

                    variableRequests = result.body.object_members.map(function (object) {
                        return serverRequest.send('/threads/' + state.currentThread.id + '/frames/' + frameId + '/eval?expr=JSON.stringify(' + object.name + ')');
                    });

                    Promise.all(variableRequests).then(function (variables) {
                        var i = 0;
                        var refId = state.refManager.addRef({
                            type: 'object',
                            className: 'Object',
                            constructorFunction: {
                                ref: state.refManager.undefinedRef
                            },
                            protoObject: {
                                ref: state.refManager.undefinedRef
                            },
                            prototypeObject: {
                                ref: state.refManager.undefinedRef
                            },
                            properties: result.body.object_members.map(function (object) {
                                var matchingEval = variables.filter(function (output) {
                                        return output.body.expression === 'JSON.stringify(' + object.name + ')';
                                    }),
                                    type = object.type,
                                    variable = null;

                                if (type === 'org.mozilla.javascript.Function') {
                                    variable = {
                                        name: object.name,
                                        propertyType: 3,
                                        ref: state.refManager.addRef({
                                            type: 'function',
                                            className: 'Function',
                                            constructorFunction: {
                                                ref: state.refManager.undefinedRef
                                            },
                                            protoObject: {
                                                ref: state.refManager.undefinedRef
                                            },
                                            prototypeObject: {
                                                ref: state.refManager.undefinedRef
                                            },
                                            name: '',
                                            inferredName: '',
                                            resolved: true,
                                            source: 'function() {}',
                                            scopes: [],
                                            properties: [],
                                            text: 'function() {}'
                                        }, 'functions')
                                    }
                                } else {
                                    var parsedValue = JSON.parse(matchingEval[0].body.result);
                                    variable = {
                                        name: object.name,
                                        propertyType: 1,
                                        ref: state.refManager.addRefForVar(parsedValue)
                                    }
                                }

                                return variable;
                            }),
                            text: '#'
                        }, 'scopes');
                        var scope = {
                            type: 1,
                            index: i++,
                            frameIndex: 0,
                            object: {
                                ref: refId
                            },
                            text: '#'
                        };
                        resolve({
                            body: scope,
                            refs: state.refManager.getRefs(),
                            running: false,

                        });
                    });
                }).catch(function () {
                    return this.default(payload);
                }.bind(this));
            }
        });
    },

    source: function (payload) {
        return this.default(payload);
    },

    changebreakpoint: function (payload) {
        return this.default(payload);
    },

    clearbreakpoint: function (payload, state, serverRequest) {
        var breakpointId = payload.arguments.breakpoint;
        return serverRequest.send('/breakpoints/' + breakpointId, 'delete').then(function () {
            return {
                body: { breakpoint: breakpointId },
                refs: [],
                success: true
            }
        });
    },

    suspend: function (payload, state) {
        return new Promise(function (resolve) {
            resolve({
                running: false
            });
        });
    },

    v8flags: function (payload) {
        return this.default(payload);
    },

    version: function (payload) {
        return this.default(payload);
    },

    disconnect: function (payload) {
        return this.default(payload);
    },

    gc: function (payload) {
        return this.default(payload);
    },

    setvariablevalue: function (payload) {
        return this.default(payload);
    },

    default: function () {
        return new Promise(function (resolve) {
            resolve({});
        });
    }
};

module.exports = new RequestProcessor();