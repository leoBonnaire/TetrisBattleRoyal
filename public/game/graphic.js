/* Refresh the display,
 * full = true is for a full refresh.
 * Else, it's just the board that is refreshed
 */
function refreshDisplay(full = false) {

	if(full) {
		background(51);

		if(onMobile) {
			SQ = width / 15;
			image(ingameBg, 0, 20 * SQ, ingameBg.width / 2, ingameBg.height / 2);
		}
		else {
			SQ = height / 20;
		}

		displayInfos();
		if(!onMobile)  {
			push();
			translate(xOff + 15 * SQ, 0);
			image(ingameBg, 0, 0, 1920 / 2, 1698 / 2);
			pop();
			if(!offline) dispOtherBoards();
		}
	}

	draw2DArray(board, SQ);
}

/* Display all the infos */
function displayInfos() {

	dispNext(); // Next piece and separations

	push();
	translate(10 * SQ, 5 * SQ);

	dispPlayerInfos(); // Display the player's infos
	if(!offline) {
		dispRanking(); // Display the ranking
	}

	pop();

}

/* Display the boards of the first players */
function dispOtherBoards() {

	push();

	translate(xOff + 15 * SQ, 0);
	image(ingameBg, 0, 0, 1920 / 2, 1698 / 2);

	let numberOfRows = 2;

	let oSQ = SQ / numberOfRows;
	let oWidthBoard = oSQ * 10;

	let maxXBoard = floor((width - 15 * SQ) / oWidthBoard);

	textSize(oSQ);

	push();
	for(let j = 0; j < numberOfRows; j++) {
		for(let i = 0; i < maxXBoard; i++) {
			if(typeof(classement[j * maxXBoard + i]) !== 'undefined') {
				fill(255);
				stroke(51);
				draw2DArray(classement[j * maxXBoard + i].board, oSQ);
			 	text(classement[j * maxXBoard + i].pseudo, oSQ, 2 * oSQ);
				noFill();
				stroke(255);
				rect(0, 0, 10 * oSQ, 20 * oSQ);
			}
			else break;
			translate(oWidthBoard, 0);
		}
		translate(- maxXBoard * oWidthBoard, (20 / numberOfRows) * SQ);
	}
	pop();


	pop();
}

/* Display next piece and the separations */
function dispNext() {
	push();
	translate(10 * SQ, 0);
	fill(91);
	rect(xOff, yOff, 5 * SQ, 20 * SQ);

	/* Draw the next tetromino */
	nextP.y = 1;
	nextP.x = 1;
	nextP.show(nextP.color);
	nextP.x = 3;
	nextP.y = -2;

	/* Draw the grid containing that tetromino */
	for(let i = 0; i < 5; i++) {
	  line(xOff + i * SQ, 0, xOff + i * SQ, 5 * SQ);
	}
	for(let i = 0; i < 5; i++) {
	  line(xOff, yOff + i * SQ, xOff + 5 * SQ, yOff + i * SQ);
	}

	fill("white");
	text("Next : ", xOff + SQ * 0.5, yOff + SQ * 0.75);

	/* Draw the separations */
	line(xOff, 5 * SQ, xOff + 5 * SQ, 5 * SQ);
	line(xOff, 8 * SQ, xOff + 5 * SQ, 8 * SQ);

	pop();

}

/* Display the ranking */
function dispRanking() {

	push();

	fill("white");
	for(let i = 0 ; i < classement.length ; i++) {
		if(i > 9) break; // Display only the 10 first player

		/* Display the rank and the pseudo */
		text("#" + String(i + 1) + ' : ' + String(classement[i].pseudo), xOff +  SQ * 0.5, yOff +  SQ * (i + 4));
		text(String(classement[i].score), xOff +  SQ * 4, yOff +  SQ * (i + 4)); // Display the score
	}
	pop();
}

/* Display the pseudo and score of the player */
function dispPlayerInfos() {

	push();

		fill("white");
		if(!spectate) text(pseudo + " : ", xOff +  SQ * 0.5, yOff +  SQ * 1);
		else text("Spectator", xOff +  SQ * 0.5, yOff +  SQ * 1);

		push();
			textSize(SQ * 0.75);
			if(!spectate) text(score, xOff +  SQ * 3, yOff +  SQ * 1);
			textSize(SQ * 0.5);
			if(!offline && !spectate) text("Your rank : #" + rank, xOff +  SQ * 0.5, yOff +  SQ * 2.5);
			else if (spectate) text("Your rank : Spec", xOff +  SQ * 0.5, yOff +  SQ * 2.5);
		pop();

	pop();

}

/* Display the leaderboard */
function dispAllTimeRanking() {
	let listItem;

	/* If it exist, destroy itself */
  if (document.getElementById("div2"))
		document.getElementById("div2").parentNode.removeChild(document.getElementById("div2"));

		if(onMobile) {
        document.getElementById('div2').style.zoom = 1.2;
    }

  // Make a container element for the list
  let listContainer = document.createElement('div');
  listContainer.setAttribute("id", "div2");
  listContainer.style.padding = "2%";
  // Make the list
  let listElement = document.createElement('table');
	listElement.align = "center";

	// Create the title : Leaderboard
	titelContainer = document.createElement("tr");
	titel = document.createElement('th');
	titel.colSpan = "2";
	titel.innerHTML = "<i class='nes-icon trophy'></i><br> Leaderboard";
	titelContainer.appendChild(titel);
	listElement.appendChild(titelContainer);

	listItem = document.createElement('tr');

	subListItem1 = document.createElement('th');
	subListItem2 = document.createElement('th');

	subListItem1.innerHTML = "Score";
	subListItem2.innerHTML = "Pseudo";

	listItem.appendChild(subListItem1);
	listItem.appendChild(subListItem2);

	// Add listItem to the listElement
	listElement.appendChild(listItem);

  for (i = 0; i < allTimeR.length; ++i) {
    // create an item for each one
    listItem = document.createElement('tr');

		subListItem1 = document.createElement('td');
		subListItem2 = document.createElement('td');

		subListItem1.innerHTML = allTimeR[i].score;
		subListItem2.innerHTML = allTimeR[i].pseudo;

		listItem.appendChild(subListItem1);
		listItem.appendChild(subListItem2);

    // Add listItem to the listElement
    listElement.appendChild(listItem);
	}

	// Add it to the page
  document.getElementById('homeform').appendChild(listContainer);
  listContainer.appendChild(listElement);

  document.getElementById('bottomTables').appendChild(listContainer);
}

