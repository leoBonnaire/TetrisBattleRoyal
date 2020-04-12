/*

  *
  * This file is where the server message are handle by the client
  *

*/

socket.emit('NeedAllTimeRanking'); // Ask for the all times ranking

// On affiche une boîte de dialogue quand le serveur nous envoie un "message"
socket.on('message', function(message, type) {
	printMessage(message, type);
})

socket.on('yourId', function(idReceived) {
  id = idReceived;
});

socket.on('startNow', function() {
	startGame();
});

socket.on('okToPlay', function(isOk, text) {
	if(isOk) {
		document.getElementById("homeform").style.display = "none";
		document.getElementById("room").style.display =  "block";
	}
	else {
		printMessage(text, 'warning');
	}
});

socket.on('roomPlayers', function(roomPlayers, room, mode) {
  let listItem;
  roomPlayersArray = roomPlayers;
  if (document.getElementById("div1"))
  {
    let element = document.getElementById("div1");
    element.parentNode.removeChild(element);
  }

  // Make a container element for the list
  let listContainer = document.createElement('div');
  listContainer.setAttribute("id", "div1");

	let roomDisplay = document.createElement('h2');
	roomDisplay.innerHTML = "Room #" + room + " . Gamemode : " + showMode(mode) + "<br><br>";
	listContainer.appendChild(roomDisplay);

  // Make the list
  let listElement = document.createElement('ul');

  // Add it to the page
  document.getElementById('room').appendChild(listContainer);
  listContainer.appendChild(listElement);

  for (i = 0; i < roomPlayersArray.length; ++i) {
    // create an item for each one
    listItem = document.createElement('li');

		let isReady;
		if(roomPlayersArray[i].ready) isReady = " is ready !";
		else isReady = " is preparating ...";

    // Add the item text
    listItem.innerHTML = roomPlayersArray[i].pseudo + isReady;

    // Add listItem to the listElement
    listElement.appendChild(listItem);
	}
});

socket.on('died', function(idR) {
	if(idR === id && !spectate) {
		if(gameStarted && !gameOver) endGame();
		printMessage('You were AFk so you were kicked out of the game.<br>How dare you!<br>You idiot.', 'warning');
	}
});

socket.on("allTimeRanking4u", function(allTimeGlobal) {
	allTimeR = allTimeGlobal;
	if(!gameOver && window.location.href.split("/")[3] === "pr" || !gameOver && window.location.href.split("/")[3] === "br")
		dispAllTimeRanking(); // On the menu only
});

socket.on("rooms4u", function(roomsR) {
	allRooms = roomsR;
	if(!gameOver && window.location.href.split("/")[3] === "pr") displayPlayingRooms();
});

socket.on('classement', function(global) {
	classement = global; // Update the global ranking

  /* Find the player's rank */
  for(let i = 0; i < classement.length; i++) {
    if(classement[i].id === id && !gameOver) rank = i + 1;
  }

  /* And refresh the display */
  if(gameStarted && !gameOver) {
		displayInfos();
		dispOtherBoards();
	}
});

socket.on("death", function(isALegend) {
	if(!spectate) {
		let scoreSentence = document.getElementById("scoreS");
		if(isALegend) {
			scoreSentence.innerHTML = "You made it to the leaderboard with " + score + " points !";
			// TODO : Fireworks
		}
		else scoreSentence.innerHTML = "You scored " + score + " points.";
	}
});

socket.on("stopSpectate", function() {
	window.location.reload();
});

socket.on('addRow', function(playerId) {
	if(playerId == id) {
		if(mode !== 'chill') addRow();
		if(mode == 'boom') score -= 5;
		socket.emit('score', score, board);
	}
});

socket.on('wonBR', function(idR) {
	if(idR === id && !spectate) {
		if(gameStarted && !gameOver) endGameAsLegend();
	}
});
