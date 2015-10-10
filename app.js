var express = require("express"),
    app = express(),
    server = require("http").Server(app),
    io = require("socket.io")(server);
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



app.use(bodyParser.json()); // for parsing application/json


function add_player_to_room(pname, rname) {
  var player =
  {
    "name": pname,
    "class": null,
    "rstat": false
  }
  RoomsCollection.findOne({'name': rname}, {w:1}, function(err, item) {
    if(!err) {
      item.players.push(player);
      RoomsCollection.updateOne(
        {'name': rname},
        {$set:{'players': item.players}},
        function(err, results) {
          console.log(results);
    });
    }
  })
}

io.sockets.on('connect', function(socket){
    socket.on('join room', function(rname, pname) {
        console.log('Player %s joins room %s.', pnam, rname);
        add_player_to_room(pname, rname);
        socket.join(rname); 
    })
});


app.post("/create_room", function (req, res) {
  var name = req.body.name;
  var time = req.body.time;

  if(RoomsCollection != null) {
    var room = {'name': name, 'time': time, 'players': []};
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
