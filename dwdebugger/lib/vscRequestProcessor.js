'use strict';

var requestProcessor = require('./requestProcessor.js'),
    path = require('path');

module.exports = {
    evaluate: function (payload, state, serverRequest) {
        if (!state.initializing && state.currentThread) {
            // Visual Studio Code is trying to request prototype for every object, send it "null" back.
            if (payload.arguments && (payload.arguments.expression === 'obj.__proto__' ||
                payload.arguments.expression === 'obj[\'__proto__\']' ||
                payload.arguments.expression === 'JSON.stringify([ array.length, Object.keys(array).length+1-array.length ])') ||
                payload.arguments.expression.indexOf('(function(x)') === 0) {
                return new Promise(function(resolve) {
                    resolve({
                        body: {
                            type: 'null',
                            value: 'null'
                        }
                    });
                });
            }
        } else {
            return requestProcessor.evaluate(payload, state, serverRequest);
        }
    },

    vscode_evaluate: function (payload, state, serverRequest) {
        state.refManager.resetRefTable();
        if (state.currentThread) {
            var callStack = state.currentThread.call_stack,
                frameId = callStack[0].index;
            return serverRequest.send('/threads/' + state.currentThread.id + '/frames/' + frameId + '/eval?expr=JSON.stringify(' + payload.arguments.expression + ')').then(function (res) {
                if (res.body.result.indexOf('is not defined.') >= 0) {
                    return {
                        success: false,
                        message: 'ReferenceError: ' + payload.arguments.expression + ' is not defined'
                    };
                }
                var result = JSON.parse(res.body.result),
                    handle = state.refManager.addRefForVar(result),
                    body = state.refManager.findRefByHandle(handle);

                return {
                    body: body,
                    refs: state.refManager.getAllRefsForHandle(body).map(function (ref) {
                        return state.refManager.findRefByHandle(ref);
                    })
                }
            });
        }
    },

    vscode_lookup: function (payload, state) {
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

    vscode_backtrace: requestProcessor.backtrace,

    vscode_scopes: requestProcessor.scopes,

    listbreakpoints: function (payload, state, serverRequest, options) {
        return serverRequest.send('/breakpoints', 'get').then(function (res) {
            if (res.body.breakpoints) {
                return {
                    body: {
                        breakpoints: res.body.breakpoints.map(function (breakpoint) {
                            var scriptPath = path.join(options.cwd, breakpoint.script_path);
                            scriptPath = scriptPath.replace(/[/]/g, '\\$&');
                            scriptPath = scriptPath.replace(/[.]/g, '\\$&');
                            scriptPath = scriptPath.concat('$');
                            var tempString = '^(.*[\\/\\\\])?';
                            scriptPath = tempString.concat(scriptPath);
                            return {
                                type: 'scriptRegExp',
                                number: breakpoint.id,
                                line: breakpoint.line_number - 1,
                                column: '0',
                                groupId: null,
                                active: true,
                                condition: null,
                                script_regexp: scriptPath,
                                actual_locations: [
                                    {
                                        line: breakpoint.line_number - 1,
                                        column: '0',
                                        script_id: '0'
                                    }
                                ]
                            };
                        }), breakOnExceptions: false, breakOnUncaughtExceptions: false
                    }
                };
            } else {
                return { body: { breakpoints: [], breakOnExceptions: false, breakOnUncaughtExceptions: false } };
            }
        });
    }
};