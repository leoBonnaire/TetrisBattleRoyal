/* Add the modules */
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

let global = []; // Store the whole game state (of every player)
let allTimeglobal = []; // Store the all time ranking (10 best players of all times)
createAllTimeRanking(); // Fill it with nothing
let rooms = [];
let lastEmits = [];
server.listen(3000); // Listen
// WARNING: app.listen(80) will NOT work here!


app.use(express.static('public'))

/* Send the game to the user */
app.get('/', function (req, res) {
    res.render('tetris.ejs', {page:"home"});
});
app.get('/br/', function (req, res) {
  res.render('tetris.ejs', {page:"br"});
});
/* Handle a new connection */
io.on('connection', function (socket) {

    /* When a user connect to the server */
    socket.on('joinRoom', function(pseudo, room) {

        if(rooms[room] == null) {
          rooms[room] = [];
          rooms[room].state = "preparating";
        }

        if(rooms[room].state === "preparating") {

          socket.emit('yourId', socket.id); // Send its ID to the player
          socket.emit('okToPlay', true);

          socket.join(room);

          socket.pseudo = pseudo;
          socket.room = room;

          console.log(socket.pseudo + " joined the room : " + socket.room);

          rooms[socket.room].push({
            id: socket.id,
            pseudo: socket.pseudo,
            ready: false
          });
          socket.in(socket.room).emit('roomPlayers', rooms[socket.room], socket.room);
          socket.emit('roomPlayers', rooms[socket.room], socket.room);
        }

        else socket.emit('okToPlay', false);
    });

    socket.on('imReady', function() {

        let startG = true;
        for(let i = 0; i < rooms[socket.room].length; i++) {
          if(rooms[socket.room][i].id === socket.id)
            rooms[socket.room][i].ready = !rooms[socket.room][i].ready;
          if(!rooms[socket.room][i].ready) startG = false;
        }

        socket.emit('roomPlayers', rooms[socket.room], socket.room);
        socket.in(socket.room).emit('roomPlayers', rooms[socket.room], socket.room);

        if(startG) {

          /* Initiate and send the global ranking to everyone */
          global[socket.room] = [];
          socket.emit('classement', global[socket.room]);
          socket.in(socket.room).emit('classement', global[socket.room]);

          /* Make everyone start the game */
          socket.emit('startNow');
          socket.in(socket.room).emit('startNow');

          let lengthBefore = lastEmits.length;
          global[socket.room] = [];
          for(let i = 0; i < rooms[socket.room].length; i++) {

            global[socket.room].push(new Player(
              rooms[socket.room][i].id,
              rooms[socket.room][i].pseudo,
              0,
              []
            )); // Add the new player to the global state

            lastEmits[lengthBefore + i] = {
              id: rooms[socket.room][i].id,
              room: socket.room,
              pseudo: rooms[socket.room][i].pseudo,
              time: (new Date()).getTime()
            }; // Initiate the last emit
          }

          rooms[socket.room].state = "playing"; // Update the room state
        }
    });

    socket.on('score', function(score, board) {

        let indexplayer; // Index of the player in the global state
        for (let i = 0; i < global[socket.room].length; i++) {
            if (global[socket.room][i].id === socket.id) {
                indexplayer = i;
                break;
            }
        }

        let indexLastEmit; // Index of the player in the lastEmit array
        for (let i = 0; i < lastEmits.length; i++) {
            if (lastEmits[i].id === socket.id) {
                indexLastEmit = i;
                break;
            }
        }

        /* Update the global state with the infos sent by the user */
        socket.score = score;
        global[socket.room][indexplayer].score = socket.score;
        global[socket.room][indexplayer].board = board;
        lastEmits[indexLastEmit].time = (new Date()).getTime(); // Update the last time the player was seen

        orderGlobal(socket.room); // Rank the players

        /* Send the global ranking to everyone */
        socket.emit('classement', global[socket.room]);
        socket.in(socket.room).emit('classement', global[socket.room]);

        /* Look out for AFKs and KILL THEM */
        let now = (new Date()).getTime();

        for(let i = 0; i < lastEmits.length; i++) {
          if(now - lastEmits[i].time > 60000) { // 1 min

            let indexplayer; // Index of the player in the global state
            for (let j = 0; j < global[lastEmits[i].room].length; j++) {
                if (global[lastEmits[i].room][j].id === lastEmits[i].id) {
                    indexplayer = j;
                    break;
                }
            }

            console.log(
              global[lastEmits[i].room][indexplayer].pseudo +
              " was kicked due to AFKness with " +
              global[lastEmits[i].room][indexplayer].score +
              " points."
            );

            socket.emit('died', global[lastEmits[i].room][indexplayer].id);
            socket.in(lastEmits[i].room).emit('died', global[lastEmits[i].room][indexplayer].id);

            global[lastEmits[i].room].splice(indexplayer, 1);
            lastEmits.splice(i, 1);
            break;
          }
        }
    });

    socket.on('lost', function() {
        for(let i = 0; i < global[socket.room].length; i++) {
          if(global[socket.room][i].id === socket.id) {
             console.log(global[socket.room][i].pseudo + " lost with " + global[socket.room][i].score + " points.");

             /* Delete in lastEmit */
             let indexLastEmit; // Index of the player in the lastEmit array
             for (let i = 0; i < lastEmits.length; i++) {
                 if (lastEmits[i].id === socket.id) {
                     indexLastEmit = i;
                     break;
                 }
             }
             lastEmits.splice(indexLastEmit, 1);

             /* Check if you enter in the allTime Ranking */
             if(global[socket.room][i].score > allTimeglobal[allTimeglobal.length - 1].score) {
                allTimeglobal[allTimeglobal.length - 1] = {
                  pseudo: global[socket.room][i].pseudo,
                  score: global[socket.room][i].score
                };
                orderAllTimeGlobal();
                socket.emit('message', "You entered the all times Ranking! You are a legend! Wow.");
             }
             global[socket.room].splice(i, 1);
             break;
          }
        }

        socket.leave(socket.room);

        socket.in(socket.room).emit('classement', global[socket.room]);

        if(global[socket.room].length < 1)
          delete rooms[socket.room];
    });

    socket.on('NeedAllTimeRanking', function() {
      socket.emit('allTimeRanking4u', allTimeglobal);
    });
});

/* Define what a player is */
class Player {
  constructor(id, pseudo, score, board) {
    this.id = id;
    this.pseudo = pseudo;
    this.score = score;
    this.board = board;
  }
}

/* Functions */

/* Initiate the allTime Ranking */
function createAllTimeRanking() {
  for(let i = 0; i < 10; i++) {
    allTimeglobal[i] = {pseudo: "---", score: 0};
  }
}

/* Orders the global game */
function orderGlobal(room) {
  for (let i = 0; i < global[room].length; i++)
      for (let j = 0; j < global[room].length; j++)
          if (global[room][j].score < global[room][i].score)
              [global[room][i], global[room][j]] = [global[room][j], global[room][i]];
}

/* Orders the allTimeGlobal */
function orderAllTimeGlobal() {
  for (let i = 0; i < allTimeglobal.length; i++)
      for (let j = 0; j < allTimeglobal.length; j++)
          if (allTimeglobal[j].score < allTimeglobal[i].score)
              [allTimeglobal[i], allTimeglobal[j]] = [allTimeglobal[j], allTimeglobal[i]];
}
