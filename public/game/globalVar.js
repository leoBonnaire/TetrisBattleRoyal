let board;

let classement; // Global ranking
let rank = 1; // Players's rank

let time, lastTime; // Keep tracks of time
const ROW = 20;
const COLL = 10;

let SQ; // Size of a square

let p; // Actual piece
let nextP; // next Piece

let preview;

let score; // Actual score
let addScore; // Score to add
let gameOver; // Is the game over ?

let deltaT; // Time between each piece fall in ms

let buttons = []; // Array of the buttons

let onMobile; // True is the user is on mobile

// let audio = new Audio('tetrisTheme.mp3');

let buttonWidth; // Size a single button
let buttonHeight; // Defined in the refreshDisplay() function

let xOff, yOff; // Translating offsets for the whole main field drawing

let gameStarted; // Has the started

let pseudo;

let justLocked;

let offline;

/* Server stuffs */

let socket = io('tetrisbr.ddns.net'); //MODIFY LOCALHOST BY YOUR OWN IP
let id;
let roomPlayersArray = [];
let allTimeR; // All times ranking
