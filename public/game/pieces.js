
/*

 * Everything about the pieces, contains :
 * Array of every pieces with their colors
 * Function returning a random piece
 * 			displaying the next piece
 * The Piece class containing all the functions

*/

let PIECES = PIECES_NORMAL;

/* Return a random Piece */
function randomPiece(){
    let r = floor(random(PIECES.length));
    return new Piece(PIECES[r][0], PIECES[r][1]);
}

class Piece {

	constructor(tetromino, color) {

		this.tetromino = tetromino; // What piece it is
		this.color = color; // Color of that piece

		this.tetrominoN = 0; // Index of the piece (rotation)
		this.activeTetromino = this.tetromino[this.tetrominoN];

		/* Initial pos */
		this.x = 3;
		this.y = -2;
	}

	/* Display the piece where it is with a given color */
	show(color) {

    push();
  	translate(xOff, yOff);
    strokeWeight(2);

		for(let r = 0; r < this.activeTetromino.length; r++){
			for(let c = 0; c < this.activeTetromino.length; c++){
				if(this.activeTetromino[r][c]){
          drawPiecePart(color, (this.x + c) * SQ, (this.y + r) * SQ, SQ);
				}
			}
		}

    pop();
	}

	/* Check collisions with borders and other pieces */
	collision(x, y, piece) {
		for(let r = 0; r < piece.length; r++){
			for(let c = 0; c < piece.length; c++){

				/* Ignore if the piece is empty */
				if(!piece[r][c]){
					continue;
				}

				/* Calculate the new positions */
				let newX = this.x + c + x;
				let newY = this.y + r + y;

				/* Check x border collisions */
				if(newX < 0 || newX >= COLL || newY >= ROW){
					return true;
				}
				/* Ignore if it's above the board */
				if(newY < 0){
					continue;
				}
				/* If the next cell is already taken */
				if(board[newY][newX] != 0) {
					return true;
				}
			}
		}

		return false; // no collision
	}

	rotate() {
		/* Change the pattern to the next one */
		let nextPattern = this.tetromino[(this.tetrominoN + 1)%this.tetromino.length];

		/* If the rotating piece will be out of the board,
		 * kick it to replace it in,
		 * By default, do not kick
		 */
		let kick = 0;

		/* Check if there will be a collision */
		if(this.collision(0,0,nextPattern)) {
			if(this.x > COLL/2){ // If it was on the right
				kick = -1; // Kick it to the left
			} else {
				kick = 1; // On the left, kick it to the right
			}
		}

		if(!this.collision(kick,0,nextPattern)) { // If there's no collision, ok to move

			this.show(0);

			this.x += kick; // Make the kick effective
			this.tetrominoN = (this.tetrominoN + 1) % this.tetromino.length; // Change the form
			this.activeTetromino = this.tetromino[this.tetrominoN]; // Update the active piece
		}
	}

	moveDown() {
		if(!this.collision(0,1,this.activeTetromino)){
			this.show(0);
			this.y++;
		} else if(!goingDown) { // Means there's a collision
			/* Reset the playing piece */
			this.lock();
			p = nextP;
			nextP = randomPiece();

			lastTime = time - 1000;
		}
	}

	moveLeft() {
		if(!this.collision(-1,0,this.activeTetromino)){
			this.show(0);
			this.x--;
		}
	}

	moveRight() {
		if(!this.collision(1,0,this.activeTetromino)){
			this.show(0);
			this.x++;
		}
	}

	/* Lock a piece so it's not the playable one anymore */
	lock() {
		for(let r = 0; r < this.activeTetromino.length; r++){
			for(let c = 0; c < this.activeTetromino.length; c++){

				/* Ignore if the piece is empty */
				if(!this.activeTetromino[r][c]){
					continue;
				}

				/* If you lock above the board, you lose the game */
				if(this.y + r < 0) {
          endGame();
					break;
				}

				/* Put the piece in the board to lock it */
				board[this.y+r][this.x+c] = this.color;
			}
		}

		/* Check if a row was completed */

		for(let r = 0; r < ROW; r++){

			let isRowFull = true;

			/* Return true if the row is full */
			for(let c = 0; c < COLL; c++){
				isRowFull = isRowFull && (board[r][c] != 0);
			}

			if(isRowFull) {

				for(let y = r; y > 1; y--){
					for(let c = 0; c < COLL; c++){
						/* Make every row going downward */
						board[y][c] = board[y - 1][c];
					}
				}

				/* Create a new empty row at the top */
				for(let c = 0; c < COLL; c++){
					board[0][c] = 0;
				}

				addScore += 10;
			}
		}

    /* Send the infos to the server when a piece was locked */
    if(!gameOver) {
      if(!offline && !spectate) socket.emit('score', score, board);
      justLocked = true;
      draw2DArray(board, SQ);
    }
	}
}

function addRow() {
  for(let i = 0; i < ROW - 1; i++) {
    for(let j = 0; j < COLL; j++) {
      /* Make every rows going upward */
      board[i][j] = board[i + 1][j];
    }
  }

  let voidIndex = randInt(COLL);

  /* Create a new row at the bottom */
  for(let i = 0; i < COLL; i++) {
    if(i != voidIndex) board[ROW - 1][i] = 2;
    else board[ROW - 1][i] = 0;
  }

  justAdd = true;
  draw2DArray(board, SQ);
}
