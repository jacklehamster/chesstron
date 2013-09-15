function ddd(n) {
    return !n || n<=0 ? [players.b.getCurrentChoice(this.model)] : players.b.spread(ddd(n-1));
}

function d(n) {
    setComputerPlaying(true);
    var choices = ddd(n);
    return choices;
}