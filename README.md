Chessbot vs Humans
===================
(title in progress)

Chess player AI written in JavaScript

Sept 24, 2014 - Update: Added JavaScript Workers!

Try the demo at:
http://jacklehamster.github.io/chesstron/


About the project:
------------------

The idea is to develop a JavaScript based AI that will run in a sandboxed environment to decide the best move for a chess game.
Future plan is to have AI play vs each other ;-P

Setup your AI:
- Each AI unit is derived from a class Player (Look at ThinkingPlayer or RandomPlayer inside chessplayer.as for model)
- The Player has a member function "decide", which will be called every time a player needs to decide a move. The function takes a model and a callback.
- The model object can "make a move" and duplicate itself. It also has information about the pieces on the board.
A classic way to program AI is to duplicate the model, make it play various move, and determine based on the situation if
a move is realistic or not (for yourself, your move should end up in a position of winning. For the opponent, the move should
make you lose). To evaluate a board, the ThinkingPlayer algorithm simply attributes some values to pieces, and counts how
many of them are left (Queens are worth much more than other pieces).
- The Player is expected to take a long time to decide. To avoid javascript to get stuck, set the useWorker member variable
to the name of your class. Also make sure your class is in a file imported by chessworker.js.
- AI should not use Timer functions or native Random functions. There is a seeded Random function available. The reason why
we prefer a seeded Random function is because the plan is to have matches between AI. Each match will have a different seed,
but each match with a particular ssed should always end with the same result between two AI, no matter what.

This project is in progress. Right now there are two AI player. One that plays randomly (does not use Worker). Another one,
called ThinkingPlayer, that thinks using the classical AI approach described above. 
By default, the ThinkingPlayer is available. 

Feel free to give me comments.