/* Display the rooms */
function displayPlayingRooms() {
	let listItem;

	/* If it exist, destroy itself */
  if (document.getElementById("div3"))
		document.getElementById("div3").parentNode.removeChild(document.getElementById("div3"));

		if(onMobile) {
				document.getElementById('div3').style.zoom = 1.8;
		}

  // Make a container element for the list
  let listContainer = document.createElement('div');
  listContainer.setAttribute("id", "div3")
  listContainer.style.padding = "2%";
  // Make the list
  let listElement = document.createElement('table');
	listElement.align = "center";

	// Create the title : Leaderboard
	titelContainer = document.createElement("tr");
	titel = document.createElement('th');
	titel.colSpan = "5";
	titel.innerHTML = "<i class='nes-logo'></i><br> Active rooms";
	titelContainer.appendChild(titel);
	listElement.appendChild(titelContainer);

	listItem = document.createElement('tr');

	subListItem0 = document.createElement('th');
	subListItem1 = document.createElement('th');
	subListItem2 = document.createElement('th');
	subListItem3 = document.createElement('th');
	subListItem4 = document.createElement('th');

	subListItem1.innerHTML = "Room";
	subListItem2.innerHTML = "Mode";
	subListItem3.innerHTML = "State";
	subListItem4.innerHTML = "Players";

	listItem.appendChild(subListItem0);
	listItem.appendChild(subListItem1);
	listItem.appendChild(subListItem2);
	listItem.appendChild(subListItem3);
	listItem.appendChild(subListItem4);

	// Add listItem to the listElement
	listElement.appendChild(listItem);

  for (i = 0; i < allRooms.length; ++i) {
    // create an item for each one
    listItem = document.createElement('tr');

		subListItem0 = document.createElement('div');
		sub1subListItem0 = document.createElement('button');
		sub1subListItem0.setAttribute("onclick",
			"document.getElementById('roomChoice').value = \""+allRooms[i].name+"\"; changeMode(\""+allRooms[i].mode+"\");"
		);
		sub1subListItem0.innerHTML = "Join";
		sub2subListItem0 = document.createElement('button');
		sub2subListItem0.innerHTML = "Spectate";
		sub2subListItem0.setAttribute("onclick",
			"socket.emit('spectate', \""+allRooms[i].name+"\"); spectate = true;"
		);
		subListItem0.appendChild(sub2subListItem0);
		// subListItem0.innerHTML += "<br>";
		subListItem0.appendChild(sub1subListItem0);

		subListItem1 = document.createElement('td');
		subListItem2 = document.createElement('td');
		subListItem3 = document.createElement('td');
		subListItem4 = document.createElement('td');

		subListItem1.innerHTML = allRooms[i].name;

		subListItem2.innerHTML = showMode(allRooms[i].mode);

		subListItem3.innerHTML = allRooms[i].state.toUpperCase();

		if(allRooms[i].players.length === 1)
			subListItem4.innerHTML = allRooms[i].players[0];
		else if(allRooms[i].players.length === 2)
			subListItem4.innerHTML = allRooms[i].players[0] + ", " + allRooms[i].players[1];
		else if(allRooms[i].players.length === 3)
			subListItem4.innerHTML = allRooms[i].players[0] + ", " + allRooms[i].players[1] + ", " + allRooms[i].players[2];
		else
			subListItem4.innerHTML = allRooms[i].players[0] + ", " + allRooms[i].players[1] + ", " + allRooms[i].players[2] + " ... (" + allRooms[i].players.length + ")";

		listItem.appendChild(subListItem0);
		listItem.appendChild(subListItem1);
		listItem.appendChild(subListItem2);
		listItem.appendChild(subListItem3);
		listItem.appendChild(subListItem4);

    // Add listItem to the listElement
    listElement.appendChild(listItem);
	}

	// Add it to the page
  document.getElementById('homeform').appendChild(listContainer);
  listContainer.appendChild(listElement);

  document.getElementById('bottomTables').appendChild(listContainer);
}

/* Draw a tretomino square */
function drawPiecePart(color, x, y, wCell) {
	if(color === 0) {
		fill("#4d4d4d");
		rect(x, y, wCell, wCell);
	}
	else {
		let img;
		if(color === 1) img = grey;
		else if(color === 2) img = grey2;
		else if(color === 3) img = red;
		else if(color === 4) img = green;
		else if(color === 5) img = yellow;
		else if(color === 6) img = cyan;
		else if(color === 7) img = purple;
		else if(color === 8) img = blue;
		else if(color === 9) img = orange;
		image(img, x, y, wCell, wCell);
	}
}
