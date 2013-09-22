var whitePawnLine = 6;
var blackPawnLine = 1;

var initialBoard = [
                    ["br","bh","bb","bq","bk","bb","bh","br"],
                    ["bp","bp","bp","bp","bp","bp","bp","bp"],
                    ["  ","  ","  ","  ","  ","  ","  ","  "],
                    ["  ","  ","  ","  ","  ","  ","  ","  "],
                    ["  ","  ","  ","  ","  ","  ","  ","  "],
                    ["  ","  ","  ","  ","  ","  ","  ","  "],
                    ["wp","wp","wp","wp","wp","wp","wp","wp"],
                    ["wr","wh","wb","wq","wk","wb","wh","wr"]
                    ];

//  **************************************
//  ChessBoard
//
function ChessBoard(model) {
    this.origin = model;
    
    this.wCastlingRight = model?model.wCastlingRight : true;
    this.wCastlingLeft = model?model.wCastlingLeft : true;
    this.bCastlingRight = model?model.bCastlingRight : true;
    this.bCastlingLeft = model?model.bCastlingLeft : true;
    
    this.history = model ? model.history.concat([]) : [];
    this.turn = model ? model.turn : null;
    this.board = model ? model.board : this.initBoard();
    this.players = model ? model.players : {"w":""+Math.random(),"b":""+Math.random()};
}

var colsName = "ABCDEFGH";
var rowsName = "12345678";


function Cell(x,y) {
    this.x = x;
    this.y = y;
}
Cell.prototype = {
    toString : function() {
        return colsName.charAt(this.x)+rowsName.charAt(this.y);
    }
};

function getCellId(cell) {
    return colsName.charAt(cell.x)+rowsName.charAt(cell.y);
}

function getMoveId(move) {
    return getCellId(move[0])+"-"+getCellId(move[1]);
}


