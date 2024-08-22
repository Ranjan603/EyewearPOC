var request = require('superagent'),
    prefix = require('superagent-prefix'),
    assign = require('object-assign'),
    EventEmitter = require('events').EventEmitter;

var ServerRequest = function (options) {
    var userOptions = assign({}, {
        protocol: 'https',
        version: 'v1_0'
    }, options);

    this.prefix = prefix(userOptions.protocol + '://' + userOptions.serverUrl + '/s/-/dw/debugger/' + userOptions.version);
    this.username = options.username;
    this.password = options.password;
    this.clientId = userOptions.clientId;

    this.connectionInitialized = false;

    this.events = new EventEmitter();

    // ignore invalid certificates
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
};

ServerRequest.prototype = {
    createClient: function () {
        if (!this.connectionInitialized) {
            this.connectionInitialized = true;
            return this.send('/client', 'post');
        } else {
            return new Promise(function (resolve) {
                resolve();
            });
        }
    },

    send: function (url, type, message) {
        message = message ? message : '';
        return new Promise(function (resolve, reject) {
            request(type, url)
                .use(this.prefix)
                .set('x-dw-client-id', this.clientId)
                .type('application/json')
                .accept('application/json')
                .auth(this.username, this.password)
                .timeout(5000)
                .send(message)
                .end(function (err, res) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(res);
                    }
                });
        }.bind(this));
    },

    destroyClient: function () {
        if (this.connectionInitialized) {
            this.connectionInitialized = false;
            this.clearServerEvent();
            return this.send('/client', 'delete');
        } else {
            return new Promise(function (resolve) {
                resolve();
            });
        }
    },

    checkForHaltedThread: function (threadId) {
        var me = this;
        if (typeof threadId === 'object') {
            me = threadId; //eslint-disable-line
            threadId = null;
        }
        return new Promise(function (resolve, reject) {
            me.send('/threads', 'get').then(function (res) {
                if (res.body.script_threads) {
                    res.body.script_threads.forEach(function (thread) {
                        if (((threadId && thread.id === threadId) || !threadId) && thread.status === 'halted') {
                            resolve(thread);
                        }
                    }, me);
                } else {
                    reject();
                }
            }.bind(me));
        });
    },

    waitForServerEvent: function (threadId) {
        console.log('Checking for halted breakpoints');
        var me = this;
        me.checkForHaltedThread(me).then(function (thread) {
            me.events.emit('break', thread);
        }).catch(function () {
            me.autoCheckTimemout = setTimeout(function () { me.waitForServerEvent(threadId); }, 1000);
        });
    },

    clearServerEvent: function () {
        if (this.autoCheckTimeout) {
            clearTimeout(this.autoCheckTimeout);
        }
    }
};

module.exports = ServerRequest;