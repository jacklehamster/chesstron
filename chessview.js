var emptyDataURI = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

var view = {
    draggedImage:null
};

var playerID = null;
var hoveredCell = null;
var draggedImage = null;
var selected = null;

function initView() {
    var chessboard = document.getElementById('chessboard');
    chessboard.id = "chessboard";
    
    var computerPlayDiv = chessboard.appendChild(document.createElement("div"));
    computerPlayDiv.id = "computerPlayDiv";
    var checkbox = computerPlayDiv.appendChild(document.createElement("input"));
    checkbox.id = "computerplayercheck";
    checkbox.type ="checkbox";
    checkbox.onclick = checkboxClick;
    computerPlayDiv.appendChild(document.createTextNode(" black played by computer"));
    
    var peerPlayDiv = chessboard.appendChild(document.createElement("div"));
    peerPlayDiv.id = "peerPlayDiv";
    peerPlayDiv.style.display = "none";
    
    chessboard.appendChild(document.createElement("br"));
    
    var table = chessboard.appendChild(document.createElement('table'));
    table.id = "chessboard-table";
    table.style.backgroundColor = "#222222";
    table.style.border = "1px solid black";
    var tbody = table.appendChild(document.createElement('tbody'));
    
    //  header
    var letters = "ABCDEFGH";
    var tr = tbody.appendChild(document.createElement('tr'));
    var td = tr.appendChild(document.createElement('th'));
    for(var col=0;col<8;col++) {
        var th = tr.appendChild(document.createElement('th'));
        th.height = 20;
        th.style.textAlign = "center";
        th.innerHTML = letters.charAt(col).fontcolor("silver");
    }
    var th = tr.appendChild(document.createElement('th'));
    th.width = 20;
    th.height = 20;
    
    //  history blocks
    var history = tr.appendChild(document.createElement('td'));
    history.id = "history";
    history.width = "100px";
    history.style.padding = "20px";
    history.style.backgroundColor = "#EEEEEE";
    history.style.textAlign = "center";
    history.style.verticalAlign = "top";
    history.setAttribute("rowspan",10);
    
    for(var row=0;row<8;row++) {
        var tr = tbody.appendChild(document.createElement('tr'));
        var th = tr.appendChild(document.createElement('th'));
        th.style.textAlign = "center";
        th.style.width = 20;
        th.innerHTML = (row+1).toString().fontcolor("silver");
        for(var col=0;col<8;col++) {
            var td = tr.appendChild(document.createElement('td'));
            td.style.width = "50px";
            td.style.height = "50px";
            td.align = "center";
            td.setAttribute("background",(row+col)%2==0?"img/darkcell.png":"img/lightcell.png");
            var div = td.appendChild(document.createElement("div"));
            div.id = "div"+col+"_"+row;
            var img = div.appendChild(document.createElement("img"));
            img.id = "cell"+col+"_"+row;
            img.src = emptyDataURI;
            img.style.width = "44";
            img.style.height = "44";
            img.position = {x:col,y:row};
            img.onmouseover = cellHover;
            img.onmouseout = cellOut;
            img.onmousedown = cellDown;
            img.draggable = false;
            img.style.border = "3px solid transparent";
        }
        var th = tr.appendChild(document.createElement('th'));
        th.style.width = 20;
        th.style.height = 20;
    }
    
    
    //  footer
    var tr = tbody.appendChild(document.createElement('tr'));
    var th = tr.appendChild(document.createElement('th'));
    for(var col=0;col<8;col++) {
        var th = tr.appendChild(document.createElement('th'));
        th.width = 20;
        th.height = 20;
    }
    var th = tr.appendChild(document.createElement('th'));
    th.width = 20;
    th.height = 20;
    
    chessboard.appendChild(document.createElement("br"));
    
    
    var div = chessboard.appendChild(document.createElement("div"));
    div.id = "divturn";
    
    var button = chessboard.appendChild(document.createElement("button"));
    button.id = "startButton";
    button.innerHTML = "Start game";
    button.style.width = 100;
    button.style.height = 50;
    button.onclick = startGameClick;
}

function setDraggedImageURL(url,x,y) {
    if(url) {
        if(!view.draggedImage) {
            view.draggedImage = document.body.appendChild(document.createElement("img"));
            view.draggedImage.style.position = "absolute";
            view.draggedImage.style.pointerEvents = "none";
            view.draggedImage.draggable = false;
        }
        view.draggedImage.src = url;
        view.draggedImage.style.left = view.draggedImage.style.posLeft = x-25;
        view.draggedImage.style.top = view.draggedImage.style.posTop = y-25;
    }
    else if(view.draggedImage) {
        document.body.removeChild(view.draggedImage);
        view.draggedImage = null;
    }
}

function hoverCell(x,y,hilight) {
    hoveredCell = getViewCell(x,y);
    for(var row=0;row<8;row++) {
        for(var col=0;col<8;col++) {
            var viewCell = getViewCell(col,row);
            viewCell.style.borderColor = hilight && viewCell==hoveredCell ? "#00FF00" : "transparent";
        }
    }
}

function selectCell(x,y) {
    selected = x>=0 && y>=0 ? {x:x,y:y} : null;
    for(var row=0;row<8;row++) {
        for(var col=0;col<8;col++) {
            var div = getDiv(col,row);
            div.css({opacity:x==col&&y==row?.2:1});
        }
    }
}

