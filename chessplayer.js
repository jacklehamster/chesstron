var choiceLimit = 1000;
var pieceValues = {
    k:100000,
    q:10,
    r:5,
    b:3,
    h:3,
    p:1
};

console.log("choiceLimit:",choiceLimit);
console.log("pieceValues:",JSON.stringify(pieceValues,null,'\t'));


function Player() {
}

Player.prototype = {
    localHuman : false,
    decide : function(model,callback) {
    }
};


//  RandomPlayer : Player

function RandomPlayer() {
}
RandomPlayer.prototype = new Player();
RandomPlayer.prototype.decide = function(model,callback) {
    var moves = model.getPossibleMoves();
    if(moves.length) {
        var moveIndex = Math.floor(random()*moves.length);
        callback(moves[moveIndex]);
    }
    else {
        callback(null);
    }
};

//  ThinkingPlayer : Player

function Choice(parent,player,model,move) {
    this.parent = parent;
    this.player = player;
    this.move = move;
    this.model = model;
    this.children = null;
    this.level = parent ? parent.level+1 : 0;
    this.value = player.evaluate(this.model);
    this.history = (this.parent ? this.parent.history: []).concat(this.move ?[getMoveId(this.move)]:[]);
}

Choice.prototype = {
    getTurn : function() {
        return this.model.turn;
    },
    spread : function() {
        var choices = [];
        if(this.model.hasKing()) {
            var moves = this.model.getPossibleMoves();
            for(var i=0;i<moves.length;i++) {
                var model = new ChessBoard(this.model);
                model.move(moves[i][0],moves[i][1],true,false);
                var choice = new Choice(this,this.player,model,moves[i]);
                choices.push(choice);
            }
            this.children = choices;
        }
        return choices;
    },
    clearEvaluation : function() {
        delete this.evaluation;
        if(this.children) {
            for(var i=0;i<this.children.length;i++) {
                this.children[i].clearEvaluation();
            }
        }
    },
    getRoot : function() {
        return this.isRoot() ? this : this.parent.getRoot();
    },
    isRoot : function() {
        return !this.parent;
    },
    evaluate : function() {
        if(this.isRoot()) {
            this.clearEvaluation();
        }
        var evaluateHelper = function(choice) {
            var children = choice.children;
            if(children) {
                for(var i=0;i<children.length;i++) {
                    if(children[i].evaluation===undefined) {
                        evaluateHelper(children[i]);
                    }
                }
                
                children.sort(compareChoices);
                if(choice.model.turn=='w')
                    children.reverse();
            }
            choice.evaluation = !children ? choice.value :
                children.length ? children[0].evaluation :
                !choice.model.inCheck()?0:
                choice.model.turn=='w'?-100000:
                choice.model.turn=='b'?+100000:
                0;
        };
        evaluateHelper(this);
    },
    siblings : function() {
        return this.parent ? this.parent.children : null;
    },
    deleteBranch : function() {
        if(this.parent && this.parent.children) {
            var index = this.parent.children.indexOf(this);
            if(index>=0) {
                this.parent.children.splice(index,1);
            }
            this.parent = null;
        }
        this.markBranch("deleted",true);
    },
    markBranch : function(property,value) {
        this[property] = value;
        if(this.children) {
            for(var i=0;i<this.children.length;i++) {
                this.children[i].markBranch(property,value);
            }
        }
    }
}

function compareChoices(choice1,choice2) {
    return choice1.evaluation-choice2.evaluation;
}

function think(player,model,callback) {
    player.think(model,callback);
}

var timeout = null;

