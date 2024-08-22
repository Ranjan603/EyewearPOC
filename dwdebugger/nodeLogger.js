var net = require('net'),
    SocketWriter = require('./lib/socketWriter'),
    chalk = require('chalk');

var requests = [];
var response = [];
var otherResponse = [];

var isJsonString = function isJsonString(str){
    try{
        return JSON.parse(str);
    } catch(e){
        return false;
    }
}

var logRequestsAndResponse = function logRequestsAndResponse() {
    for(var i = 0; i < requests.length; i++){
        console.log(chalk.red(requests[i]));
        console.log(chalk.green(response[i]));
        if(typeof otherResponse [i] != 'undefined'){
            console.log(chalk.blue(otherResponse[i]));
        }
    }
}

var server = net.createServer(function(socket) {
    var socketWritter = new SocketWriter(socket);
    var connection = net.createConnection(5857);
    socket.on('data', function(data) {
        console.log('Server request________________________');
        console.log((new Buffer(data)).toString('utf-8'));
       
        var dataJson = data.toString('utf-8');
        dataJson = dataJson.split("\n");
        dataJson = dataJson[2];
        dataJson = JSON.parse(dataJson);
        //console.log(chalk.red(dataJson.seq));
        if(typeof requests[dataJson.seq] != 'undefined'){
            requests[dataJson.seq] = requests[dataJson.seq] + data.toString('utf-8');
        }
        else{
            requests[dataJson.seq] = data.toString('utf-8');
        }

        //console.log('______________________________________');
        connection.write(data);
    });
    socket.on('end', function(data) {
        
        //connection.write(data);
        logRequestsAndResponse();
        
    });

    connection.
        on('connect', function() {
            console.log('Connection opened');
            console.log('______________________________________');
        }).
        on('data', function(message) {
            console.log('Server response_______________________');
            console.log(message);
            //console.log('______________________________________');
            
            var dataJson = message.toString('utf-8');
            
            dataJson = dataJson.split("\n");
            dataJson = dataJson[2];
            if((dataJson = isJsonString(dataJson)) !== false){
                if(typeof response[dataJson.request_seq] != 'undefined' && typeof dataJson.request_seq != 'undefined'){
                    response [dataJson.request_seq] = response [dataJson.request_seq] + message.toString('utf-8');
                }
                else if(typeof dataJson.request_seq != 'undefined'){
                    response [dataJson.request_seq] = message.toString('utf-8');
                }
                else if(typeof otherResponse[response.length - 1] != 'undefined'){
                    otherResponse[response.length - 1] = otherResponse[response.length - 1] + message.toString('utf-8');
                }
                else{
                    otherResponse[response.length - 1] = message.toString('utf-8');
                }
            }
            //console.log('-----');
            //console.log(chalk.red(dataJson));
            //console.log('******');
            //dataJson = JSON.parse(dataJson);
            //console.log(chalk.red(dataJson.seq));
            //requests[dataJson.seq] = data;            


            socketWritter.send(message);
        }).
        on('error', function(message) {
            console.log('Error from the Node server____________');
            console.log(message);
            //console.log('______________________________________');
            socketWritter.send(message);
        }).setEncoding('utf8');
});

server.listen(5858);