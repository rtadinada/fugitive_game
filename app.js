var express = require("express"),
    http = require('http'),
    io = require('socket.io');

var app = express();
    server = http.Server(app),
    socket = io(http);

app.get('/', function (req, res) {
  res.send("Server is up");
});

server.listen(3000, function(){
    console.log("Server started");
});
