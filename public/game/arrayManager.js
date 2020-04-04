
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
			drawPiecePart(arr[i][j], j * wCell, i * wCell, wCell);
		}
	}
	pop();
}
