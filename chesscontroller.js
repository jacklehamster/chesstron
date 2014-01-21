/*
 
 Copyright (C) 2013 Vincent Le Quang
 
 This program is free software; you can redistribute it and/or modify it under the terms of the
 GNU General Public License as published by the Free Software Foundation;
 either version 2 of the License, or (at your option) any later version.
 
 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 See the GNU General Public License for more details.
 
 You should have received a copy of the GNU General Public License along with this program;
 if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA
 
 Contact : vincentlequang@gmail.com
 
 */

alert('here');


var model = new ChessBoard();

var mousePosition = {};

var players = {w:new HumanPlayer(),b:new HumanPlayer()};

function init(e) {
    var params = getSearchParameters();
    
    initView();
    if(params.server && params.room) {
        setPeerPlaying(params.server,params.room);
       var link = document.body.insertBefore(document.createElement("a"),document.body.firstChild);
       link.href = "?";
       link.innerHTML = "Play locally";
    }
    else {
       setComputerPlaying(true);
       var link = document.body.insertBefore(document.createElement("a"),document.body.firstChild);
       link.href = 'javascript:joinRoom(prompt("Join a room:","paris"))';
       link.innerHTML = "Play against a human online";

    }
    updateView(model);
    hoverCell(-1,-1);
}

function joinRoom(room) {
    window.location = '?server=http://vincent.netau.net/cosmo.php&room='+room;
}

function canPlay() {
    return players[model.turn].localHuman && (!isPeerPlaying() || model.players[model.turn]==playerID);
}

function onCellHover(x,y) {
    if(model.gameStarted()) {
       hoverCell(x,y,canPlay() && !selected && model.canMove(x,y));
       if(selected) {
           var moves = model.getMoves(selected.x,selected.y,false,true);
           hilight(moves,{x:x,y:y},model.isOpponent(x,y));
       }
    }
}

function onCellOut(x,y) {
    hoverCell(-1,-1,false);
    if(selected) {
        var moves = model.getMoves(selected.x,selected.y,false,true);
        hilight(moves,null,false);
    }
}

function onCellDown(x,y) {
    if(model.gameStarted()) {
       if(canPlay()) {
           if(model.canMove(x,y)) {
               selectCell(x,y);
               var viewCell = getViewCell(selected.x,selected.y);
               setDraggedImageURL(viewCell.src,selected.x,selected.y);
               var moves = model.getMoves(x,y,false,true);
               hilight(moves,null,false);
           }
       }
    }
}

function onStartGame() {
    model.startGame();
    players = {
        w:new HumanPlayer(),
        b:isComputerPlaying() ? new ThinkingPlayer() : new HumanPlayer()
    };
    nextTurn();
    updateView(model);
}

function onCheckComputerPlayer() {
    players.b = isComputerPlaying() ? new ThinkingPlayer() : new HumanPlayer();
    updateView(model);
    nextTurn();
}

window.onload = init;
document.onselectstart = function () { return false; }
document.onmousemove = function(e) {
    mousePosition.x = e.pageX;
    mousePosition.y = e.pageY;
};
document.onmouseup = function(e) {
    if(model.gameStarted() && selected) {
        var viewCell = hoveredCell;
        if(viewCell) {
            var newModel = new ChessBoard(model);
            if(newModel.move(selected,viewCell.position,false)) {
                model = newModel;
                if(isPeerPlaying()) {
                    spot.setProperty("model",model);
                }
            }
        }
        updateView(model);
        hilight(null,null,false);
        if(viewCell && canPlay()) {
            hoverCell(viewCell.position.x,viewCell.position.y,true);
        }
        selectCell(-1,-1);
        nextTurn();
    }
}

function nextTurn() {
    if(model.gameStarted()) {
        var moves = model.getTotalValidMoves(model.turn,true);
        var player = players[model.turn];
        var opponent = players[model.oppositeSide(model.turn)];
        opponent.opponentTurn(model);
        if(player.useWorker) {
            player.workerDecide(model,onPlayed);
        }
        else {
            player.decide(model,onPlayed);
        }
    }
}

function onUndo() {
    do {
        model = model.origin;
    } while(!players[model.turn].localHuman && model.origin);
    updateView(model);
}

function onPlayed(move) {
    if(move) {
        var newModel = new ChessBoard(model);
        if(newModel.move(move[0],move[1],false,true)) {
            model = newModel;
            if(hoveredCell) {
                hoverCell(hoveredCell.position.x,hoveredCell.position.y,
                          canPlay() && !selected && model.canMove(hoveredCell.position.x,
                                                                  hoveredCell.position.y));
            }
        }
    }
    updateView(model);
}

function refresh() {
    if(selected) {
        var viewCell = getViewCell(selected.x,selected.y);
        setDraggedImageURL(viewCell.src, mousePosition.x,mousePosition.y);
    }
    else if(view.draggedImage) {
        setDraggedImageURL(null,-1,-1);
    }
}

function onCosmo(update) {
    if(update[0]=="model") {
         model.board = update[1].board;
         model.history = update[1].history;
         model.turn = update[1].turn;
         updateView(model);
    }
    updateServerMessage(new Date());
}

$(document).on("dragstart", function(e) {
        if (e.target.nodeName.toUpperCase() == "IMG") {
            return false;
        }
    });

setInterval(refresh,10);
