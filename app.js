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
    "team": -1,
    "ready_status": false
  }
  RoomsCollection.findOne({'name': rname}, {w:1}, function(err, item) {
    if(!err) {
      item.players.push(player);
      RoomsCollection.updateOne(
        {'name': rname},
        {$set:{'players': item.players}},
        function(err, results) {
          console.log(results);
          item.players.forEach(function (entry) {
            player_update(entry.name, rname);
          });
      });
    }
  })
}

function team_selection(player, room, team) {
  RoomsCollection.findOne({'name': room}, {w:1}, function(err, item) {
    if(!err) {
      item.players[item.players.find({'name': player})].team = team;
      RoomsCollection.updateOne(
        {'name': room},
        {$set:{'players': item.players}},
        function(err, results) {
          console.log(results);
          player_update(player, room);
      });
    }
  });
}

function team_locked(player, room) {
  RoomsCollection.findOne({'name': room}, {w:1}, function(err, item) {
    if(!err) {
      item.players[item.players.find({'name': player})].ready_status =
        true;
      RoomsCollection.updateOne(
        {'name': room},
        {$set:{'players': item.players}},
        function(err, results) {
          console.log(results);
          player_update(player, room);
          var allReady = true;
          var firstRobber = "";
          item.players.forEach(function (entry) {
            if(!entry.ready_status) {
              allReady = false;
            }
            if(entry.team == 0) {
              firstRobber = entry.name;
            }
          });
          if(allReady) {
            io.sockets.to(room).emit('start select locations', firstRobber);
          }
      });
    }
  });
}

function player_update(pname, rname) {
  RoomsCollection.findOne({'name': rname}, {w:1}, function(err, item) {
    if(!err) {
      var player =
        item.players.filter(function(x) { return x.name === pname})[0];
      io.sockets.to(rname).emit('player update', player.name, player.team, player.ready_status);
    }
  });
}

io.sockets.on('connect', function(socket){
    var player = "";
    var room = "";

    socket.on('join room', function(rname, pname) {
        player = pname; //HUGE HACK TODO: FIX PLS RAVI WHY
        room = rname;
        console.log('Player %s joins room %s.', player, room);
        socket.join(room);
        add_player_to_room(player, room);
    });

    socket.on('team selection', function(team) {
      console.log('Player %s joins team %d', player, team);
      team_selection(player, room, team);
    });

    socket.on('team locked', function() {
      console.log('Player %s confirms team', player);
      team_locked(player, room);
    });
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
