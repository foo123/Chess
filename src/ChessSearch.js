/**
*  ChessSearch
*  Search algorithms that find best chess moves
*  @VERSION: 0.10.0
*
**/
!function(root, name, factory) {
"use strict";
if ('object' === typeof exports)
    // CommonJS module
    module.exports = factory();
else if ('function' === typeof define && define.amd)
    // AMD. Register as an anonymous module.
    define(function(req) {return factory();});
else
    root[name] = factory();
}('undefined' !== typeof self ? self : this, 'ChessSearch', function(undef) {
"use strict";

var proto = 'prototype',
    stdMath = Math,
    INF = Infinity,
    EMPTY = 0,
    WHITE = 1,
    BLACK = 2,
    KING = 1,
    QUEEN = 2,
    BISHOP = 3,
    KNIGHT = 4,
    ROOK = 5,
    PAWN = 6,
    OPPOSITE = [EMPTY, BLACK, WHITE],
    COLOR = ['NONE', 'WHITE', 'BLACK'],
    NONE = {color:EMPTY, type:EMPTY},
    perf = ("undefined" !== typeof global) && ('[object global]' === {}.toString.call(global)) ? require('node:perf_hooks').performance : performance
;

function ChessSearch(game, opts)
{
    var self = this;
    self.game = game;
    self.opts = opts || {};
}
ChessSearch[proto] = {
    constructor: ChessSearch,
    dispose: function() {
        var self = this;
        self.game = null;
        self.opts = null;
    },
    game: null,
    opts: null,
    // overwrite
    bestMove: function(color) {}
};

ChessSearch.HybridSearch = function(game, opts) {
    ChessSearch.call(this, game, opts);
};
ChessSearch.HybridSearch[proto] = Object.create(ChessSearch[proto]);
ChessSearch.HybridSearch[proto].constructor = ChessSearch.HybridSearch;
ChessSearch.HybridSearch[proto].bestMove = function(color) {
    // Find best move by
    // a) Alpha Beta Search
    // or
    // b) MTD(f) Search
    // or
    // c) Best Node Search
    // or
    // d) Monte Carlo Tree Search
    // or
    // e) Hybrids of above methods

    // Related References:
    // 1. "An analysis of alpha-beta pruning", Donald E. Knuth, Ronald W. Moore, 1975
    // 2. "Best-first fixed-depth minimax algorithms", Aske Plaat, Jonathan Schaeffer, Wim Pijls, Arie de Bruin, 1996
    // 3. "Fuzzified Algorithm for Game Tree Search with Statistical and Analytical Evaluation", Dmitrijs Rutko, 2011
    // 4. "Bandit based Monte-Carlo Planning", Levente Kocsis and Csaba Szepesvári, 2006
    // 5. "Monte Carlo Tree Search: A Review of Recent Modifications and Applications", Maciej Świechowski, Konrad Godlewski, Bartosz Sawicki, Jacek Mańdziuk, 2021
    // 6. "Pruning Game Tree by Rollouts", Bojun Huang, 2015
    // 7. "A Rollout-Based Search Algorithm Unifying MCTS and Alpha-Beta", Hendrik Baier, 2016

    var self = this,
        board = self.game.getBoard().clone(),
        opponent = OPPOSITE[color],
        moves = shuffle(board.all_moves_for(color, true)),
        n = moves.length,
        moves_next = new Array(n),
        scores = new Array(n),
        best_moves = [],
        opts = {},
        log, stopped,
        start = 0,
        time, time_limit,
        has_timelimit = false,
        do_next = null, ret = null;

    log = self.opts.log;
    stopped = self.opts.stopped || return_false;
    time_limit = (BLACK === color ? self.opts.btime : self.opts.wtime) || self.opts.time || INF;

    opts.algo = null != self.opts.algo ? String(self.opts.algo).toLowerCase() : "ab";
    opts.eval_pos = self.opts.eval_pos;
    opts.eval_move = self.opts.eval_move || eval_move;
    opts.MATE = opts.eval_pos ? (opts.eval_pos.MATE) : (opts.eval_move.MATE);

    opts.depth = stdMath.max((+self.opts.depth) || 0, 1);
    opts.depthM = opts.depth;

    opts.depthBNS = null != self.opts.bns ? +self.opts.bns : INF;
    opts.depthAB = null != self.opts.ab ? +self.opts.ab : INF;
    opts.depthMCTS = null != self.opts.mcts ? +self.opts.mcts : INF;
    opts.depthUCT = (+self.opts.uct) || 0;
    opts.iterations = null != self.opts.iterations ? +self.opts.iterations : 100;

    opts.uct = 0 < opts.depthUCT ? {} : null; // uct stats storage, if needed
    opts.tt = {}; // transposition table, where needed, as needed

    opts.f = 0;

    opts.iterativedeepening = self.opts.iterativedeepening;
    if (opts.iterativedeepening && ("mcts" !== opts.algo)) opts.depth = stdMath.min(2, opts.depthM); // iterative deepening
    opts.heuristicpruning = "ab" === opts.algo && opts.depthMCTS > opts.depthM && opts.depthAB > opts.depthM && opts.depthBNS > opts.depthM;

    if (is_function(self.opts.cb))
    {
        // async
        if ('undefined' !== typeof Promise)
        {
            do_next = function(next) {
                Promise.resolve().then(next);
            };
        }
        else
        {
            do_next = function(next) {
                setTimeout(next, 1);
            };
        }
        ret = function(move) {
            opts.uct = null;
            opts.tt = null;
            board.dispose();
            self.opts.cb(move);
        };
    }
    else
    {
        // sync
        do_next = function(next) {
            return next();
        };
        ret = function(move) {
            opts.uct = null;
            opts.tt = null;
            board.dispose();
            return move;
        };
    }

    if (isFinite(time_limit))
    {
        has_timelimit = true;
        time = time_limit * 0.9;
        start = perf.now();
    }

    return do_next(function next() {
        if (stopped()) return ret(null);

        if ((1 < n) && (opts.depth <= opts.depthM))
        {
            var i, curr, score, test, max = -INF,
                alpha = -opts.MATE, beta = opts.MATE,
                mov, move, newcount, best_move, now, not_done;

            do {
                not_done = false;
                best_move = [];
                test = alpha + (beta - alpha) * (n - 1) / n;
                newcount = 0;

                for (i=0; i<n; ++i)
                {
                    if (has_timelimit && opts.iterativedeepening && (perf.now() - start > time))
                    {
                        // time limit exceeded
                        if (log) console.log('time:'+stdMath.floor(perf.now() - start)+', limit:'+time_limit);
                        return ret(board.encode_move(random_choice(best_move.length && ((i+1 >= 0.75*n) || !best_moves.length) ? best_move : (best_moves.length ? best_moves : moves), null)));
                    }

                    mov = moves[i];
                    move = board.move(mov[0], mov[1], mov[2], mov[3], mov[4], true);
                    if (!moves_next[i]) moves_next[i] = board.all_moves_for(opponent, true);
                    curr = opts.eval_pos ? 0 : opts.eval_move(board, color, move, moves_next[i].length);

                    switch (opts.algo)
                    {
                        case "mcts":
                        score = mcts(opts, board, opponent, 2, -1, moves_next[i], curr);
                        if (score > max) {max = score; best_move = [mov];}
                        else if (score === max) {best_move.push(mov);}
                        break;

                        case "bns":
                        score = alphabeta(opts, board, opponent, 2, -1, moves_next[i], curr, test-1, test);
                        if (score >= test)
                        {
                            ++newcount;
                            best_move.push(mov);
                        }
                        break;

                        case "mtdf":
                        opts.f = scores[i];
                        score = mtdf(opts, board, opponent, 2, -1, moves_next[i], curr);
                        if (score > max) {max = score; best_move = [mov];}
                        else if (score === max) {best_move.push(mov);}
                        break;

                        default:
                        score = alphabeta(opts, board, opponent, 2, -1, moves_next[i], curr, -INF, INF);
                        if (score > max) {max = score; best_move = [mov];}
                        else if (score === max) {best_move.push(mov);}
                        break;
                    }

                    scores[i] = score;
                    board.unmove(move);
                }

                if ("bns" === opts.algo)
                {
                    // update alpha-beta range
                    if (newcount > n/2)
                    {
                        alpha = test > alpha ? test : (test+1);
                    }
                    else
                    {
                        beta = test < beta ? test : (test-1);
                    }
                    not_done = !((alpha+2 > beta) || (1 === newcount));
                }
            } while (not_done);

            best_moves = best_move;

            if (has_timelimit)
            {
                now = perf.now();
                if (log) console.log('time:'+stdMath.floor(now - start)+', limit:'+time_limit);
                if (now - start > time) return ret(board.encode_move(random_choice(best_moves, null)));
            }

            if (opts.iterativedeepening)
            {
                if (opts.depth >= opts.depthM || opts.depth >= opts.depthMCTS) return ret(board.encode_move(random_choice(best_moves, null)));
                order_moves(scores, moves, moves_next); // move ordering
                opts.depth += 2; // search deeper next time
                opts.tt = {}; // reset transposition table ??
                return do_next(next);
            }
        }

        return ret(board.encode_move(random_choice(best_moves.length ? best_moves : moves, null)));
    });
};

// search algorithms -------------------
function alphabeta(opts, board, color, depth, sgn, moves, curr, alpha, beta)
{
    // Alpha Beta Search with Transposition Table algorithm
    var moves_next, i, n, mov, move, key, tp, score, value, opponent = OPPOSITE[color], a, b;

    key = board.key();
    tp = opts.tt[key];
    if (tp)
    {
        // transposition found
        if ("ab" === opts.algo && tp.d >= depth) return tp.v;
        if (tp.lo >= beta) return tp.lo;
        if (tp.hi <= alpha) return tp.hi;
        alpha = stdMath.max(alpha, tp.lo);
        beta = stdMath.min(beta, tp.hi);
        if (alpha >= beta) return 0 < sgn ? beta : alpha; // infeasible
    }
    if (!tp) opts.tt[key] = tp = {lo:-INF, hi:INF, v:0, d:0};

    if (depth >= opts.depth || !moves.length)
    {
        value = opts.eval_pos ? opts.eval_pos(board, 0 > sgn ? opponent : color) : curr;
    }
    else if (depth >= opts.depthMCTS)
    {
        value = mcts(opts, board, color, depth, sgn, moves, curr);
    }
    else if (depth >= opts.depthBNS)
    {
        value = bns(opts, board, color, depth, sgn, moves, curr, alpha, beta);
    }
    else
    {
        if (opts.heuristicpruning)
        {
            // speed up by heuristic pruning
            if ((depth > 14) && (moves.length > 4))
            {
                moves = best_n_moves(4, moves, board, color);
            }
            if ((depth > 9) && (moves.length > 7))
            {
                moves = best_n_moves(7, moves, board, color);
            }
            if ((depth > 4) && (moves.length > 15))
            {
                moves = best_n_moves(15, moves, board, color);
            }
        }

        n = moves.length;
        if (0 < sgn)
        {
            value = -INF;
            a = alpha;
            for (i=0; i<n; ++i)
            {
                mov = moves[i];
                move = board.move(mov[0], mov[1], mov[2], mov[3], mov[4], true);
                moves_next = board.all_moves_for(opponent, true);
                score = opts.eval_pos ? 0 : (curr + sgn*opts.eval_move(board, color, move, moves_next.length));
                value = stdMath.max(value, alphabeta(opts, board, opponent, depth+1, -sgn, moves_next, score, a, beta))
                board.unmove(move);
                if (value >= beta) break; // beta cutoff
                a = stdMath.max(a, value);
            }
        }
        else
        {
            value = INF;
            b = beta;
            for (i=0; i<n; ++i)
            {
                mov = moves[i];
                move = board.move(mov[0], mov[1], mov[2], mov[3], mov[4], true);
                moves_next = board.all_moves_for(opponent, true);
                score = opts.eval_pos ? 0 : (curr + sgn*opts.eval_move(board, color, move, moves_next.length));
                value = stdMath.min(value, alphabeta(opts, board, opponent, depth+1, -sgn, moves_next, score, alpha, b));
                board.unmove(move);
                if (value <= alpha) break; // alpha cutoff
                b = stdMath.min(b, value);
            }
        }
    }

    // store on transposition table
    if (tp.d <= depth)
    {
        if (value <= alpha)
        {
            // fail low result implies an upper bound
            tp.hi = stdMath.min(tp.hi, value);
        }
        if (alpha < value && value < beta)
        {
            // accurate minimax value - will not occur if called with zero window
            tp.lo = value;
            tp.hi = value;
        }
        if (value >= beta)
        {
            // fail high result implies a lower bound
            tp.lo = stdMath.max(tp.lo, value);
        }
        tp.d = depth >= opts.depthMCTS ? opts.depthM : depth;
        tp.v = value;
    }

    return value;
}
function mtdf(opts, board, color, depth, sgn, moves, curr)
{
    // MTD(f) Search algorithm
    var value = opts.f || 0, hi = INF, lo = -INF, beta, iter = 0;
    do {
        ++iter;
        beta = value === lo ? value+1 : value;
        value = alphabeta(opts, board, color, depth, sgn, moves, curr, beta-1, beta);
        if (value < beta) hi = value; else lo = value;
    } while ((lo+2 < hi) || (iter < 500));
    return value;
}
function bns(opts, board, color, depth, sgn, moves, curr, alpha, beta)
{
    // Best Node Search algorithm
    var i, n = moves.length, moves_next, mov, move,
        score, opponent = OPPOSITE[color],
        test, count, newcount, value;
    if (depth >= opts.depth || !n)
    {
        value = opts.eval_pos ? opts.eval_pos(board, 0 > sgn ? opponent : color) : curr;
    }
    else
    {
        moves_next = new Array(n);
        count = n;
        if (null == alpha)
        {
            alpha = -opts.MATE;
            beta = opts.MATE;
        }
        do {
            // next guess
            test = alpha + (beta - alpha) * /*stdMath.random()*/(count - 1) / count;
            newcount = 0;
            value = -INF;
            for (i=0; i<n; ++i)
            {
                mov = moves[i];
                move = board.move(mov[0], mov[1], mov[2], mov[3], mov[4], true);
                if (!moves_next[i]) moves_next[i] = board.all_moves_for(opponent, true);
                score = opts.eval_pos ? 0 : (curr + sgn*opts.eval_move(board, color, move, moves_next[i].length));
                score = alphabeta(opts, board, opponent, depth+1, -sgn, moves_next[i], score, test-1, test);
                board.unmove(move);
                if (score >= test)
                {
                    ++newcount;
                    value = stdMath.max(value, score);
                }
            }
            // update alpha-beta range
            if (newcount > count/2)
            {
                alpha = test > alpha ? test : (test+1);
            }
            else
            {
                beta = test < beta ? test : (test-1);
            }
            // update number of sub-trees that exceeds separation test value
            //count = 0 < newcount ? newcount : count;
        } while (!((alpha+2 > beta) || (1 === newcount)));
    }
    return value;
}
function mcts(opts, board, color, depth, sgn, moves, curr)
{
    // Monte Carlo Tree Search with UCT algorithm
    var i, iter, score, value;
    for (score=0,i=0,iter=opts.iterations; i<iter; ++i)
    {
        score += mcts_playout(opts, board, color, depth, sgn, moves, curr);
    }
    value = score / iter;
    return value;
}
function mcts_playout(opts, board, color, depth, sgn, moves, curr)
{
    // Monte Carlo playout algorithm
    var mov, move, moves_next, score, value, opponent = OPPOSITE[color], i, w, d, uct;
    if (depth >= opts.depthM || !moves.length)
    {
        return opts.eval_pos ? opts.eval_pos(board, 0 > sgn ? opponent : color) : curr;
    }
    if (depth+1 >= opts.depthM)
    {
        // return avg of all moves on remaining stages
        return moves.reduce(function(score, mov) {
            var move = board.move(mov[0], mov[1], mov[2], mov[3], mov[4], true);
            score += opts.eval_pos ? opts.eval_pos(board, 0 > sgn ? opponent : color) : (curr + sgn*opts.eval_move(board, color, move, null));
            board.unmove(move);
            return score;
        }, 0)/moves.length;
    }
    if (depth <= opts.depthUCT)
    {
        uct = moves.map(function(mov) {
            var move = board.move(mov[0], mov[1], mov[2], mov[3], mov[4], true),
                key = board.key(), uct = opts.uct[key];
            board.unmove(move);
            if (!uct) opts.uct[key] = uct = {Ni:0,ni:0,mi:0,vi:0};
            return uct;
        });
        // select based on UCT
        i = arg_max(uct.map(UCB1), 0 < sgn ? "max" : "min");
    }
    else
    {
        uct = null;
        // select randomly
        i = any_of(moves.length);
    }
    mov = moves[i];
    move = board.move(mov[0], mov[1], mov[2], mov[3], mov[4], true);
    moves_next = board.all_moves_for(opponent, true);
    score = opts.eval_pos ? 0 : (curr + sgn*opts.eval_move(board, color, move, moves_next.length));
    if (depth >= opts.depthAB)
    {
        value = alphabeta_rollout(opts, board, opponent, depth+1, -sgn, moves_next, score, -INF, INF);
    }
    else
    {
        value = mcts_playout(opts, board, opponent, depth+1, -sgn, moves_next, score);
    }
    board.unmove(move);
    if (uct)
    {
        // update UCT
        uct[i].ni += 1;
        w = win(value, opts.MATE);
        d = w - uct[i].mi;
        uct[i].mi = uct[i].mi + d/uct[i].ni;
        uct[i].vi = ((uct[i].ni-1)*uct[i].vi + d*(w - uct[i].mi))/uct[i].ni;
    }
    return value;
}
function alphabeta_rollout(opts, board, color, depth, sgn, moves, curr, alpha, beta)
{
    // Alpha Beta rollout algorithm
    var n = moves.length, moves_next, mov, move,
        score, value, feasible, v, vk, vs, key, tp,
        opponent = OPPOSITE[color], a, b, i;

    key = board.key();
    tp = opts.tt[key];
    if (tp)
    {
        // transposition found
        if (tp.lo >= beta) return tp.lo;
        if (tp.hi <= alpha) return tp.hi;
        alpha = stdMath.max(alpha, tp.lo);
        beta = stdMath.min(beta, tp.hi);
        if (alpha >= beta) return 0 < sgn ? beta : alpha; // infeasible
    }
    if (!tp) opts.tt[key] = tp = {lo:-INF, hi:INF, v:0, d:0};

    if (depth >= opts.depthM || !n)
    {
        value = opts.eval_pos ? opts.eval_pos(board, 0 > sgn ? opponent : color) : curr;
    }
    else if (depth >= opts.depthMCTS)
    {
        mov = moves[any_of(n)];
        move = board.move(mov[0], mov[1], mov[2], mov[3], mov[4], true);
        moves_next = board.all_moves_for(opponent, true);
        score = opts.eval_pos ? 0 : (curr + sgn*opts.eval_move(board, color, move, moves_next.length));
        value = mcts_playout(opts, board, opponent, depth+1, -sgn, moves_next, score);
        board.unmove(move);
    }
    else
    {
        feasible = null;
        for (i=0; i<n; ++i)
        {
            mov = moves[i];
            move = board.move(mov[0], mov[1], mov[2], mov[3], mov[4], true);
            vk = board.key();
            vs = opts.tt[vk];
            board.unmove(move);
            if (!vs) vs = {lo:-INF, hi:INF, v:0, d:0};
            a = stdMath.max(alpha, vs.lo);
            b = stdMath.min(beta, vs.hi);
            if (a < b)
            {
                feasible = {i:i, a:a, b:b}; // leftmost
                break;
            }
        }
        if (feasible)
        {
            mov = moves[feasible.i];
            move = board.move(mov[0], mov[1], mov[2], mov[3], mov[4], true);
            moves_next = board.all_moves_for(opponent, true);
            score = opts.eval_pos ? 0 : (curr + sgn*opts.eval_move(board, color, move, moves_next.length));
            value = alphabeta_rollout(opts, board, opponent, depth+1, -sgn, moves_next, score, feasible.a, feasible.b);
            board.unmove(move);
        }
        else
        {
            value = 0 < sgn ? beta : alpha; // infeasible
        }
    }

    // store on transposition table
    if (tp.d <= depth)
    {
        if (value <= alpha)
        {
            // fail low result implies an upper bound
            tp.hi = stdMath.min(tp.hi, value);
        }
        if (alpha < value && value < beta)
        {
            // accurate minimax value - will not occur if called with zero window
            tp.lo = value;
            tp.hi = value;
        }
        if (value >= beta)
        {
            // fail high result implies a lower bound
            tp.lo = stdMath.max(tp.lo, value);
        }
        tp.d = opts.depthM;
        tp.v = value;
    }

    return value;
}
function UCB1(si)
{
    // https://en.wikipedia.org/wiki/Upper_Confidence_Bound#UCB1-Tuned
    ++si.Ni;
    return si.ni ? (si.mi + stdMath.sqrt(stdMath.min(0.25, si.vi)*stdMath.log(si.Ni-1)/si.ni)) : INF;
}
function win(x, MATE)
{
    return clamp((x+MATE)/(2*MATE), 0, 1);
    //return 1 / (1 + stdMath.exp(-x/20));
}

// custom evaluation functions ------------------
var MATE = 1000 + 10*100, DRAW = MATE/2, VALUE = [MATE, 100, 10, 10, 20, 1];
function eval_move(board, color, move, opponent_moves)
{
    /*
    move evaluation function: a) material gain, b) closeness to opposite king, c) opponent mobility, ..
    */
    // O(1)
    var opK = board.king[COLOR[OPPOSITE[color]]],
        f1 = 1, f2 = 0.12, f3 = 0.12, f4 = 20, f5 = 0.1;
    if (0 === opponent_moves) return board.threatened_at_by(opK.y, opK.x, color) ? MATE : DRAW;
    var moved = move[0], placed = board._[move[3]][move[4]], taken = move[5],
        d1 = stdMath.abs(move[2]-opK.x)+stdMath.abs(move[1]-opK.y),
        d2 = stdMath.abs(move[4]-opK.x)+stdMath.abs(move[3]-opK.y),
        close_to_opposite_king = d1-d2,//(d2 > d1 ? (-d2) : (d2 < d1 ? (16-d2) : 0)),
        promotion_gain = VALUE[placed.type-1]-VALUE[moved.type-1],
        capture_gain = !taken || !taken.type ? 0 : VALUE[taken.type-1],
        material_gain = promotion_gain + capture_gain,
        opponent_mobility = board.halfMoves < f4 ? 0 : (opponent_moves || 0),
        place_goodness = 0
    ;
    switch (moved.type)
    {
        case 1: // KING, good to avoid corners
        place_goodness = (0 === move[3] && 0 === move[4]) || (0 === move[3] && 7 === move[4]) || (7 === move[3] && 0 === move[4]) || (7 === move[3] && 7 === move[4]) ? -2 : 0;
        break;

        case 4: // KNIGHT, good to avoid edges
        place_goodness = -1 < [0, 7].indexOf(move[4]) || -1 < [0, 7].indexOf(move[3]) ? -1 : 0;
        break;

        case 6: // PAWN, good to move forward
        place_goodness = stdMath.abs(move[3]-move[1]);
        break;
    }
    return f1*material_gain + f2*close_to_opposite_king - f3*opponent_mobility + f5*place_goodness;
}
eval_move.MATE = MATE;
function eval_pos(board, color)
{
    /*
    position evaluation function: a) material balance, b) average mobility, c) average control, d) closeness to opposite king,  e) avoidance of centroids of overpopulated areas, f) pieces on good/bad squares, ..
    */
    return 0; // random
}
eval_pos.MATE = MATE;


// utils -----------------------
function shuffle(a, a0, a1)
{
    // O(n)
    if (null == a0) a0 = 0;
    if (null == a1) a1 = a.length-1;
    var N = a1-a0+1;
    for (;1 < N--;)
    {
        var perm = stdMath.round(N*stdMath.random()), swap = a[a0+N];
        a[a0+N] = a[a0+perm]; a[a0+perm] = swap;
    }
    return a;
}
function order_moves(scores, moves, moves_next)
{
    var si = scores.map(function(s, i) {return [s, moves[i], moves_next ? moves_next[i] : null];}).sort(function(a, b) {return b[0]-a[0];});
    scores.forEach(function(_, i) {scores[i] = si[i][0];});
    moves.forEach(function(_, i) {moves[i] = si[i][1];});
    if (moves_next) moves_next.forEach(function(_, i) {moves_next[i] = si[i][2];});
    return moves;
}
function best_n_moves(n, moves, board, player)
{
    return order_moves(moves.map(function(mov) {
        var move = board.move(mov[0], mov[1], mov[2], mov[3], mov[4], true),
            score = eval_move(board, player, move, null);
        board.unmove(move);
        return score;
    }), moves.slice()).slice(0, n);
}
function arg_max(values, type)
{
    var iv = 0, v = values[iv], vi, i = 1, n = values.length;
    if ("min" === type)
    {
        if (!isFinite(v)) v = -v;
        for (; i<n; ++i)
        {
            vi = values[i];
            if (!isFinite(vi)) vi = -vi;
            if (vi < v)
            {
                v = vi;
                iv = i;
            }
        }
    }
    else
    {
        for (; i<n; ++i)
        {
            vi = values[i];
            if (vi > v)
            {
                v = vi;
                iv = i;
            }
        }
    }
    return iv;
}
function any_of(N)
{
    return stdMath.round(stdMath.random()*(N-1));
}
function random_choice(choices, default_choice)
{
    return choices.length ? choices[any_of(choices.length)] : default_choice;
}
function return_true()
{
    return true;
}
function return_false()
{
    return false;
}
function clamp(x, min, max)
{
    return stdMath.min(stdMath.max(x, min), max);
}
function is_function(x)
{
    return "function" === typeof x;
}

// export it
ChessSearch.VERSION = "0.10.0";
return ChessSearch;
});
