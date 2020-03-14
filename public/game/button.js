
class Button {
  constructor(x, y, action, text, bWidth, bHeight) {

    this.x = x;
    this.y = y;
    this.action = action; // Function the button will exectute
    this.text = text;     // Text written on the button

    this.lastUse = 0; // Last time the button was used

    this.w = bWidth; // Button width
    this.h = bHeight; // Button height
  }

  /* Display the button */
  show() {
    push();

    textSize(25);
    translate(this.x, this.y);

    /* Rectangle */
    fill("purple");
    rect(0, 0, this.w, this.h, 10);

    /* Text */
    fill("white");;
    text(this.text, this.w / 4, this.h / 2);

    pop();
  }

  /* Check if a button was pressed */
  wasPressed(x, y) {
    if(x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h)
      return true;
    else return false;
  }

}

/* Create the buttons to move */
function createCommands() {

  /* Add the buttons */
  buttons.push(new Button(3 * buttonWidth, height - 2 * buttonHeight,
    rotateP, "Rotate", buttonWidth, buttonHeight));
  buttons.push(new Button(0, height - buttonHeight,
    moveL, "Left", buttonWidth, buttonHeight));
  buttons.push(new Button(3 * buttonWidth, height - buttonHeight,
    moveR, "Right", buttonWidth, buttonHeight));
  buttons.push(new Button(buttonWidth, height - 2 * buttonHeight,
    place, "Drop", width - 2 * buttonWidth, 2 * buttonHeight));
  buttons.push(new Button(0, height - 2 * buttonHeight,
    down, "Down", buttonWidth, buttonHeight));

  /* Display the buttons */
  for(let i = 0; i < buttons.length; i++) {
    buttons[i].show();
  }
}

/* Make the buttons usable */
function checkButtonPressed(x, y) {
  for(let i = 0; i < buttons.length; i++) {
    /* buttonDelay is the minimal delay between two clicks on a button (ms) */
    let buttonDelay = 100;
    if(buttons[i].wasPressed(x, y) && time - buttons[i].lastUse > buttonDelay) {
      buttons[i].lastUse = time; // Update the last use
      buttons[i].action();
    }
  }
}
