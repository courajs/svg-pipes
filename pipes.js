class Cell {
  up = false;
  right = false;
  down = false;
  left = false;

  cw() {
    let temp = this.up;
    this.up = this.left;
    this.left = this.down;
    this.down = this.right;
    this.right = temp;
  }
  ccw() {
    let temp = this.up;
    this.up = this.right;
    this.right = this.down;
    this.down = this.left;
    this.left = temp;
  }
}

class Board {
  width = 0;
  height = 0;
  rows = [];

  constructor(width, height) {
    this.width = width;
    this.height = height;
    for (let row=0; row<height; row++) {
      var row = [];
      for (let col=0; col<width; col++) {
        row.push(new Cell());
      }
      this.rows.push(row);
    }
  }
}

function plumb_board(board) {
  var 
}
