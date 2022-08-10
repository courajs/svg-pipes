// =====
// Rendering
// =====
class Game {
  board;    // Game state
  el;       // root DOM element
  cell_els; // 2d array of g elements corresponding to board cells

  constructor(board, root_el) {
    this.board = board;
    this.el = root_el;
  }

  init() {
    let scale_factor = 1 / this.board.width;

    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute('class', 'game');
    svg.setAttribute('viewBox', '0 0 1 1');
    this.cell_els = new Array(this.board.height);
    for (let row=0; row<this.board.height; row++) {
      let r = new Array(this.board.width);
      this.cell_els[row] = r;
      for (let col=0; col<this.board.width; col++) {
        let g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("class", "cell");
        let kids = [
          '<rect class="cell-background" x="0" y="0" width="1" height="1" fill="coral"/>',
          '<line class="center" x1="0.5" y1="0.5" x2="0.5" y2="0.5"/>',
        ];
        if (this.board.rows[row][col].up) {
          kids.push('<line class="arm" x1="0.5" x2="0.5" y1="0" y2="0.5"/>');
        }
        if (this.board.rows[row][col].down) {
          kids.push('<line class="arm" x1="0.5" x2="0.5" y1="1" y2="0.5"/>');
        }
        if (this.board.rows[row][col].right) {
          kids.push('<line class="arm" x1="0.5" x2="1" y1="0.5" y2="0.5"/>');
        }
        if (this.board.rows[row][col].left) {
          kids.push('<line class="arm" x1="0.5" x2="0" y1="0.5" y2="0.5"/>');
        }
        g.innerHTML = kids.join('');
        g.setAttribute('transform', `
            scale(${scale_factor})
            translate(${col}, ${row})
        `);
        r[col] = g;
        svg.appendChild(g);
      }
    }

    this.el.appendChild(svg);
  }
}


// =====
// Game logic
// =====
class Board {
  width = 0;
  height = 0;
  rows = [];

  constructor(width, height) {
    this.width = width;
    this.height = height;
    for (let row=0; row<height; row++) {
      var r = new Array(width);
      for (let col=0; col<width; col++) {
        r[col] = new Cell(row, col);
      }
      this.rows.push(r);
    }
  }

  neighbors(cell) {
    var result = new Set();
    var {row, col} = cell;
    if (row > 0) {
      result.add(this.rows[row-1][col]);
    }
    if (row < (this.height-1)) {
      result.add(this.rows[row+1][col]);
    }
    if (col > 0) {
      result.add(this.rows[row][col-1]);
    }
    if (col < (this.width-1)) {
      result.add(this.rows[row][col+1]);
    }
    return result;
  }
}

class Cell {
  up = false;
  right = false;
  down = false;
  left = false;
  row;
  col;

  constructor(row, col) {
    this.row = row;
    this.col = col;
  }

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

  bond(other) {
    if ((this.row - other.row) === 1) {
      this.up = true;
      other.down = true;
    } else if ((this.row - other.row) === -1) {
      this.down = true;
      other.up = true;
    } else if ((this.col - other.col) === 1) {
      this.left = true;
      other.right = true;
    } else if ((this.col - other.col) === -1) {
      this.right = true;
      other.left = true;
    }
  }
}

function plumb_board(board) {
  let pristine = new Set();
  let frontier = new Set();
  let plumbed = new Set();
  for (let row of board.rows) {
    for (let cell of row) {
      pristine.add(cell);
    }
  }
  let center = {
    row: Math.ceil(board.height/2)-1,
    col: Math.ceil(board.width/2)-1,
  };
  let center_cell = board.rows[center.row][center.col];
  shuttle([center_cell], pristine, plumbed);
  shuttle(board.neighbors(center_cell), pristine, frontier);

  while (frontier.size) {
    var target = pluck(frontier);
    var sponsor = random(intersection(board.neighbors(target), plumbed));
    sponsor.bond(target);
    plumbed.add(target);
    shuttle(board.neighbors(target), pristine, frontier);
  }
}




// ====
// Set functions
// ===

// Move items between sets, only if they're actually
// in the source set
function shuttle(transfers, from, to) {
  for (let v of transfers) {
    if (from.delete(v)) {
      to.add(v);
    }
  }
}
function intersection(s1, s2) {
  return new Set([...s1].filter(v=> s2.has(v)));
}
function difference(s1, s2) {
  return new Set([...s1].filter(v=> !s2.has(v)));
}
function random(s) {
  var idx = Math.floor(Math.random()*s.size);
  var iter = s.values();
  while (idx>0) {
    iter.next();
    idx--;
  }
  return iter.next().value;
}
function pluck(s) {
  var item = random(s);
  s.delete(item);
  return item;
}


// =====
// Main
// =====
var b = new Board(5, 5);
plumb_board(b);

var el = document.querySelector('#game');
var game = new Game(b, el);
game.init();
console.log(game);


