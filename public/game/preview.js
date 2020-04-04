/*

 * Preview piece

*/

function updatePreview() {
	/* Do not hide the old preview if we just locked */
	if(!justLocked && !justAdd)	preview.show(0);
	else if(justLocked) justLocked = false;
	else if (justAdd) justAdd = false;
	preview = new Preview(p.tetromino, p.tetrominoN, p.x, p.y);
	while(!preview.collision(0,1,preview.activeTetromino)) {
		preview.y++;
	}
	preview.show(1);
}

class Preview {

	constructor(tetromino, n, x, y) {

		this.tetromino = tetromino; // What piece it is

		this.tetrominoN = n; // Index of the piece (rotation)
		this.activeTetromino = this.tetromino[this.tetrominoN];

		/* Initial pos */
		this.x = x;
		this.y = y;
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
				if(board[newY][newX] != 0){
					return true;
				}
			}
		}

		return false; // no collision
	}
}