ChessBoard.prototype = {
    //  initBoard
    initBoard : function () {
        var array = [];
        for(var row=0;row<8;row++) {
            array.push(initialBoard[row].join(""));
        }
        return array.join("\n");
    },
    //  gameStarted
    gameStarted : function() {
        return this.turn;
    },
    //  getSide
    getSide : function (col,row) {
        return this.isOut(col,row) ? " " : this.getCell(col,row).charAt(0);
    },
    //  getCell
    getCell : function(col,row) {
        return this.board.substr(row*(8*2+1)+col*2,2)
    },
    //  getCell
    setCell : function(col,row,value) {
        var array = this.board.split("");
        array.splice(row*(8*2+1)+col*2,2,value);
        this.board = array.join("");
    },
    //  isBorderLine
    isBorderline : function(col,row) {
        return col==0 || col==7 || row==0 || row==7;
    },
    //  isOut
    isOut : function(col,row) {
        return col<0 || col>7 || row<0 || row>7;
    },
    //  startGame
    startGame : function() {
        this.turn = "w";
    },
    //  canMove
    canMove : function(col,row) {
        return this.getMoves(col,row,false,true).length;
    },
    //  getMoves
    getMoves : function(col,row,fromAndTo,careful) {
        var cell = this.getCell(col,row);
        var moves = [];
        var myTurn = this.turn;
        if(cell.charAt(0)==myTurn) {
            moves = this.calculateCellMoves(cell,col,row,careful);
            
            if(fromAndTo) {
                var finalMoves = [];
                var hereCell = new Cell(col,row);
                for(var i=0;i<moves.length;i++) {
                    finalMoves.push(fromAndTo ? [hereCell,moves[i]] : moves[i]);
                }
                moves = finalMoves;
            }
        }
        return moves;
    },
    //  isOpponent
    isOpponent : function(col,row) {
        return this.getSide(col,row)==this.oppositeSide(this.turn);
    },
    //  move
    move : function(from,to,force,keepHistory) {
        var pieceTaken = null;
        if(force || this.isValid(from,to)) {
            pieceTaken = this.getCell(to.x,to.y);
            var pieceMoved = this.getCell(from.x,from.y);
            if(pieceMoved=="wp" && to.y==0) {
                pieceMoved = "wq";
            }
            else if(pieceMoved=="bp" && to.y==7) {
                pieceMoved = "bq";
            }
            var castling = false;
            if(pieceMoved.charAt(1)=="k") {
                if(to.x-from.x==2) {
                    castling = true;
                    var rook = this.getCell(to.x+1,to.y);
                    this.setCell(to.x-1,to.y,rook);
                    this.setCell(to.x+1,to.y,"  ");
                }
                else if(to.x-from.x==-2) {
                    castling = true;
                    var rook = this.getCell(to.x-2,to.y);
                    this.setCell(to.x+1,to.y,rook);
                    this.setCell(to.x-2,to.y,"  ");
                }
            }
            
            this.setCell(to.x,to.y,pieceMoved);
            this.setCell(from.x,from.y,"  ");
            
            if(this.wCastlingRight || this.wCastlingLeft) {
                if(pieceMoved=="wk") {
                    this.wCastlingRight = this.wCastlingLeft = false;
                }
                else if(pieceMoved=="bk") {
                    this.bCastlingRight = this.bCastlingLeft = false;
                }
                else if(pieceMoved=="wr" || pieceTaken=="wr") {
                    if(from.x==0 || to.x==0)
                        this.wCastlingLeft = false;
                    else if(from.x==7 || to.x==7)
                        this.wCastlingRight = false;
                }
                else if(pieceMoved=="br" || pieceTaken=="br") {
                    if(from.x==0 || to.x==0)
                        this.bCastlingLeft = false;
                    else if(from.x==7 || to.x==7)
                        this.bCastlingRight = false;
                }
            }
            
            this.switchTurn();
            if(history)
                this.history.push([from,to]);
            
            if(this.hasKing() && this.inCheck()) {
                if(this.turn=="w") {
                    this.wCastlingRight = this.wCastlingLeft = false;
                }
                else if(this.turn=="b") {
                    this.bCastlingRight = this.bCastlingLeft = false;
                }
            }
        }
        return pieceTaken;
    },
    //  switchTurn
    switchTurn : function() {
        this.turn = this.oppositeSide(this.turn);
    },
    //  isValid
    isValid : function(from,to) {
        var moves = this.getMoves(from.x,from.y,false,true);
        for(var i=0;i<moves.length;i++) {
            if(moves[i].x==to.x && moves[i].y==to.y) {
                return true;
            }
        }
        return false;
    },
    //  oppositeSide
    oppositeSide : function(side) {
        return side=="w" ? "b" : side== "b" ? "w" : " ";
    },
    //  calculateCellMoves
    calculateCellMoves : function (cell,col,row,careful) {
        var moves = [];
        var side = cell.charAt(0);
        switch(cell.charAt(1)) {
            case "r":
                moves = this.calculateRookMove(side,col,row);
                break;
            case "h":
                moves = this.calculateHorseMove(side,col,row);
                break;
            case "b":
                moves = this.calculateBishopMove(side,col,row);
                break;
            case "q":
                moves = this.calculateQueenMove(side,col,row);
                break;
            case "k":
                moves = this.calculateKingMove(side,col,row);
                break;
            case "p":
                moves = this.calculatePawnMove(side,col,row);
                break;
        }
        
        if(!careful) {
            return moves;
        }
        var finalMoves = [];
        for(var i=0;i<moves.length;i++) {
            var move = moves[i];
            var board = new ChessBoard(this);
            board.move(new Cell(col,row),move,true,false);
            if(!board.kingTargeted(side)) {
                finalMoves.push(move);
            }
        }
        return finalMoves;
    },
    //  calculateMovers
    calculateMovers : function (side,x,y,moveList,max) {
        var moves = [];
        for(var m=0;m<moveList.length;m++) {
            var move = moveList[m];
            for(var i=1; (!max || i<max)
                && !this.isOut(x+move.x*i,y+move.y*i)
                && !this.isOut(x+move.x*(i+1),y+move.y*(i+1))
                && this.getSide(x+move.x*i,y+move.y*i)==" "; i++) {
                moves.push({x:x+move.x*i,y:y+move.y*i});
            }
            if(!this.isOut(x+move.x*i,y+move.y*i)
               && this.getSide(x+move.x*i,y+move.y*i)!=side) {
                moves.push({x:x+move.x*i,y:y+move.y*i});
            }
        }
        return moves;
    },
    //  calculateHorseMove
    calculateHorseMove : function (side,x,y) {
        var moveList = [
                        {x:-1,y:-2},
                        {x: 1,y:-2},
                        {x:-2,y:-1},
                        {x: 2,y:-1},
                        {x:-2,y: 1},
                        {x: 2,y: 1},
                        {x:-1,y: 2},
                        {x: 1,y: 2}
                        ];
        var moves = [];
        for(var i=0;i<moveList.length;i++) {
            var move = moveList[i];
            if(!this.isOut(x+move.x,y+move.y)) {
                var pieceSide = this.getCell(x+move.x,y+move.y).charAt(0);
                if(side!=pieceSide)
                    moves.push(new Cell(x+move.x,y+move.y));
            }
        }
        return moves;
    },    
    //  calculateBishopMove
    calculateBishopMove : function (side,x,y) {
        var moveList = [
                        {x:-1,y:-1},
                        {x: 1,y:-1},
                        {x:-1,y: 1},
                        {x: 1,y: 1}
                        ];
        return this.calculateMovers(side,x,y,moveList);
    },    
    //  calculateQueenMove
    calculateQueenMove : function (side,x,y) {
        var moveList = [
                        {x:-1,y:-1},
                        {x: 0,y:-1},
                        {x: 1,y:-1},
                        {x:-1,y: 0},
                        {x: 1,y: 0},
                        {x:-1,y: 1},
                        {x: 0,y: 1},
                        {x: 1,y: 1}
                        ];
        return this.calculateMovers(side,x,y,moveList);
    },
    //  calculateKingMove
    calculateKingMove : function (side,x,y) {
        var moveList = [
                        {x:-1,y:-1},
                        {x: 0,y:-1},
                        {x: 1,y:-1},
                        {x:-1,y: 0},
                        {x: 1,y: 0},
                        {x:-1,y: 1},
                        {x: 0,y: 1},
                        {x: 1,y: 1}
                        ];
        var moves = this.calculateMovers(side,x,y,moveList,1);
        if(side=='w') {
            if(this.wCastlingLeft && this.getCell(x-1,y)=="  "
               && this.getCell(x-2,y)=="  "
               && this.getCell(x-3,y)=="  ") {
                moves.push(new Cell(x-2,y));
            }
            if(this.wCastlingRight && this.getCell(x+1,y)=="  "
               && this.getCell(x+2,y)=="  ") {
                moves.push(new Cell(x+2,y));
            }
        }
        else if(side=='b') {
            if(this.bCastlingLeft && this.getCell(x-1,y)=="  "
               && this.getCell(x-2,y)=="  "
               && this.getCell(x-2,y)=="  ") {
                moves.push(new Cell(x-2,y));
            }
            if(this.bCastlingRight && this.getCell(x+1,y)=="  "
               && this.getCell(x+2,y)=="  ") {
                moves.push(new Cell(x+2,y));
            }
        }
        return moves;
    },
    //  calculatePawnMove
    calculatePawnMove : function (side,x,y) {
        var moves = [];
        if(side=="w") {
            if(y>0) {
                if(this.getCell(x,y-1)=="  ") {
                    moves.push(new Cell(x,y-1));
                    if(y==whitePawnLine && this.getCell(x,y-2)=="  ") {
                        moves.push(new Cell(x,y-2));
                    }
                }
                var foeSide = this.oppositeSide(side);
                if(this.getSide(x-1,y-1)==foeSide) {
                    moves.push(new Cell(x-1,y-1));
                }
                if(this.getSide(x+1,y-1)==foeSide) {
                    moves.push(new Cell(x+1,y-1));
                }
            }
        }
        else if(side=="b") {
            if(y<7) {
                if(this.getCell(x,y+1)=="  ") {
                    moves.push(new Cell(x,y+1));
                    if(y==blackPawnLine && this.getCell(x,y+2)=="  ") {
                        moves.push(new Cell(x,y+2));
                    }
                }
                var foeSide = this.oppositeSide(side);
                if(this.getSide(x-1,y+1)==foeSide) {
                    moves.push(new Cell(x-1,y+1));
                }
                if(this.getSide(x+1,y+1)==foeSide) {
                    moves.push(new Cell(x+1,y+1));
                }
            }
        }
        return moves;
    },    
    //  calculateRookMove
    calculateRookMove : function (side,x,y) {
        var moveList = [
                        {x: 0,y:-1},
                        {x:-1,y: 0},
                        {x: 1,y: 0},
                        {x: 0,y: 1}
                        ];
        return this.calculateMovers(side,x,y,moveList);
    },
    //  getPieces
    getPieces : function (side) {
        var pieces = [];
        for(var y=0;y<8;y++) {
            for(var x=0;x<8;x++) {
                if(this.getSide(x,y)==side) {
                    pieces.push(new Cell(x,y));
                }
            }
        }
        return pieces;
    },
    //  findPiece
    findPiece : function (piece) {
        for(var y=0;y<8;y++) {
            for(var x=0;x<8;x++) {
                if(this.getCell(x,y)==piece) {
                    return new Cell(x,y);
                }
            }
        }
        return null;
    },
    //  getTotalCellCoverage
    getTotalCellCoverage : function (side,careful) {
        var moves = [];
        var pieces = this.getPieces(side);
        for(var i=0;i<pieces.length;i++) {
            var piece = pieces[i];            
            var cell = this.getCell(piece.x,piece.y);
            moves = moves.concat(this.calculateCellMoves(cell,piece.x,piece.y,careful));
        }
        return moves;
    },
    //  getTotalMoves
    getTotalMoves : function (side,fromAndTo) {
        var totalMoves = [];
        var pieces = this.getPieces(side);
        for(var i=0;i<pieces.length;i++) {
            var piece = pieces[i];
            var cell = this.getCell(piece.x,piece.y);
            var moves = this.calculateCellMoves(cell,piece.x,piece.y,false);
            if(!fromAndTo) {
                totalMoves = totalMoves.concat(moves);
            }
            else {
                for(var j=0;j<moves.length;j++) {
                    totalMoves.push([cell,moves[j]]);
                }
            }
        }
        return totalMoves;
    },
    //  getTotalValidMoves
    getTotalValidMoves : function (side,fromAndTo) {
        var moves = [];
        var pieces = this.getPieces(side);
        for(var i=0;i<pieces.length;i++) {
            moves = moves.concat(this.getMoves(pieces[i].x,pieces[i].y,fromAndTo,true));
        }
        return moves;
    },
    //  getAllMoves
    getAllMoves : function() {
        return this.getTotalMoves(this.turn,true);
    },
    //  getPossibleMoves
    getPossibleMoves : function() {
        return this.getTotalValidMoves(this.turn,true);
    },
    //  kingTargeted
    kingTargeted : function (side) {
        var king = this.findPiece(side+"k");
        var totalOpponentMoves = this.getTotalCellCoverage(this.oppositeSide(side),false);
        for(var i=0;i<totalOpponentMoves.length;i++) {
            if(king.x==totalOpponentMoves[i].x && king.y==totalOpponentMoves[i].y) {
                return true;
            }
        }
        return false;
    },
    //  checkMate
    checkMate : function () {
        return this.inCheck() && !this.getPossibleMoves().length;
    },
    //  inCheck
    inCheck : function() {
        return this.turn && this.kingTargeted(this.turn);
    },
    //  hasKing
    hasKing : function() {
        var king = this.findPiece(this.turn+"k");
        return king!=null;
    }    
};

