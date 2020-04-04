/*

   *
   * Main script file
   * Where the game take place ...
   *

*/


/* Load the images */
function preload() {
  blue = loadImage('assets/blocks/blue.png');
	cyan = loadImage('assets/blocks/cyan.png');
	green = loadImage('assets/blocks/green.png');
	orange = loadImage('assets/blocks/orange.png');
	purple = loadImage('assets/blocks/purple.png');
	red = loadImage('assets/blocks/red.png');
	yellow = loadImage('assets/blocks/yellow.png');
  grey = loadImage('assets/blocks/grey.png');
  grey2 = loadImage('assets/blocks/grey2.png');
  logo = loadImage('assets/banner.png');
  ingameBg = loadImage('assets/background.png');
}

/* Setup the game */
function setup() {
  initiateGVar(); // Initiate all the global var

	/* Check if the user is on mobile */
 	onMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function roomHandler() {
	// On demande le pseudo au visiteur...
	pseudo = document.getElementById('pseudo').value;
	room = document.getElementById('roomChoice').value;

	socket.emit('joinRoom', pseudo, room, mode); // Send the user in the room
}

function startGame() {
	if(!gameStarted) {
    gameStarted = true; // The game starts
    if(offline) pseudo = "Score : ";
		centerCanvas();
		refreshDisplay(true); // Full refresh
    document.getElementsByTagName("BODY")[0].style.overflow = "hidden"; // Prevent scrolling
	}
}

function endGame() {
  if(!spectate) {
    gameOver = true;
    canvas.elt.style.display = "none"; // Hide the canvas
    document.getElementById("death").style.display = "block"; // Show the death screen
    if(!offline) {
      socket.emit('lost'); // Tell the server you died
      document.getElementById("brr").style.display = "none"; // Hide the menu
    }
    else {
      document.getElementById("homeMenu").style.display = "none"; // Hide the menu
      document.getElementById("scoreS").innerHTML = "You scored " + score + " points."; // Show the score
    }
  }
}

function draw() {

	if(gameStarted && !gameOver) {

		time = (new Date()).getTime(); // Update the time

		if(time - lastTime >= deltaT) {

			// This is executed every delta time

			if(addScore != 0) {
				if(addScore >= 40) addScore = 100; // Tretis was made
				score += addScore; // Update the score
				addScore = 0; // Reset that

        if(!offline && !spectate) socket.emit('score', score, board);
			}

      if(mode == 'boom') {
        deltaT -= 3; // Time is accelerating twice faster
        deltaT = constrain(deltaT, 150, 1000); // delta time can go down to 150 ms
      } else {
        deltaT -= 1.5;
        deltaT = constrain(deltaT, 250, 1000); // delta time can go down to 250 ms
      }

			p.moveDown(); // Just drop the piece

			lastTime = time; // Update time
		}

    displayInfos();

		updatePreview();
		p.show(p.color); // Show the piece
	}
}

function mousePressed() {
  xBefore = mouseX;
  yBefore = mouseY;
  timeBefore = (new Date()).getTime();
}

function mouseReleased() {
  if(gameStarted) {
    let deltaX = mouseX - xBefore;
    let deltaY = mouseY - yBefore;

    let moveSize = sqrt(deltaX * deltaX + deltaY * deltaY);

    if(moveSize > 40) {
      if(abs(deltaX) > abs(deltaY)) {
        if(deltaX > 40) {
          let movementsNumber = floor(deltaX / SQ) / 2;
          for(let i = 0; i < movementsNumber; i++) {
            moveR();
          }
        }
        else if (deltaX < -40) {
          let movementsNumber = floor(- deltaX / SQ) / 2;
          for(let i = 0; i < movementsNumber; i++) {
            moveL();
          }
        }
      }
      else {
          if(deltaY > 40) {
             let movementsNumber = floor(deltaY / SQ);
             goingDown = true;
             for(let i = 0; i < movementsNumber; i++) {
               down();
             }
             goingDown = false;
          }
      }
    }
    else if((new Date()).getTime() - timeBefore > 50) {
      rotateP();
      timeBefore = (new Date()).getTime();
    }
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
	if(gameStarted && !gameOver) {
		centerCanvas();
		refreshDisplay(true);
	}
}

function changeMode(modeToSet) {
  mode = modeToSet;
  if(document.getElementById('modeP') !== null) {
    if(mode == 'chill') document.getElementById('modeP').innerHTML = "Gamemode : Netflix 'nd chill  ";
    else if(mode == 'basic') document.getElementById('modeP').innerHTML = "Gamemode : Basic ";
    else if(mode == 'boom') document.getElementById('modeP').innerHTML = "Gamemode : Boom !";
  }
}

/* Output a random int */
function randInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
