/* Add the modules */
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const settings = require('./public/serverSettings'); // Server settings

console.log("Launching Tretis server on " + settings.ip + " on port " + settings.port + " ..."); // Message at the server start

/* Private rooms */

let global = []; // Store the whole game state (of every player)
let allTimeglobal = []; // Store the all time ranking (10 best players of all times)
createAllTimeRanking(); // Fill it with nothing
let rooms = []; // Rooms when preparating and when playing
let lastEmits = []; // Last time a player said he was there (AFKs)

/* BR mode */

let globalBR = [];
let brRooms = [];
let nbOfPlayersToStartBr = 2;

server.listen(settings.port); // Listen

app.use(express.static('public'))
app.use('/nes.css', express.static(__dirname + '/node_modules/nes.css/css/'));
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

console.log("Server started successfully !");
console.log("Go to " + settings.ip + ":" + settings.port + " in your browser to play");

/* Handle a new connection */
io.on('connection', function (socket) {

    socket.emit('yourId', socket.id); // Send its ID to the player

    killAfk(socket, false);

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
            time: (new Date()).getTime(),
            state: "inGame"
          }); // Initiate the last emit
        }

        else if(rooms[room].state === "preparating") {

          if(mode !== rooms[room].mode) {
            socket.emit('okToPlay', false, "You must set your mode to " + showMode(rooms[room].mode) + " to join that room.");
          }
          else {
            socket.emit('okToPlay', true, ' '); // The player can enter the room

            socket.join(room);

            socket.pseudo = pseudo;
            socket.room = room;

            rooms[socket.room].push({
              id: socket.id,
              pseudo: socket.pseudo,
              ready: false
            });

            lastEmits.push({
              id: rooms[socket.room][rooms[socket.room].length - 1].id,
              room: socket.room,
              pseudo: rooms[socket.room][rooms[socket.room].length - 1].pseudo,
              time: (new Date()).getTime(),
              state: "inRoom"
            }); // Initiate the last emit

            console.log(socket.pseudo + " joined room " + socket.room);

            socket.in(socket.room).emit('roomPlayers', rooms[socket.room], socket.room, rooms[socket.room].mode);
            socket.in(socket.room).emit('message', socket.pseudo + " joined.", 'info')
            socket.emit('roomPlayers', rooms[socket.room], socket.room, rooms[socket.room].mode);
          }
        }

        else socket.emit('okToPlay', false, "This game is already in progress ! You can only join when the game is preparating or when it's in Netflix 'nd chill mode !"); // The room is occupied
    });

    socket.on('joinBrRoom', function(pseudo) {

      socket.emit('okToPlay', true, ' '); // The player can enter the room, or create a new one

      socket.pseudo = pseudo;
      socket.score = 0;

      /* Initiate */
      let numberOfBrRooms = 0;
      let idBiggestRoom = 0;
      /* Find the values */
      for(let i = 0; i < brRooms.length; i++) {
        if(brRooms[i].state === "preparating") {
          numberOfBrRooms++;
          if(brRooms[i].length > brRooms[idBiggestRoom].length) idBiggestRoom = i;
        }
      }

      if(numberOfBrRooms !== 0) { // If there'e at least one room

        /* Join the biggest room */
        socket.join(idBiggestRoom);
        socket.room = idBiggestRoom;
        brRooms[idBiggestRoom].push({
          pseudo: pseudo,
          id: socket.id,
          ready: true
        });

        console.log(socket.pseudo + " joined the " + socket.room + " BR room.");

        socket.in(socket.room).emit('roomPlayers', brRooms[socket.room], socket.room, 'br');
        socket.in(socket.room).emit('message', socket.pseudo + " joined.", 'info')
        socket.emit('roomPlayers', brRooms[socket.room], socket.room, 'br');

        if(brRooms[idBiggestRoom].length >= nbOfPlayersToStartBr) {

          globalBR[socket.room] = [];
          globalBR[socket.room].mode = 'br';
          brRooms[socket.room].state = "playing"; // Update the room state

          let lengthBefore = lastEmits.length;
          for(let i = 0; i < brRooms[socket.room].length; i++) {

            globalBR[socket.room].push(new Player(
              brRooms[socket.room][i].id,
              brRooms[socket.room][i].pseudo,
              0,
              make2DArray(10, 20, 0)
            )); // Add the new player to the global state
          }

          /* Update the state of everyone in the lastEmits */
          for(let i = 0; i < lastEmits.length; i++) {
            if(lastEmits[i].room === socket.room)
              lastEmits[i].state = "inGame";
          }

          /* Send to everyone */
          socket.emit('classement', globalBR[socket.room]);
          socket.in(socket.room).emit('classement', globalBR[socket.room]);

          /* Make everyone start the game */
          socket.emit('startNow');
          socket.in(socket.room).emit('startNow');

          console.log("BR room #" + socket.room + " is now playing.");
        }
      }
      else {
        brRooms.push(new Array());
        let newRoom = brRooms.length - 1;
        brRooms[newRoom].push({
          pseudo: socket.pseudo,
          id: socket.id,
          ready: true
        });
        brRooms[newRoom].state = "preparating";

        socket.room = newRoom;
        socket.join(newRoom);

        lastEmits.push({
          id: socket.id,
          room: socket.room,
          pseudo: socket.pseudo,
          time: (new Date()).getTime(),
          state: "inRoom"
        }); // Initiate the last emit

        socket.emit('roomPlayers', brRooms[socket.room], socket.room, 'br');

        socket.emit("message", "No preparating lobby found ...<br>New lobby created with success!<br>Waiting for players to join ...", "success");
        console.log("New BR room create by " + socket.pseudo + " : #" + socket.room);
      }

    });

    socket.on('leaveRoom', function() {
      if(typeof(rooms[socket.room]) !== 'undefined') {

        /* Delete from room */
        let playerIndex = -1; // Index of the player in the rooms array
        for(let i = 0; i < rooms[socket.room].length; i++) {
          if(rooms[socket.room][i].id === socket.id) {
            playerIndex = i;
            break;
          }
        }
        if(playerIndex !== -1) rooms[socket.room].splice(playerIndex, 1);

        /* Delete from lastEmits */
        let indexLastEmit = -1;
        for(let i = 0; i < lastEmits.length; i++) {
          if(lastEmits[i].id === socket.id) {
            indexLastEmit = i;
            break;
          }
        }
        if(indexLastEmit !== -1) lastEmits.splice(indexLastEmit, 1);

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
          }

          /* Update the state of everyone in the lastEmits */
          for(let i = 0; i < lastEmits.length; i++) {
            if(lastEmits[i].room === socket.room)
              lastEmits[i].state = "inGame";
          }

          rooms[socket.room].state = "playing"; // Update the room state

          console.log("Room " + socket.room + " is now playing.");
        }

        if(rooms[socket.room].length < 1) {
          delete rooms[socket.room];
        }
        else {
          socket.in(socket.room).emit('roomPlayers', rooms[socket.room], socket.room, rooms[socket.room].mode);
          socket.in(socket.room).emit('message', socket.pseudo + ' left the room', 'info');
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
        socket.emit('roomPlayers', rooms[socket.room], socket.room, rooms[socket.room].mode);
        if(rooms[socket.room].mode != 'chill' || rooms[socket.room].state == 'preparating') {
          socket.in(socket.room).emit('roomPlayers', rooms[socket.room], socket.room, rooms[socket.room].mode);
        }

        if(startG) {

          global[socket.room] = [];
          global[socket.room].mode = rooms[socket.room].mode;
          rooms[socket.room].state = "playing"; // Update the room state

          let lengthBefore = lastEmits.length;
          for(let i = 0; i < rooms[socket.room].length; i++) {

            global[socket.room].push(new Player(
              rooms[socket.room][i].id,
              rooms[socket.room][i].pseudo,
              0,
              make2DArray(10, 20, 0)
            )); // Add the new player to the global state
          }

          /* Update the state of everyone in the lastEmits */
          for(let i = 0; i < lastEmits.length; i++) {
            if(lastEmits[i].room === socket.room)
              lastEmits[i].state = "inGame";
          }

          socket.emit('classement', global[socket.room]);
          socket.in(socket.room).emit('classement', global[socket.room]);

          /* Make everyone start the game */
          socket.emit('startNow');
          socket.in(socket.room).emit('startNow');

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

        if(typeof(global[socket.room]) !== 'undefined' || typeof(globalBR[socket.room]) !== 'undefined') {
          if(typeof(global[socket.room]) !== 'undefined') {
            let indexplayer = -1; // Index of the player in the global state
            for (let i = 0; i < global[socket.room].length; i++) {
                if (global[socket.room][i].id === socket.id) {
                    indexplayer = i; // Find the player's index
                    break;
                }
            }

            if(indexplayer !== -1) {
              /* If one oo more row was completed */
              if(score - socket.score !== 0 && global[socket.room].length > 1 && global[socket.room].mode !== 'chill') {
                /* Calculate the number of rows to send */
                let numberofRowsToSend;
                if(global[socket.room].mode === 'boom')
                  numberofRowsToSend = (Math.floor((score - socket.score) / 10) + 1) % 15;
                else numberofRowsToSend = (Math.floor((score - socket.score) / 10)) % 6;
                if(numberofRowsToSend !== 0) {
                  console.log(socket.pseudo + " send " + numberofRowsToSend + " row(s).");
                  socket.in(socket.room).emit('message', socket.pseudo + ' send ' + numberofRowsToSend + " row(s) !", 'warning')
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


              orderGlobal(socket.room); // Rank the players

              /* Send the global ranking to everyone */
              socket.emit('classement', global[socket.room]);
              socket.in(socket.room).emit('classement', global[socket.room]);
            }
            else {
              console.log("ERROR : [SCORE] Player not found" +
                "\nRoom : " + socket.room +
                "\nPseudo : " + socket.pseudo +
                "\nID : " + socket.id +
                "\nScore : " + socket.score
              );
              console.log(global);
            }

          }
          else if(typeof(globalBR[socket.room]) !== 'undefined') {
            let indexplayer; // Index of the player in the global state
            for (let i = 0; i < globalBR[socket.room].length; i++) {
                if (globalBR[socket.room][i].id === socket.id) {
                    indexplayer = i; // Find the player's index
                    break;
                }
            }

            /* If one one more row was completed */
            if(score - socket.score !== 0 && globalBR[socket.room].length > 1) {
              /* Calculate the number of rows to send */
              let numberofRowsToSend = (Math.floor((score - socket.score) / 10)) % 6;
              if(numberofRowsToSend !== 0) {
                console.log(socket.pseudo + " send " + numberofRowsToSend + " row(s).");
                socket.in(socket.room).emit('message', socket.pseudo + ' send ' + numberofRowsToSend + " row(s) !", 'warning')
                for(let i = 0; i < numberofRowsToSend; i++) {
                  let randPlayerIndex = randInt(globalBR[socket.room].length - 1); // Pick a random player
                  if(randPlayerIndex == indexplayer) { // If it picked itself
                    if(typeof(globalBR[socket.room][indexplayer + 1] !== 'undefined')) // Check if the personn above exist
                      randPlayerIndex++; // Pick that player
                    else randPlayerIndex--; // Else, pick the player below
                  }
                  let playerId = globalBR[socket.room][randPlayerIndex].id; // ID of the player receiving the row
                  socket.in(socket.room).emit('addRow', playerId); // Send him the row
                  console.log(globalBR[socket.room][randPlayerIndex].pseudo + " got a additional row from " + socket.pseudo);
                }
              }
            }

            /* Update the global state with the infos sent by the user */
            socket.score = score;
            globalBR[socket.room][indexplayer].score = socket.score;
            globalBR[socket.room][indexplayer].board = board;


            orderGlobalBR(socket.room); // Rank the players

            /* Send the global ranking to everyone */
            socket.emit('classement', globalBR[socket.room]);
            socket.in(socket.room).emit('classement', globalBR[socket.room]);
          }
          else {
            console.log("If the world goes well, you should never see this message in your console.");
          }
        }
        else {
          console.log("ERROR : [SCORE] Room not found" +
            "\nRoom : " + socket.room +
            "\nPseudo : " + socket.pseudo +
            "\nID : " + socket.id +
            "\nScore : " + socket.score
          );
          console.log(global);
          socket.emit('message', 'There was a problem, please refresh the game.', 'error');
        }

        killAfk(socket, true);

      });

    socket.on('lost', function() {
        if(typeof(global[socket.room]) !== 'undefined' || typeof(globalBR[socket.room]) !== 'undefined') {
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

                 socket.emit('death', false);

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
          else if(typeof(globalBR[socket.room]) !== 'undefined') {
            for(let i = 0; i < globalBR[socket.room].length; i++) {
              if(globalBR[socket.room][i].id === socket.id) {
                 console.log(globalBR[socket.room][i].pseudo + " lost with " + globalBR[socket.room][i].score + " points.");

                 socket.in(socket.room).emit('message', globalBR[socket.room][i].pseudo + " perished.", 'info')

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
                 for (let i = 0; i < brRooms[socket.room].length; i++) {
                     if (brRooms[socket.room][i].id === socket.id) {
                         indexRooms = i;
                         break;
                     }
                 }
                 brRooms[socket.room].splice(indexRooms, 1);

                 /* Check if you enter in the allTimes Ranking */
                 if(globalBR[socket.room][i].score > allTimeglobal[allTimeglobal.length - 1].score) {
                    allTimeglobal[allTimeglobal.length - 1] = {
                      pseudo: globalBR[socket.room][i].pseudo,
                      score: globalBR[socket.room][i].score
                    };
                    console.log("The player entered in the leaderboard with " + globalBR[socket.room][i].score + " points.");
                    orderAllTimeGlobal();
                    socket.emit('death', true);
                 }
                 else socket.emit('death', false);

                 globalBR[socket.room].splice(i, 1);

                 break;
              }
            }

            socket.leave(socket.room);
            socket.in(socket.room).emit('classement', globalBR[socket.room]);

            if(globalBR[socket.room].length === 1) {
              socket.in(socket.room).emit('wonBR', globalBR[socket.room][0].id);
              brRooms[socket.room].state = "preparating";
            }
          }
          else {
            console.log("If the world goes well, you should never see this message in your console.");
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
      if(rooms[room] == null) socket.emit('message', 'This room doesn\'t exist. Try refreshing the game', 'error');
      else if(rooms[room].state === "preparating") socket.emit('message', 'Wait for the game to begin before spectating', 'warning')
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

    socket.on('imStillAlive', function() {
      let indexLastEmit = -1; // Index of the player in the lastEmit array
      for (let i = 0; i < lastEmits.length; i++) {
          if (lastEmits[i].id === socket.id) {
              indexLastEmit = i; // Find the player's index
              break;
          }
      }
      if(indexLastEmit !== -1) {
        lastEmits[indexLastEmit].time = (new Date()).getTime(); // Update the last time the player was seen
      }

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

/* Everything is in the name */
function killAfk(socket, sendMessage) {
  /* Look out for AFKs and KILL THEM */
  let now = (new Date()).getTime();
  for(let i = 0; i < lastEmits.length; i++) {
    if(now - lastEmits[i].time > 11000) { // 11 sec

      let afkPlayer = lastEmits[i];

      if(afkPlayer.state === "inGame") {
        if(typeof(global[afkPlayer.room]) !== 'undefined') {
          let indexplayer; // Index of the player in the global state
          for (let j = 0; j < global[afkPlayer.room].length; j++) {
              if (global[afkPlayer.room][j].id === afkPlayer.id) {
                  indexplayer = j;
                  break;
              }
          }

          /* Say to everyone that someone is AFK. That someone will recognize himself and stop to play */
          if(typeof(global[afkPlayer.room][indexplayer]) !== 'undefined') {

            if(sendMessage) socket.emit('message', afkPlayer.pseudo + ' was kicked due to AKFness.', 'info');
            socket.in(afkPlayer.room).emit('message', afkPlayer.pseudo + ' was kicked due to AKFness.', 'info');

            socket.emit('died', afkPlayer.id);
            socket.in(lastEmits[i].room).emit('died', afkPlayer.id);

            console.log(
              afkPlayer.pseudo +
              " was kicked due to AFKness with " +
              afkPlayer.score +
              " points."
            );

            global[afkPlayer.room].splice(indexplayer, 1);
            lastEmits.splice(i, 1);

            if(global[afkPlayer.room].length < 1) {
              delete rooms[afkPlayer.room];
              delete global[afkPlayer.room];
              socket.in(afkPlayer.room).in("spectator").emit('stopSpectate');
            }
          }
        }
        else if(typeof(globalBR[afkPlayer.room]) !== 'undefined') {
          let indexplayer; // Index of the player in the global state
          for (let j = 0; j < globalBR[afkPlayer.room].length; j++) {
              if (globalBR[afkPlayer.room][j].id === afkPlayer.id) {
                  indexplayer = j;
                  break;
              }
          }

          /* Say to everyone that someone is AFK. That someone will recognize himself and stop to play */
          if(typeof(globalBR[afkPlayer.room][indexplayer]) !== 'undefined') {

            if(sendMessage) socket.emit('message', globalBR[afkPlayer.room][indexplayer].pseudo + ' was kicked due to AKFness.', 'info');
            socket.in(afkPlayer.room).emit('message', globalBR[afkPlayer.room][indexplayer].pseudo + ' was kicked due to AKFness.', 'info');

            socket.emit('died', globalBR[afkPlayer.room][indexplayer].id);
            socket.in(lastEmits[i].room).emit('died', globalBR[afkPlayer.room][indexplayer].id);

            console.log(
              globalBR[afkPlayer.room][indexplayer].pseudo +
              " was kicked due to AFKness with " +
              globalBR[afkPlayer.room][indexplayer].score +
              " points."
            );

            globalBR[afkPlayer.room].splice(indexplayer, 1);
            lastEmits.splice(i, 1);

            if(globalBR[afkPlayer.room].length < 1) {
              brRooms[afkPlayer.room].state = "preparating";
            }
            break;
          }
        }
      }
      else if(afkPlayer.state === "inRoom") {
        if(typeof(rooms[afkPlayer.room]) !== 'undefined') {
          let indexplayer = -1;
          for(let j = 0; j < rooms[afkPlayer.room].length; j++) {
            if(rooms[afkPlayer.room][j].id === afkPlayer.id) {
              indexplayer = j;
              break;
            }
          }

          if(indexplayer !== -1) {
            if(sendMessage) socket.emit('message', afkPlayer.pseudo + ' was kicked from room due to AKFness.', 'info');
            socket.in(afkPlayer.room).emit('message', afkPlayer.pseudo + ' was kicked from room due to AKFness.', 'info');

            socket.emit('kickedFromRoom', afkPlayer.id);
            socket.in(afkPlayer.room).emit('kickedFromRoom', afkPlayer.id);

            console.log(
              afkPlayer.pseudo + " was kicked from room " + afkPlayer.room + " due to AFKness"
            );

            rooms[afkPlayer.room].splice(indexplayer, 1);
            lastEmits.splice(i, 1);

            socket.in(afkPlayer.room).emit('roomPlayers', rooms[afkPlayer.room], afkPlayer.room, rooms[afkPlayer.room].mode);

            if(rooms[afkPlayer.room].length < 1) {
              delete rooms[afkPlayer.room];
            }
          }
        }
        else if(typeof(brRooms[afkPlayer.room]) !== 'undefined') {
          let indexplayer = -1;
          for(let j = 0; j < brRooms[afkPlayer.room].length; j++) {
            if(brRooms[afkPlayer.room][j].id === afkPlayer.id) {
              indexplayer = j;
              break;
            }
          }

          if(indexplayer !== -1) {
            if(sendMessage) socket.emit('message', afkPlayer.pseudo + ' was kicked from room due to AKFness.', 'info');
            socket.in(afkPlayer.room).emit('message', afkPlayer.pseudo + ' was kicked from room due to AKFness.', 'info');

            socket.emit('kickedFromRoom', afkPlayer.id);
            socket.in(afkPlayer.room).emit('kickedFromRoom', afkPlayer.id);

            console.log(
              afkPlayer.pseudo + " was kicked from room " + afkPlayer.room + " due to AFKness"
            );

            brRooms[afkPlayer.room].splice(indexplayer, 1);
            lastEmits.splice(i, 1);

            socket.in(afkPlayer.room).emit('roomPlayers', brRooms[afkPlayer.room], afkPlayer.room, 'br');

            if(brRooms[afkPlayer.room].length < 1) {
              brRooms.splice(afkPlayer.room, 1);
            }
          }
        }
      }
    }
  }
}

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

/* Orders the global BR game */
function orderGlobalBR(room) {
  for (let i = 0; i < globalBR[room].length; i++)
      for (let j = 0; j < globalBR[room].length; j++)
          if (globalBR[room][j].score < globalBR[room][i].score)
              [globalBR[room][i], globalBR[room][j]] = [globalBR[room][j], globalBR[room][i]];
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

/* Create a 2D array */
function make2DArray(w, h, contained) {
	let arr = [];
	for(let i = 0; i < h; i++) {
		arr[i] = [];
		for(let j = 0; j < w; j++) {
			arr[i][j] = contained;
		}
	}
	return arr;
}

function showMode(mode) {
  if(mode === 'basic') return "Basic";
  else if(mode === 'chill') return "Netflix 'nd Chill";
  else if(mode === 'boom') return "Boom !";
  else if(mode === 'br') return "Battle Royal";
  else if(mode === 'modified') return "Modified";
  else return "WTF IS THIS MODE";
}
