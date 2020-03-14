
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

/* Draw on the canvas an array */
function draw2DArray(arr, wCell) {

	push();
	strokeWeight(2);
	if(wCell === SQ) translate(xOff, yOff);

	for(let i = 0; i < arr.length; i++) {
		for(let j = 0; j < arr[i].length; j++) {
			drawPiecePart(intToCol(arr[i][j]), j * wCell, i * wCell, wCell);
		}
	}
	pop();
}

/* Transform a given color to an int value between 0 and 9 */
function colToInt(color) {
	for(let i = 0; i < COL.length; i++) {
		if(color === COL[i]) return i;
	}
}

/* Reverse colToInt() */
function intToCol(int) {
	return COL[int];
}
