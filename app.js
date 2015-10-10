var express = require("express"),
    http = require("http"),
    io = require("socket.io");
var bodyParser = require("body-parser");
var MongoClient = require("mongodb").MongoClient;

var RoomsCollection = null;
// Connect to the db
MongoClient.connect("mongodb://localhost:27017/fugitive", function(err, db) {
  if(!err) {
    console.log("We are connected to fugitive.");
    RoomsCollection = db.collection('room', function(err, collection) {});
  }
});



var app = express(),
    server = http.Server(app),
    socket = io(server);

app.use(bodyParser.json()); // for parsing application/json

app.post("/create_room", function (req, res) {
  var name = req.body.name;
  var time = req.body.time;

  if(RoomsCollection != null) {
    var room = {'name': name, 'time': time};
    RoomsCollection.insert(room, {w:1}, function(err, result) {
      if(!err) {
        res.send('1');
      }
      else {
        res.send('0');
      }
    });
  }
  else {
    res.send('0');
  }
});

server.listen(3000, function(){
    console.log("Server started");
});