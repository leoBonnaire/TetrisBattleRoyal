/*

   *
   * This file is the bank of the global variables and their initialisation
   *

*/

 let socket = io('localhost:3000');
// let socket = io('192.168.1.88:3000');
// let socket = io('hcl0ud.ddns.net:3000');

 function initiateGVar() {

   rank = 1;

   score = 0;
   addScore = 0;
   deltaT = 1000;

   gameStarted = false;
   gameOver = false;
   justLocked = false;

   offline = false;

   xOff = 0;
   yOff = 0;

   spectate = false;
   roomPlayersArray = [];

   board = make2DArray(COLL, ROW, 0);

   p = randomPiece(); // Initiate first piece
   nextP = randomPiece(); // Initiate next piece
 	 preview = new Preview(p.tetromino, p.tetrominoN, p.x, p.y); // Initiate preview

   lastTime = (new Date()).getTime(); // time

   /* Check if the user is on mobile */
  	onMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if(onMobile) {
        document.getElementById('div2').style.zoom = 1.2;
        document.getElementById('div3').style.zoom = 1.8;
    }
 }

/* Player */

let pseudo; // Player pseudo
let board; // 2D array : player's board
let rank = 1; // Players's rank
let score; // Actual score
let addScore; // Score to add (use to check the tretis)

/* Time */

let time, lastTime; // Keep tracks of time
let deltaT; // Time between each piece fall in ms

/* Board size */

const ROW = 20; // Number of rows
const COLL = 10; // Number of collums
let SQ; // Size of one square
let xOff, yOff; // Translating offsets for the whole main field drawing (not in use)

/* Pieces */

let p; // Actual piece
let nextP; // next Piece
let preview; // Preview Piece

/* State */

let mode; // Game mode
let offline; // Is the player offline ?
let gameOver; // Is the game over ?
let onMobile; // Is the player on mobile ?
let spectate; // Is the player a spectator ?
let gameStarted; // Has the started ?
let goingDown; // Is the piece moving down ? (for mobile)
/* Usefull for the preview drawing : */
let justLocked; // Was a piece just locked ?
let justAdd; // Was a row just added ?

/* Images */

let cyan, blue, green, orange, purple, red, yellow, grey, grey2; // Blocks
let logo; // Main menu logo
let ingameBg; // Background in game

/* Mobile var slide */

let xBefore; // x-pos of the user click before he released it
let yBefore; // y-pos of the user click before he released it
let timeBefore; // time when the user clicked

/* Server */

let id; // Player's ID
let allTimeR; // Leaderboard
let allRooms; // Playing rooms (on meunu)
let classement; // Global ranking (in game)
let room; // Player's room
