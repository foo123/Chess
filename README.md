# Chess

Chess Game, Chess Board, Chess Engine and GUI

![chess game](/screenshot.png)

## ChessGame

Represents a game of chess, the possible moves, when the game is over and who wins.
version: 1.0.0

## ChessBoard

Represents the board of chess in HTML.
version: 1.0.0

## ChessSearch

Implements various search methods for a best move in a game of chess.
version: 0.10.0

Methods:
* Alpha Beta Search
* MTD(f) Search
* Best Node Search
* Monte Carlo Tree Search
* Hybrids of above methods

A user-defined evaluation function can be used, else a custom-crafted evaluation function is used which, although simple and fast, produces quite good results.

Related References:
1. "An analysis of alpha-beta pruning", Donald E. Knuth, Ronald W. Moore
2. "Best-first fixed-depth minimax algorithms", Aske Plaat, Jonathan Schaeffer, Wim Pijls, Arie de Bruin
3. "Fuzzified Algorithm for Game Tree Search with Statistical and Analytical Evaluation", Dmitrijs Rutko
4. "Bandit based Monte-Carlo Planning", Levente Kocsis and Csaba Szepesvári
5. "Monte Carlo Tree Search: A Review of Recent Modifications and Applications", Maciej Świechowski, Konrad Godlewski, Bartosz Sawicki, Jacek Mańdziuk
6. "Pruning Game Tree by Rollouts", Bojun Huang
7. "A Rollout-Based Search Algorithm Unifying MCTS and Alpha-Beta", Hendrik Baier

Additionally, copies of [stockfish.js](https://github.com/nmrugg/stockfish.js/) and [sunfish.js](https://github.com/foo123/sunfish.js/) chess engines are included, that either a human or an algorithm can play against.