'use strict';

var fs = require('fs'),
    path = require('path'),
    optionator = require('optionator'),
    ServerRequest = require('../lib/serverRequest'),
    Debugger = require('../lib/debugger');

var optionsParser = optionator({
        prepend: 'debugger [options]',
        options: [
            {
                option: 'config',
                alias: 'c',
                type: 'path::String',
                default: 'dw.json',
                description: 'Configration file for server credentials. Default to dw.json'
            },
            {
                option: 'port',
                alias: 'p',
                type: 'Int',
                default: '5858',
                description: 'Port for the debugger adapter. Default to 5858'
            },
            {
                option: 'apiVersion',
                type: 'String',
                default: 'v1_0',
                description: 'Version of the api to use. Default to v1_0'
            },
            {
                option: 'cwd',
                type: 'path::String',
                default: process.cwd(),
                description: 'Path to root of the project'
            },
            {
                option: 'environment',
                type: 'String',
                default: 'vsc',
                description: 'specify the debugger you are using here. Defaults to Visual Studio Code (VSC)',
                alias: 'e'
            }
        ]
    }),
    options = optionsParser.parse(process.argv),
    configFile = fs.readFileSync(path.resolve(process.cwd(), options.config)),
    credentials = null;

try {
    credentials = JSON.parse(configFile);
} catch (e) {
    throw new Error('Couldn\'t parse dw.json file');
}

var serverRequest = new ServerRequest({
    serverUrl: credentials.hostname,
    version: options.apiVersion,
    clientId: 'NodeJS debugger adapter',
    username: credentials.username,
    password: credentials.password,
    cwd: options.cwd,
});

var adapter = new Debugger({ port: options.port, cwd: options.cwd, environment: options.environment }, serverRequest);

process.on('SIGINT', function() {
    console.info('Cleaning up before exit');
    serverRequest.destroyClient();
    process.exit(); //eslint-disable-line
});
process.on('uncaughtException', function(options, err) {
    console.error(err);
    serverRequest.destroyClient();
    process.exit(); //eslint-disable-line
});
