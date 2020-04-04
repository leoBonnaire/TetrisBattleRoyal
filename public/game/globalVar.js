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

/* Usefull for drawing the preview */
let justLocked; // Was a piece just locked ?
let justAdd; // Was a row just added ?

let offline;

/* Images */
let cyan, blue, green, orange, purple, red, yellow, grey, grey2;
let logo;
let ingameBg;
let bgPerPlayer;

let allRooms;

let spectate = false;

/* Mobile var slide */
let xBefore;
let yBefore;
let timeBefore;

/* Server stuffs */

let socket = io('localhost:3000');
// let socket = io('192.168.1.88:3000');
// let socket = io('hcl0ud.ddns.net:3000');
let id;
let roomPlayersArray = [];
let allTimeR; // All times ranking
