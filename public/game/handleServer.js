/*

  *
  * This file is where the server message are handle by the client
  *

*/

socket.emit('NeedAllTimeRanking'); // Ask for the all times ranking

// On affiche une boîte de dialogue quand le serveur nous envoie un "message"
socket.on('message', function(message) {
	alert(message);
})

socket.on('yourId', function(idReceived) {
  id = idReceived;
});

socket.on('startNow', function() {
	startGame();
});

socket.on('okToPlay', function(isOk) {
	if(isOk) {
		document.getElementById("homeform").style.display = "none";
		document.getElementById("room").style.display =  "block";
	}
	else {
		alert("The room is already playing!");
	}
});

socket.on('roomPlayers', function(roomPlayers, room) {
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
	roomDisplay.innerHTML = "Room : " + room;
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
	if(idR === id) {
		alert("Your AFKness killed you");
		endGame();
	}
});

socket.on("allTimeRanking4u", function(allTimeGlobal) {
	allTimeR = allTimeGlobal;
	dispAllTimeRanking(); // On the menu only
});

/* When we receive the global ranking */
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
})
