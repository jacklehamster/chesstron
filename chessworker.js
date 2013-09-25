importScripts("chessmodel.js","chessplayer.js","chessutil.js");

onmessage = function (oEvent) {
    var model = new ChessBoard(oEvent.data.model);
    var player = new (eval(oEvent.data.worker))();
    player.decide = eval("("+oEvent.data.decide+")");
    postMessage("TET123");
    player.decide(model,postMessage);
};