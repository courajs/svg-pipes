// =====
// Rendering
// =====
class Game {
  board;    // Game state
  el;       // root DOM element
  cell_els; // 2d array of g elements corresponding to board cells

  constructor(board, root_el, after) {
    this.board = board;
    this.el = root_el;
    this.after = after;
  }

  on_mousedown(cell, el, event) {
    event.preventDefault();
    if (event.button === 2) {
      cell.cw();
    } else if (event.button === 0) {
      cell.ccw();
    }
    this.fix_arms();
    this.flow();
    // Without the *double* rAF, the victory alert can pop
    // before the final flow renders, meaning the maze
    // behind the popup isn't fully solved. Takes away
    // a little bit of the satisfaction...
    // Not sure why a single rAF doesn't work :(
    requestAnimationFrame(() => {
      requestAnimationFrame(this.check_victory.bind(this));
    });
  }

  check_victory() {
    if (this.endgame) { return; }
    if (this.board.filled().size === this.board.cells.length) {
      this.endgame = true;
      if (window.confirm('you win :)')) {
        this.after();
      }
    }
  }

  flow() {
    var filled = this.board.filled();
    for (let c of this.board.cells) {
      this.cell_els[c.row][c.col].classList.toggle('filled', filled.has(c));
    }
  }
  fix_arms() {
    for (let c of this.board.cells) {
      let el = this.cell_els[c.row][c.col];
      el.querySelector('g.arms').innerHTML = arms_for(c);
    }
  }
  shuffle() {
    for (let c of this.board.cells) {
      let twists = Math.floor(4 * Math.random());
      while (twists>0) {
        c.cw();
        twists--;
      }
    }
    this.fix_arms();
    this.flow();
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
        let cell = document.createElementNS("http://www.w3.org/2000/svg", "g");
        cell.setAttribute("class", "cell");
        cell.innerHTML = [
          '<rect class="cell-background" x="0" y="0" width="1" height="1"/>',
          '<line class="center" x1="0.5" y1="0.5" x2="0.5" y2="0.5"/>',
          '<g class="arms"></g>',
        ].join('');
        cell.querySelector('g.arms').innerHTML = arms_for(this.board.rows[row][col]);
        cell.setAttribute('transform', `
            scale(${scale_factor})
            translate(${col}, ${row})
        `);
        r[col] = cell;
        svg.appendChild(cell);
        cell.addEventListener('touchstart', this.on_mousedown.bind(this, this.board.rows[row][col], cell));
        cell.addEventListener('mousedown', this.on_mousedown.bind(this, this.board.rows[row][col], cell));
        cell.addEventListener('contextmenu', (e) => e.preventDefault());
      }
    }

    this.el.appendChild(svg);

    this.shuffle();
  }
}

function arms_for(cell) {
  let arms = [];
  if (cell.up) {
    arms.push('<line class="arm" x1="0.5" x2="0.5" y1="0" y2="0.5"/>');
  }
  if (cell.down) {
    arms.push('<line class="arm" x1="0.5" x2="0.5" y1="1" y2="0.5"/>');
  }
  if (cell.right) {
    arms.push('<line class="arm" x1="0.5" x2="1" y1="0.5" y2="0.5"/>');
  }
  if (cell.left) {
    arms.push('<line class="arm" x1="0.5" x2="0" y1="0.5" y2="0.5"/>');
  }
  return arms.join('');
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

  get cells() {
    return this.rows.flat();
  }
  get center() {
    return this.rows[Math.ceil(this.height/2)-1][Math.ceil(this.width/2)-1];
  }

  filled() {
    let empty = new Set(this.cells);
    let flowing = new Set();
    let filled = new Set();
    shuttle([this.center], empty, flowing);

    while (flowing.size) {
      let c = pluck(flowing);
      shuttle(this.flow_neighbors(c), empty, flowing);
      filled.add(c);
    }
    return filled;
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

  flow_neighbors(cell) {
    var result = new Set();
    var {row, col} = cell;
    if (row > 0) {
      let n = this.rows[row-1][col];
      if (cell.up && n.down) {
        result.add(n);
      }
    }
    if (row < (this.height-1)) {
      let n = this.rows[row+1][col];
      if (cell.down && n.up) {
        result.add(n);
      }
    }
    if (col > 0) {
      let n = this.rows[row][col-1];
      if (cell.left && n.right) {
        result.add(n);
      }
    }
    if (col < (this.width-1)) {
      let n = this.rows[row][col+1];
      if (cell.right && n.left) {
        result.add(n);
      }
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
let game_size = window.localStorage.game_size || 7;
let game_size_el = document.querySelector('#controls #game-size');
game_size_el.innerHTML = game_size;

let root_el = document.querySelector('#game');
let board = new Board(game_size, game_size);
plumb_board(board);
let game = new Game(board, root_el, reset);
game.init();
document.querySelector('#controls #smaller-game').addEventListener('click', smaller);
document.querySelector('#controls #larger-game').addEventListener('click', larger);
document.querySelector('#controls #new-game').addEventListener('click', reset);

function reset() {
  root_el.innerHTML = '';
  board = new Board(game_size, game_size);
  plumb_board(board);
  game = new Game(board, root_el, reset);
  game.init();
}
function smaller() {
  if (game_size > 3) {
    game_size--;
    game_size_el.innerHTML = game_size;
    window.localStorage.game_size = game_size;
    reset();
  }
}
function larger() {
  game_size++;
  game_size_el.innerHTML = game_size;
  window.localStorage.game_size = game_size;
  reset();
}