function startGameClick(e) {
    if(onStartGame) {
        onStartGame();
    }
}

function cellOut() {
    if(onCellOut) {
        onCellOut(this.position.x,this.position.y);
    }
}

function cellHover() {
    if(onCellHover) {
        onCellHover(this.position.x,this.position.y);
    }
}

function cellDown() {
    if(onCellDown) {
        onCellDown(this.position.x,this.position.y);
    }
}

function checkboxClick() {
    if(onCheckComputerPlayer) {
        onCheckComputerPlayer(isComputerPlaying());
    }
}

function getDiv(col,row) {
    return $("#div"+col+"_"+row);
}

function getViewCell(col,row) {
    return $("#cell"+col+"_"+row)[0];
}

function updateView(model) {
    for(var row=0;row<8;row++) {
        for(var col=0;col<8;col++) {
            var piece = model.getCell(col,row);
            var pieceURL = getCachedImageURL(piece);
            var viewCell = getViewCell(col,row);
            viewCell.src = pieceURL;
        }
    }
    document.getElementById("divturn").innerHTML =
        model.checkMate() ? (model.turn=="w" ? "check mate. white lost" : "check mate. black lost") :
        model.inCheck() ? (model.turn=="w" ? "check! white's turn" : "check! black's turn") :
        model.turn=="w" ? "white's turn" :
        model.turn=="b" ? "black's turn" : "";
    document.getElementById("startButton").style.display = model.turn ? "none" : "";
    var history = document.getElementById("history");
    history.innerHTML = "";
    if(model.history.length) {
        var undoButton = (history.appendChild(document.createElement("div"))).appendChild(document.createElement('button'));
        undoButton.appendChild(document.createTextNode("undo"));
        undoButton.onclick = function() {
            if(onUndo) {
                onUndo();
            }
        };
    }
    for(var i=0;i<model.history.length;i++) {
        var move = model.history[i];
        var div = history.appendChild(document.createElement("div"));
        div.innerHTML = displayMove(move,i%2==0?"#999999":"black");
    }
    if(model.turn && !playerID) {
        playerID = model.players[model.turn];
    }
}

function isComputerPlaying() {
    return document.getElementById("computerplayercheck").checked;
}

function setPeerPlaying(server,room) {
    computerPlayDiv.style.display = "none";
    var js = document.createElement("script");
    js.type = "text/javascript";
    js.src = server + "?action=enter&javascript=1&room=" + room;
    document.head.appendChild(js);
    
    var peerPlayDiv = document.getElementById("peerPlayDiv");
    peerPlayDiv.style.display = "";
    peerPlayDiv.innerHTML = "Joining room <b>"+room+"</b> on "+server;
}

function isPeerPlaying() {
    var peerPlayDiv = document.getElementById("peerPlayDiv");
    return peerPlayDiv.style.display=="";
}

function updateServerMessage(message) {
    var peerPlayDiv = document.getElementById("peerPlayDiv");
    peerPlayDiv.innerHTML = message;
}

function setComputerPlaying(value) {
    document.getElementById("computerplayercheck").checked = value;
    checkboxClick();
}

function displayMove(move,color) {
    var letters = "ABCDEFGH";
    var moveStr = (letters.charAt(move[0].x)+(move[0].y+1)) + "-" +
        (letters.charAt(move[1].x)+(move[1].y+1));
    
    return moveStr.fontcolor(color);
}

function hilight(moves,target,red) {
    var moveHash = {};
    if(moves) {
        for(var i=0;i<moves.length;i++) {
            moveHash[moves[i].x+"_"+moves[i].y] = true;
        }
    }
    var targetCell = target ? getViewCell(target.x,target.y) : null;
    for(var row=0;row<8;row++) {
        for(var col=0;col<8;col++) {
            var viewCell = getViewCell(col,row);
            var hilightCell = moveHash[col+"_"+row];
            viewCell.style.borderColor = 
                hilightCell && targetCell==viewCell ? (red ? "#FF0000":"#FFFF00") :
                hilightCell ? "#FFBB00" : "transparent";
        }
    }
}

function onCosmo(update) {
    console.log(">>",update);
}

var cachedImages = {};

function getCachedImageURL(piece) {
    if(!cachedImages[piece]) {
        cachedImages[piece] = new Image();
        cachedImages[piece].src = getImageURL(piece);
    }
    return cachedImages[piece].src;
}

function getImageURL(piece) {
    switch(piece) {
        case "br": return "img/black-rook.svg"; break;
        case "bh": return "img/black-knight.svg"; break;
        case "bb": return "img/black-bishop.svg"; break;
        case "bq": return "img/black-queen.svg"; break;
        case "bk": return "img/black-king.svg"; break;
        case "bp": return "img/black-pawn.svg"; break;
        case "wr": return "img/white-rook.svg"; break;
        case "wh": return "img/white-knight.svg"; break;
        case "wb": return "img/white-bishop.svg"; break;
        case "wq": return "img/white-queen.svg"; break;
        case "wk": return "img/white-king.svg"; break;
        case "wp": return "img/white-pawn.svg"; break;
        default: return emptyDataURI;
    }
}
