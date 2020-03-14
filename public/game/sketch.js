/*
function play(e) {
	if(e.keyCode == 80) audio.play();
	if(e.keyCode == 83) audio.pause();
}
*/

function preload() {
  blue = loadImage('assets/blocks/blue.png');
	cyan = loadImage('assets/blocks/cyan.png');
	green = loadImage('assets/blocks/green.png');
	orange = loadImage('assets/blocks/orange.png');
	purple = loadImage('assets/blocks/purple.png');
	red = loadImage('assets/blocks/red.png');
	yellow = loadImage('assets/blocks/yellow.png');
  grey = loadImage('assets/blocks/grey.png');
}

function setup() {

	/* Initiate variables */
	score = 0;
	addScore = 0;
	deltaT = 1000;

	gameStarted = false;
	gameOver = false;
	justLocked = false;
	offline = false;

	xOff = 0;
	yOff = 0;

	/* Make board a 2D array full of COL[0] cells */
	board = make2DArray(10, 20, 0);

	p = randomPiece(); // Initiate firt piece
	nextP = randomPiece(); // Initiate next piece
	preview = new Preview(p.tetromino, p.tetrominoN, p.x, p.y); // Initiate preview

	/* Initiate time */
	lastTime = (new Date()).getTime();

	/* Check if the user is on mobile */
 	onMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

	if(onMobile) {
		// Actions if the user is on mobile

	} else {
		// Actions if the user is not on mobile

	}

}
function roomHandler() {
	// On demande le pseudo au visiteur...
	pseudo = document.getElementById('pseudo').value;
	let room = document.getElementById('roomChoice').value;

	// TODO : list of forbidden pseudo
	if(pseudo == " " || pseudo == null) pseudo = "Plouf";

	socket.emit('joinRoom', pseudo, room); // Send the pseudo of the user
}

function startGame() {
	if(!gameStarted) {

		centerCanvas();
		background(51);

		if(offline) pseudo = "You";

		if(onMobile) {
			// Actions if the user is on mobile
			createCommands();
		} else {
			// Actions if the user is not on mobile
		}

		gameStarted = true;

		refreshDisplay(true);
	}
}

function endGame() {
	gameOver = true;
	dispDeath();
	if(!offline) socket.emit('lost');
}

function draw() {

	if(gameStarted && !gameOver) {

		time = (new Date()).getTime();

		if(time - lastTime >= deltaT) {

			// This is executed every delta time

			if(addScore != 0) {
				if(addScore >= 40) addScore += 10;
				score += addScore;

				deltaT -= 30 * (addScore / 10);
				deltaT = constrain(deltaT, 250, 1000);

				/* Send the infos to the server */
		    if(!offline) socket.emit('score', score, board);
				addScore = 0;
			}

			p.moveDown(); // Just drop the piece

			lastTime = time;
		}

		if(offline) displayInfos();

		updatePreview();
		p.show(p.color);
	}
	else if(gameStarted && !offline) {

		displayInfos();
		dispOtherBoards();

	}

}

document.addEventListener('keydown', function(e) {

	if(gameStarted && !gameOver) {

		switch(e.keyCode) {
			case 37: // Left arrow
				moveL();
				break;
			case 38: // Up arrow
			  rotateP();
				break;
			case 39: // Right arrow
				moveR();
				break;
			case 40: // Down arrow
				down();
				break;
			case 32: // Space bar
				place();
				break;
			case 80: // p
				// audio.play();
				break;
			case 83: // s
				// audio.pause();
				break;
		}
	}
}
);

function mousePressed() {
	checkButtonPressed(mouseX, mouseY);
}

/* Movements function */
function moveR() { p.moveRight(); }
function moveL() { p.moveLeft(); }
function down() { p.moveDown(); lastTime = time; } // Reset timer
function rotateP() { p.rotate(); }
function place() { p.y = preview.y; lastTime = time - 1000; } // Go directly to the next

function restart() { location.reload(true); }

/* Size and center correctly the canvas */
function centerCanvas() {
	canvas = createCanvas(windowWidth, windowHeight);
	canvas.position(0, 0);
}


function windowResized() {
	if(gameStarted) {
		centerCanvas();
		refreshDisplay(true);
		if(gameOver) dispDeath();
	}
}
