
/* Define the tetromino's color */
const COL = [
	"#333333", // Default color
	"#515151", // Preview color
	"red",
	"green",
	"yellow",
	"blue",
	"purple",
	"cyan",
	"orange",
];

/* Refresh the display */
function refreshDisplay(full = false) {

	if(full) {
		background(51);

		let fieldHeight;

		if(onMobile) fieldHeight = height * 0.8;
		else fieldHeight = height;

		SQ = fieldHeight / 20;

		buttonWidth = width / 4;
		buttonHeight = height * 0.1 - 2;

		displayInfos();
		if(!offline) dispOtherBoards();
	}

	draw2DArray(board, SQ);
}

/* Display the next piece that is about to be launched and the score*/
function displayInfos() {

	if(onMobile) textSize(25);
	else textSize(15);

	dispNext(); // Next piece and separations

	push();
	translate(10 * SQ, 5 * SQ);

	dispPlayerInfos();
	if(!offline) {
		dispRanking();
	}

	pop();

}

/* Display the boards of the first players */
function dispOtherBoards() {

	push();

	translate(xOff + 15 * SQ, 0);

	let numberOfRows = 2;

	let oSQ = SQ / numberOfRows;
	let oWidthBoard = oSQ * 10;

	let maxXBoard = floor((width - 15 * SQ) / oWidthBoard);

	fill("#262626");
	rect(0, 0, width, height);

	textSize(oSQ);
	fill("white");

	push();
	for(let j = 0; j < numberOfRows; j++) {
		for(let i = 0; i < maxXBoard; i++) {
			if(j * maxXBoard + i >= classement.length) {
				j = numberOfRows + 1;
				break;
			}

			draw2DArray(classement[j * maxXBoard + i].board, oSQ);
			text(classement[j * maxXBoard + i].pseudo, oSQ, 2 * oSQ);
			translate(oWidthBoard, 0);
		}
		translate(- maxXBoard * oWidthBoard, (20 / numberOfRows) * SQ);
	}
	pop();

	/* Draw the grid */
	stroke("white");
	strokeWeight(3);
	for(let i = 0; i < numberOfRows; i++) {
		for(let j = 0; j < maxXBoard + 1; j++) {
			line(j * 10 * oSQ, 0, j * 10 * oSQ, height);
		}
		line(0, (20 / numberOfRows) * SQ * i, maxXBoard * oWidthBoard, (20 / numberOfRows) * SQ * i);
	}

	pop();
}

/* Display next piece and the separations */
function dispNext() {
	push();
	translate(10 * SQ, 0);
	fill(COL[0]);
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
	for (let i = 0 ; i < classement.length ; i++) {
		if(i > 9) break; // Display only the 10 first player

		/* Display the rank and the pseudo */
		text("#" + String(i + 1) + ' : ' + String(classement[i].pseudo), xOff +  SQ * 0.5, yOff +  SQ * (i + 4));
		text(String(classement[i].score), xOff +  SQ * 4, yOff +  SQ * (i + 4)); // Display the score
	}
	pop();
}

function dispPlayerInfos() {

	push();

	if(gameOver) fill("#4d4d4d");
	else fill("white");
	text(pseudo + " : ", xOff +  SQ * 0.5, yOff +  SQ * 1);

	push();
	textSize(SQ * 0.75);
	text(score, xOff +  SQ * 3, yOff +  SQ * 1);
	textSize(SQ * 0.5);
	if(!offline) text("Your rank : #" + rank, xOff +  SQ * 0.5, yOff +  SQ * 2.5);
	pop();

	pop();

}


function dispDeath() {

	push();

	stroke("#515151");
	strokeWeight(5);
	line(0, 0, 10 * SQ, 20 * SQ);
	line(10 * SQ, 0, 0, 20 * SQ);

	pop();

	buttons.push(new Button (
		3 * SQ, 9 * SQ,
		restart,
		"Restart",
		4 * SQ, 2 * SQ
	));

	buttons[buttons.length - 1].show();

}


function dispAllTimeRanking() {
	let listItem;

  if (document.getElementById("div2"))
		document.getElementById("div2").parentNode.removeChild(document.getElementById("div2"));

  // Make a container element for the list
  let listContainer = document.createElement('div');
  listContainer.setAttribute("id", "div2")

  // Make the list
  let listElement = document.createElement('ul');

  // Add it to the page
  document.getElementById('homeform').appendChild(listContainer);
  listContainer.appendChild(listElement);

  for (i = 0; i < allTimeR.length; ++i) {
    // create an item for each one
    listItem = document.createElement('li');

    // Add the item text
    listItem.innerHTML = allTimeR[i].score + " : " + allTimeR[i].pseudo;

    // Add listItem to the listElement
    listContainer.appendChild(listItem);
	}
}

function dispMusicMessage() {
	textSize(9);
	text("[P]: play music . [S]: Stop music", xOff + SQ * 0.25, yOff + SQ * 1.5);
}

function drawPiecePart(color, x, y, wCell) {
	if(color === COL[0]) {
		fill(color);
		rect(x, y, wCell, wCell);
	}
	else {
		let img;
		if(color === "red") img = red;
		else if(color === "green") img = green;
		else if(color === "yellow") img = yellow;
		else if(color === "cyan") img = cyan;
		else if(color === "purple") img = purple;
		else if(color === "blue") img = blue;
		else if(color === "orange") img = orange;
		else if(color === COL[1]) img = grey;
		image(img, x, y, wCell, wCell);
	}
}