function ThinkingPlayer() {
    this.imagining = false;
    this.filtering = false;
    this.depth = 0;
    this.choices = null;
}
ThinkingPlayer.prototype = new Player();
ThinkingPlayer.prototype.decide = function(model,callback) {
    var moves = model.getPossibleMoves();
    if(moves.length) {
        timeout = setTimeout(think,100,this,model,callback);
    }
    else {
        callback(null);
    }
};
ThinkingPlayer.prototype.spread = function(choices) {
    var newChoices = [], hash = {};
    for(var i=0;i<choices.length;i++) {
        newChoices = newChoices.concat(choices[i].spread());
    }
    for(var i=newChoices.length-1;i>=0;i--) {
        if(!hash[newChoices[i].model.board]) {
            hash[newChoices[i].model.board] = true;
        }
        else {
            newChoices[i] = newChoices[newChoices.length-1];
            newChoices.pop();
        }
    }
    return newChoices;
};

ThinkingPlayer.prototype.getCurrentChoice = function(model) {
    return new Choice(null,this,model,null);
}

ThinkingPlayer.prototype.think = function(model,callback) {
    var root;
    if(timeout) {
        clearTimeout(timeout);
    }
    if(!this.imagining && !this.filtering) {
        if(!this.choices) {
            root = this.getCurrentChoice(model);
            this.choices = [root];
            this.imagining = true;
            this.depth = 0;
        }
        else {
            root = this.choices[0].getRoot();
            if(root.children.length<=1) {
                this.choices = null;
                callback(root.children[0].move);
                return;
            }
            else {
                this.imagining = true;
            }
        }
    }
    else if(this.imagining) {
        if(this.choices.length) {
            this.choices = this.imagine(this.choices,1);
            this.depth ++;
            if(this.choices.length>choiceLimit) {
                this.imagining = false;
                this.filtering = true;
            }
        }
        else {
            console.log("Computer has no choice");
        }
    }
    else if(this.filtering) {
        this.choices = this.filter(this.choices);
        root = this.choices[0].getRoot();
        if(this.choices.length<choiceLimit || root.children.length<=1) {
            this.filtering = false;
            this.imagining = false;
            console.log("choices:",root.children.length,"nodes:",this.choices.length,"depth:",this.depth);
        }
    }
    timeout = setTimeout(think,100,this,model,callback);
    
    if(document.getElementById("divturn")) {
        document.getElementById("divturn").innerHTML += ".";
    }
/*    choices = this.imagine(choices,1);
    root = choices[0].getRoot();
    var depth = 0;
    while(root.children.length>1) {
        if(choices.length) {
            do {
                choices = this.imagine(choices,1);
                depth++;
            } while(choices.length<choiceLimit);
        }
        
        do {
            choices = this.filter(choices);
            root = choices[0].getRoot();
        } while(choices.length>choiceLimit && root.children.length>1);
        console.log("choices:",root.children.length,"nodes:",choices.length,"depth:",depth);
    }
    
    callback(root.children[0].move);*/
}

ThinkingPlayer.prototype.imagine = function(choices,depth) {
    return depth<=0 ? choices : this.imagine(this.spread(choices),depth-1);
}

ThinkingPlayer.prototype.filter = function(choices) {
    var root = choices[0].getRoot();
    root.evaluate();
    if(root.children.length>1) {
        root.children[root.children.length-1].deleteBranch();
        for(var i=choices.length-1;i>=0;i--) {
            if(choices[i].deleted) {
                choices[i] = choices[choices.length-1];
                choices.pop();
            }
        }
    }
    return choices;
}

ThinkingPlayer.prototype.evaluate = function(model) {
    var value = 0;
    for(var row=0;row<8;row++) {
        for(var col=0;col<8;col++) {
            var cell = model.getCell(col,row);
            var dir = 0;
            if(cell.charAt(0)=='w') {
                dir = 1;
            }
            else if(cell.charAt(0)=='b'){
                dir = -1;
            }
            if(dir) {
                value += pieceValues[cell.charAt(1)] * dir;
            }
        }
    }
    return value;
}

//  HumanPlayer : Player

function HumanPlayer() {
    this.callback = null;
}
HumanPlayer.prototype = new Player();
HumanPlayer.prototype.decide = function(model,callback) {
    this.callback = callback;
}
HumanPlayer.prototype.localHuman = true;
