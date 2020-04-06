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

app.use(express.static('public'))

/* Send the game to the user */
app.get('/', function (req, res) {
    res.render('tetris.ejs', {page:"home"});
});
app.get('/pr/', function (req, res) {
  res.render('tetris.ejs', {page:"pr"});
});
app.get('/br/', function (req, res) {
  res.render('tetris.ejs', {page:"br"});
});

/* Handle a new connection */
io.on('connection', function (socket) {

    socket.on('joinRoom', function(pseudo, room, mode) {

        if(rooms[room] == null) {
          rooms[room] = [];
          rooms[room].state = "preparating";
          rooms[room].mode = mode;
          console.log(pseudo + " created the room " + room + " in mode " + mode);
          socket.emit('message', 'Room ' + room + ' created with success.', 'success');
        }

        if(rooms[room].mode === 'chill') {

          socket.pseudo = pseudo;
          socket.room = room;

          /* Create the room if it's the first player */
          if(typeof(global[socket.room]) === 'undefined') {
            rooms[room].state = "playing";
            global[socket.room] = [];
            global[socket.room].mode = rooms[socket.room].mode;
          }

          socket.join(room);

          rooms[socket.room].push({
            id: socket.id,
            pseudo: socket.pseudo,
            ready: false
          });

          console.log(socket.pseudo + " joined room " + socket.room);
          socket.in(socket.room).emit('message', socket.pseudo + ' joined', 'info');

          socket.emit('classement', global[socket.room]);
          socket.emit('startNow');

          let i = rooms[socket.room].length - 1;
          global[socket.room].push(new Player(
            rooms[socket.room][i].id,
            rooms[socket.room][i].pseudo,
            0,
            []
          )); // Add the new player to the global state

          lastEmits.push({
            id: rooms[socket.room][i].id,
            room: socket.room,
            pseudo: rooms[socket.room][i].pseudo,
            time: (new Date()).getTime()
          }); // Initiate the last emit
        }

        else if(rooms[room].state === "preparating") {

          if(mode !== rooms[room].mode) {
            if(rooms[room].mode === 'chill') socket.emit('okToPlay', false, "You must set your mode to Netflix 'nd chill to join that room.");
            else if(rooms[room].mode === 'boom') socket.emit('okToPlay', false, "You must set your mode to Boom ! to join that room.");
            else if(rooms[room].mode === 'basic') socket.emit('okToPlay', false, "You must set your mode to Basic to join that room.");
          }
          else {
            socket.emit('yourId', socket.id); // Send its ID to the player
            socket.emit('okToPlay', true, ' '); // The player can enter the room

            socket.join(room);

            socket.pseudo = pseudo;
            socket.room = room;

            rooms[socket.room].push({
              id: socket.id,
              pseudo: socket.pseudo,
              ready: false
            });

            console.log(socket.pseudo + " joined room " + socket.room);

            socket.in(socket.room).emit('roomPlayers', rooms[socket.room], socket.room);
            socket.in(socket.room).emit('message', socket.pseudo + " joined.", 'info')
            socket.emit('roomPlayers', rooms[socket.room], socket.room);
          }
        }

        else socket.emit('okToPlay', false, "This game is already in progress ! You can only join when the game is preparating or when it's in Netflix 'nd chill mode !"); // The room is occupied
    });

    socket.on('joinBrRoom', function(pseudo) {
      socket.emit('message', 'This game mode is not available at this time', 'error');
    })

    socket.on('leaveRoom', function() {
      if(typeof(rooms[socket.room]) !== 'undefined') {
        let playerIndex; // Index of the player in the rooms array
        for(let i = 0; i < rooms[socket.room].length; i++) {
          if(rooms[socket.room][i].id === socket.id) {
            playerIndex = i;
            break;
          }
        }
        rooms[socket.room].splice(playerIndex, 1);

        if(rooms[socket.room].length < 1) {
          delete rooms[socket.room];
        }
        else {
          socket.in(socket.room).emit('roomPlayers', rooms[socket.room], socket.room);
          socket.in(socket.room).emit('message', socket.pseudo + ' left the room', 'info');
        }

        console.log(socket.pseudo + " left the room " + socket.room);
        socket.leave(socket.room);

        let startG = true;
        for(let i = 0; i < rooms[socket.room].length; i++) {
          if(!rooms[socket.room][i].ready) startG = false; // Is everyone is ready, start
        }

        if(startG) {
          /* Initiate and send the ranking to everyone */
          global[socket.room] = [];
          global[socket.room].mode = rooms[socket.room].mode;
          socket.emit('classement', global[socket.room]);
          socket.in(socket.room).emit('classement', global[socket.room]);

          /* Make everyone start the game */
          socket.emit('startNow');
          socket.in(socket.room).emit('startNow');

          let lengthBefore = lastEmits.length;
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

          console.log("Room " + socket.room + " is now playing.");
        }
      }
      else {
        console.log("ERROR : Room not recognized !" +
          "\n Room : " + socket.room +
          "\n Player : " + socket.pseudo
        );
        socket.emit('message', 'There was a problem, please refresh the game by pressing CTRL + F5.', 'error');
      }
    });

    socket.on('imReady', function() {

      if(typeof(rooms[socket.room]) !== 'undefined') {

        socket.score = 0;

        let startG = true;
        for(let i = 0; i < rooms[socket.room].length; i++) {
          if(rooms[socket.room][i].id === socket.id) { // Find the player
            rooms[socket.room][i].ready = !rooms[socket.room][i].ready; // Change its state
            if(rooms[socket.room][i].ready) console.log(rooms[socket.room][i].pseudo + " is ready.");
            else console.log(rooms[socket.room][i].pseudo + " is not ready anymore.");
          }
          if(!rooms[socket.room][i].ready) startG = false; // Is everyone is ready, start
        }

        /* Send the room to everyone */
        socket.emit('roomPlayers', rooms[socket.room], socket.room);
        if(rooms[socket.room].mode != 'chill' || rooms[socket.room].state == 'preparating') {
          socket.in(socket.room).emit('roomPlayers', rooms[socket.room], socket.room);
        }

        if(startG) {

          /* Initiate and send the ranking to everyone */
          global[socket.room] = [];
          global[socket.room].mode = rooms[socket.room].mode;
          socket.emit('classement', global[socket.room]);
          socket.in(socket.room).emit('classement', global[socket.room]);

          /* Make everyone start the game */
          socket.emit('startNow');
          socket.in(socket.room).emit('startNow');

          let lengthBefore = lastEmits.length;
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

          console.log("Room " + socket.room + " is now playing.");
        }
      }
      else {
        console.log("ERROR : Room not recognized !" +
          "\n Room : " + socket.room +
          "\n Player : " + socket.pseudo
        );
        socket.emit('message', 'There was a problem, please refresh the game by pressing CTRL + F5.', 'error');
      }
    });

    socket.on('score', function(score, board) {

        let indexplayer; // Index of the player in the global state
        if(typeof(global[socket.room]) !== 'undefined') {
          for (let i = 0; i < global[socket.room].length; i++) {
              if (global[socket.room][i].id === socket.id) {
                  indexplayer = i; // Find the player's index
                  break;
              }
          }

          let indexLastEmit; // Index of the player in the lastEmit array
          for (let i = 0; i < lastEmits.length; i++) {
              if (lastEmits[i].id === socket.id) {
                  indexLastEmit = i; // Find the player's index
                  break;
              }
          }

          /* If one oo more row was completed */
          if(score - socket.score !== 0 && global[socket.room].length > 1 && global[socket.room].mode !== 'chill') {
            /* Calculate the number of rows to send */
            let numberofRowsToSend;
            if(global[socket.room].mode === 'boom')
              numberofRowsToSend = (Math.floor((score - socket.score) / 10) + 1) % 15;
            else numberofRowsToSend = (Math.floor((score - socket.score) / 10)) % 6;
            if(numberofRowsToSend !== 0) {
              console.log(socket.pseudo + " send " + numberofRowsToSend + " row(s).");
              socket.in(socket.room).emit('message', socket.pseudo + ' send ' + numberofRowsToSend + " row(s) !", 'info')
              for(let i = 0; i < numberofRowsToSend; i++) {
                let randPlayerIndex = randInt(global[socket.room].length - 1); // Pick a random player
                if(randPlayerIndex == indexplayer) { // If it picked itself
                  if(typeof(global[socket.room][indexplayer + 1] !== 'undefined')) // Check if the personn above exist
                    randPlayerIndex++; // Pick that player
                  else randPlayerIndex--; // Else, pick the player below
                }
                let playerId = global[socket.room][randPlayerIndex].id; // ID of the player receiving the row
                socket.in(socket.room).emit('addRow', playerId); // Send him the row
                console.log(global[socket.room][randPlayerIndex].pseudo + " got a additional row from " + socket.pseudo);
              }
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

              let afkPlayer = lastEmits[i];

              let indexplayer; // Index of the player in the global state
              for (let j = 0; j < global[lastEmits[i].room].length; j++) {
                  if (global[afkPlayer.room][j].id === afkPlayer.id) {
                      indexplayer = j;
                      break;
                  }
              }

              /* Say to everyone that someone is AFK. That someone will recognize himself and stop to play */
              if(typeof(global[afkPlayer.room][indexplayer]) !== 'undefined') {
                socket.emit('died', global[afkPlayer.room][indexplayer].id);
                socket.in(lastEmits[i].room).emit('died', global[afkPlayer.room][indexplayer].id);

                console.log(
                  global[afkPlayer.room][indexplayer].pseudo +
                  " was kicked due to AFKness with " +
                  global[afkPlayer.room][indexplayer].score +
                  " points."
                );

                socket.in(socket.room).emit('message', global[afkPlayer.room][indexplayer].pseudo + ' was kicked due to AKFness.', 'info');

                global[afkPlayer.room].splice(indexplayer, 1);
                lastEmits.splice(i, 1);

                if(global[afkPlayer.room].length < 1) {
                  delete rooms[afkPlayer.room];
                  delete global[afkPlayer.room];
                  socket.in(afkPlayer.room).in("spectator").emit('stopSpectate');
                }
                break;
              }
            }
          }
        }
        else {
          console.log("ERROR : [SCORE] Player not recognized !" +
            "\nRoom : " + socket.room +
            "\nPseudo : " + socket.pseudo +
            "\nID : " + socket.id +
            "\nScore : " + socket.score
          );
          console.log(global);
          socket.emit('message', 'There was a problem, please refresh the game.', 'error');
        }
      });

    socket.on('lost', function() {
        if(typeof(global[socket.room]) !== 'undefined') {
          for(let i = 0; i < global[socket.room].length; i++) {
            if(global[socket.room][i].id === socket.id) {
               console.log(global[socket.room][i].pseudo + " lost with " + global[socket.room][i].score + " points.");

               socket.in(socket.room).emit('message', global[socket.room][i].pseudo + " perished.", 'info')

               /* Delete in lastEmit */
               let indexLastEmit; // Index of the player in the lastEmit array
               for (let i = 0; i < lastEmits.length; i++) {
                   if (lastEmits[i].id === socket.id) {
                       indexLastEmit = i;
                       break;
                   }
               }
               lastEmits.splice(indexLastEmit, 1);

               /* Delete in rooms */
               let indexRooms; // Index of the player in the rooms array
               for (let i = 0; i < rooms[socket.room].length; i++) {
                   if (rooms[socket.room][i].id === socket.id) {
                       indexRooms = i;
                       break;
                   }
               }
               rooms[socket.room].splice(indexRooms, 1);

               /* Check if you enter in the allTimes Ranking */
               if(global[socket.room].mode == "basic"  && global[socket.room][i].score > allTimeglobal[allTimeglobal.length - 1].score) {
                  allTimeglobal[allTimeglobal.length - 1] = {
                    pseudo: global[socket.room][i].pseudo,
                    score: global[socket.room][i].score
                  };
                  console.log("The player entered in the leaderboard with " + global[socket.room][i].score + " points.");
                  orderAllTimeGlobal();
                  socket.emit('death', true);
               }
               else socket.emit('death', false);

               global[socket.room].splice(i, 1);

               break;
            }
          }

          socket.leave(socket.room);
          socket.in(socket.room).emit('classement', global[socket.room]);

          if(global[socket.room].length < 1) {
            delete rooms[socket.room];
            delete global[socket.room];
            socket.in(socket.room).in("spectator").emit('stopSpectate');
          }
        }
        else {
          console.log("ERROR : [LOST] Player not recognized !" +
            "\nRoom : " + socket.room +
            "\nPseudo : " + socket.pseudo +
            "\nID : " + socket.id +
            "\nScore : " + socket.score
          );
          console.log(global);
          socket.emit('message', 'There was a problem, please refresh the game.', 'error');
        }
    });

    socket.on('NeedAllTimeRanking', function() {
      socket.emit('allTimeRanking4u', allTimeglobal);

      let allRoomNames = Object.keys(rooms);
      let roomsToSend = [];
      for(let i = 0; i < allRoomNames.length; i++) {

        let playerList = [];
        for(let j = 0; j < rooms[allRoomNames[i]].length; j++) {
          playerList.push(rooms[allRoomNames[i]][j].pseudo);
        }

        roomsToSend.push({
          name: allRoomNames[i],
          mode: rooms[allRoomNames[i]].mode,
          state: rooms[allRoomNames[i]].state,
          players: playerList
        });
      }
      socket.emit('rooms4u', roomsToSend);
    });

    socket.on('spectate', function(room) {
      if(rooms[room] == null) socket.emit('message', 'This room doesn\'t exist.', 'error');
      else {
        socket.room = room;
        socket.emit('roomPlayers', rooms[socket.room], socket.room);
        socket.join(room);
        socket.join("spectator");
        socket.emit('okToPlay', true);
        if(rooms[socket.room].state === 'playing') {
          socket.emit('classement', global[socket.room]);
          socket.emit('startNow');
        }
        socket.in(socket.room).emit('message', 'A new spectator came.', 'info');
      }
    })
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

/* Output a random int */
function randInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
