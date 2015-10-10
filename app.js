var express = require("express")();
var http = require('http').Server(express);
var io = require('socket.io')(http);

express.get('/', function (req, res) {
  res.send("Server is up");
});

http.listen(3000, function(){
    console.log("Server started");
});
