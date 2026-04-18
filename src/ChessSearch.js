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
    // 1. "An analysis of alpha-beta pruning", Donald E. Knuth, Ronald W. Moore
    // 2. "Best-first fixed-depth minimax algorithms", Aske Plaat, Jonathan Schaeffer, Wim Pijls, Arie de Bruin
    // 3. "Fuzzified Algorithm for Game Tree Search with Statistical and Analytical Evaluation", Dmitrijs Rutko
    // 4. "Bandit based Monte-Carlo Planning", Levente Kocsis and Csaba Szepesvári
    // 5. "Monte Carlo Tree Search: A Review of Recent Modifications and Applications", Maciej Świechowski, Konrad Godlewski, Bartosz Sawicki, Jacek Mańdziuk
    // 6. "Pruning Game Tree by Rollouts", Bojun Huang
    // 7. "A Rollout-Based Search Algorithm Unifying MCTS and Alpha-Beta", Hendrik Baier

    var self = this, board = self.game.getBoard().clone(),
        opts = {}, opponent = OPPOSITE[color],
        moves = shuffle(board.all_moves_for(color, true)),
        i = 0, n = moves.length,
        scores = new Array(n),
        max = -Infinity,
        best_move0 = [], best_move = [],
        stopped, start = 0, time, time_limit, has_timelimit = false,
        do_next = null, ret = null;
    stopped = self.opts.stopped || return_false;
    time_limit = (BLACK === color ? self.opts.btime : self.opts.wtime) || self.opts.time || Infinity;
    opts.algo = null != self.opts.algo ? String(self.opts.algo) : "ab";
    opts.eval_pos = self.opts.eval_pos;
    opts.eval_move = self.opts.eval_move || eval_move;
    opts.uct = null;
    opts.tt = null;
    opts.depth = stdMath.max(self.opts.depth || 0, 1);
    opts.depthM = opts.depth;
    opts.iterations = null != self.opts.iterations ? self.opts.iterations : 100;
    opts.depthPlayout = null != self.opts.playout ? self.opts.playout : Infinity;
    opts.depthUCT = +(self.opts.uct || 0);
    if (0 < opts.depthUCT) opts.uct = {}; // uct stats storage, if needed
    opts.tt = {}; // transposition table, where needed, as needed
    opts.iterativedeepening = self.opts.iterativedeepening;
    if (opts.iterativedeepening) opts.depth = stdMath.min(2, opts.depthM); // iterative deepening
    opts.heuristicpruning = opts.depthPlayout > opts.depthM;
    opts.f = 0;

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

        if (i >= n)
        {
            if ((n > 0) && (opts.depth <= opts.depthM))
            {
                best_move0 = best_move;
                best_move = [];
            }

            if (has_timelimit)
            {
                var now = perf.now();
                console.log('time:'+stdMath.floor(now - start)+', limit:'+time_limit);
                if (now - start > time) return ret(board.encode_move(random_choice(best_move0, null)));
            }

            if (opts.iterativedeepening)
            {
                moves = order_moves(moves, scores); // move ordering
                opts.depth += 2; // search deeper next time
                // reset
                i = 0;
                max = -Infinity;
                opts.tt = {};
            }
        }

        if ((i < n) && (opts.depth <= opts.depthM))
        {
            var mov = moves[i],
                move = board.move(mov[0], mov[1], mov[2], mov[3], mov[4], true),
                moves_next = board.all_moves_for(opponent, true),
                score = 0;
            opts.f = score[i] || 0;
            score = evaluate(opts, board, opponent, 2, -1, moves_next);
            score += (opts.eval_pos ? 0 : opts.eval_move(board, color, move, moves_next.length));
            board.unmove(move);
            scores[i] = score;
            if (score > max) {max = score; best_move = [mov];}
            else if (score === max) {best_move.push(mov);}
            ++i;
            return do_next(next);
        }
        else
        {
            return ret(board.encode_move(random_choice(best_move0, null)));
        }
    });
};

// search algorithms
function alphabeta(opts, board, color, depth, sgn, moves, alpha, beta)
{
    // Alpha-Beta Search with Transposition Table with Depth algorithm
    var moves_next, i, n, mov, move, key, tp, score, value, opponent = OPPOSITE[color];
    if (depth >= opts.depth)
    {
        return opts.eval_pos ? opts.eval_pos(board, 0 > sgn ? opponent : color) : 0;
    }
    if (!moves) moves = board.all_moves_for(color, true);
    if (!moves.length)
    {
        return opts.eval_pos ? opts.eval_pos(board, 0 > sgn ? opponent : color) : 0;
    }

    key = board.key();
    tp = opts.tt[key];
    if (tp && (tp.d >= depth))
    {
        // transposition that is already searched deeper
        return tp.v;
    }

    if (depth >= opts.depthPlayout)
    {
        value = mcts(opts, board, color, depth, sgn, moves);
    }
    else
    {
        if (opts.heuristicpruning)
        {
            // speed up by heuristic pruning
            if ((depth > 14) && (moves.length > 4))
            {
                moves = best_n_moves(4, moves, board, color, sgn);
            }
            if ((depth > 9) && (moves.length > 7))
            {
                moves = best_n_moves(7, moves, board, color, sgn);
            }
            if ((depth > 4) && (moves.length > 15))
            {
                moves = best_n_moves(15, moves, board, color, sgn);
            }
        }

        n = moves.length;
        if (0 < sgn)
        {
            value = -Infinity;
            for (i=0; i<n; ++i)
            {
                mov = moves[i];
                move = board.move(mov[0], mov[1], mov[2], mov[3], mov[4], true);
                moves_next = board.all_moves_for(opponent, true);
                score = sgn*(opts.eval_pos ? 0 : opts.eval_move(board, color, move, moves_next.length));
                value = stdMath.max(value, score+alphabeta(opts, board, opponent, depth+1, -sgn, moves_next, alpha, beta))
                board.unmove(move);
                if (value >= beta) break; // beta cutoff
                alpha = stdMath.max(alpha, value);
            }
        }
        else
        {
            value = Infinity;
            for (i=0; i<n; ++i)
            {
                mov = moves[i];
                move = board.move(mov[0], mov[1], mov[2], mov[3], mov[4], true);
                moves_next = board.all_moves_for(opponent, true);
                score = sgn*(opts.eval_pos ? 0 : opts.eval_move(board, color, move, moves_next.length));
                value = stdMath.min(value, score+alphabeta(opts, board, opponent, depth+1, -sgn, moves_next, alpha, beta));
                board.unmove(move);
                if (value <= alpha) break; // alpha cutoff
                beta = stdMath.min(beta, value);
            }
        }
    }

    // store value on transposition table for this depth
    if (!tp || (tp.d < depth)) opts.tt[key] = {v:value, d:depth >= opts.depthPlayout ? opts.depthM : depth};

    return value;
}
function mtdf(opts, board, color, depth, sgn, moves)
{
    // MTD(f) Search algorithm
    var g = opts.f, hi = Infinity, lo = -Infinity, beta;
    do {
        beta = g === lo ? g + 1 : g;
        g = alphabeta_bounds(opts, board, color, depth, sgn, moves, beta-1, beta);
        if (g < beta) hi = g; else lo = g;
    } while (lo+5 < hi);
    return g;
}
function alphabeta_bounds(opts, board, color, depth, sgn, moves, alpha, beta)
{
    // Alpha-Beta Search with Transposition Table with Bounds algorithm
    var moves_next, i, n, mov, move, key, tp, score, opponent = OPPOSITE[color], g, a, b;
    if (depth >= opts.depth)
    {
        return opts.eval_pos ? opts.eval_pos(board, 0 > sgn ? opponent : color) : 0;
    }
    if (!moves) moves = board.all_moves_for(color, true);
    if (!moves.length)
    {
        return opts.eval_pos ? opts.eval_pos(board, 0 > sgn ? opponent : color) : 0;
    }

    key = board.key();
    tp = opts.tt[key];
    if (tp)
    {
        // transposition table
        if (tp.lo >= beta) return tp.lo;
        if (tp.hi <= alpha) return tp.hi;
        alpha = stdMath.max(alpha, tp.lo);
        beta = stdMath.min(beta, tp.hi);
    }

    if (depth >= opts.depthPlayout)
    {
        g = mcts(opts, board, color, depth, sgn, moves);
    }
    else
    {
        n = moves.length;
        if (0 < sgn)
        {
            g = -Infinity;
            a = alpha;
            for (i=0; i<n; ++i)
            {
                mov = moves[i];
                move = board.move(mov[0], mov[1], mov[2], mov[3], mov[4], true);
                moves_next = board.all_moves_for(opponent, true);
                score = sgn*(opts.eval_pos ? 0 : opts.eval_move(board, color, move, moves_next.length));
                g = stdMath.max(g, score+alphabeta_bounds(opts, board, opponent, depth+1, -sgn, moves_next, a, beta))
                board.unmove(move);
                if (g >= beta) break; // beta cutoff
                a = stdMath.max(a, g);
            }
        }
        else
        {
            g = Infinity;
            b = beta;
            for (i=0; i<n; ++i)
            {
                mov = moves[i];
                move = board.move(mov[0], mov[1], mov[2], mov[3], mov[4], true);
                moves_next = board.all_moves_for(opponent, true);
                score = sgn*(opts.eval_pos ? 0 : opts.eval_move(board, color, move, moves_next.length));
                g = stdMath.min(g, score+alphabeta_bounds(opts, board, opponent, depth+1, -sgn, moves_next, alpha, b));
                board.unmove(move);
                if (g <= alpha) break; // alpha cutoff
                b = stdMath.min(b, g);
            }
        }
    }

    if (!tp) opts.tt[key] = tp = {lo:-Infinity, hi:Infinity};
    // fail low implies an upper bound
    if (g <= alpha)
    {
        tp.hi = g;
    }
    // accurate minimax value - will not occur if called with zero window
    else if (alpha < g && g < beta)
    {
        tp.lo = g;
        tp.hi = g;
    }
    // fail high implies a lower bound
    else if (g >= beta)
    {
        tp.lo = g;
    }
    return g;
}
function bns(opts, board, color, depth, sgn, moves)
{
    // Best Node Search algorithm
    var moves_next, i, n, mov, move, score, opponent = OPPOSITE[color],
        alpha, beta, test, count, newcount, value,
        MATE = opts.eval_pos ? (opts.eval_pos.MATE) : (opts.eval_move.MATE);
    if (depth >= opts.depth)
    {
        return opts.eval_pos ? opts.eval_pos(board, 0 > sgn ? opponent : color) : 0;
    }
    if (!moves) moves = board.all_moves_for(color, true);
    if (!moves.length)
    {
        return opts.eval_pos ? opts.eval_pos(board, 0 > sgn ? opponent : color) : 0;
    }
    n = moves.length;
    moves_next = new Array(n);
    count = n;
    alpha = -(MATE+10);
    beta = MATE+10;
    do {
        // next guess
        test = alpha + (beta - alpha) * stdMath.random()/*(count - 1) / count*/;
        newcount = 0;
        value = 0;
        for (i=0; i<n; ++i)
        {
            mov = moves[i];
            move = board.move(mov[0], mov[1], mov[2], mov[3], mov[4], true);
            if (!moves_next[i]) moves_next[i] = board.all_moves_for(opponent, true);
            score = sgn*(opts.eval_pos ? 0 : opts.eval_move(board, color, move, moves_next[i].length));
            score += alphabeta_bounds(opts, board, opponent, depth+1, -sgn, moves_next[i], test-1, test);
            board.unmove(move);
            if (sgn*score >= test)
            {
                ++newcount;
                value = score;
            }
        }
        // update alpha-beta range
        if (count === newcount)
        {
            alpha = test > alpha ? test : (test+1);
        }
        else if (0 === newcount)
        {
            beta = test < beta ? test : (test-1);
        }
        else if (alpha < test)
        {
            alpha = test;
        }
        else
        {
            beta = test < beta ? test : (test-1);
        }
        // update number of sub-trees that exceeds separation test value
        count = 0 < newcount ? newcount : count;
    } while (!(2 > beta - alpha || 1 === newcount));

    return value;
}
function mcts(opts, board, color, depth, sgn, moves)
{
    // Monte Carlo Tree Search with UCT algorithm
    var i, iter, score, value;
    for (score=0,i=0,iter=opts.iterations; i<iter; ++i)
    {
        score += mcts_playout(opts, board, color, depth, sgn, moves);
    }
    value = score / iter;
    return value;
}
function mcts_playout(opts, board, color, depth, sgn, moves)
{
    if (depth >= opts.depthM) return opts.eval_pos ? opts.eval_pos(board, 0 > sgn ? OPPOSITE[color] : color) : 0;
    if (!moves) moves = board.all_moves_for(color, true);
    if (!moves.length) return opts.eval_pos ? opts.eval_pos(board, 0 > sgn ? OPPOSITE[color] : color) : 0;
    if (depth+1 >= opts.depthM)
    {
        // return avg of all moves on remaining stages
        return moves.reduce(function(score, mov) {
            var move = board.move(mov[0], mov[1], mov[2], mov[3], mov[4], true);
            score += opts.eval_pos ? opts.eval_pos(board, 0 > sgn ? OPPOSITE[color] : color) : (sgn*opts.eval_move(board, color, move, null));
            board.unmove(move);
            return score;
        }, 0)/moves.length;
    }
    var mov, move, moves_next, value, i, w, d, uct;
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
        i = arg_max(uct.map(UCB1));
    }
    else
    {
        uct = null;
        // select randomly
        i = any_of(moves.length);
    }
    value = 0;
    mov = moves[i];
    move = board.move(mov[0], mov[1], mov[2], mov[3], mov[4], true);
    moves_next = board.all_moves_for(OPPOSITE[color], true);
    value = (opts.eval_pos ? 0 : (sgn*opts.eval_move(board, color, move, moves_next.length)));
    value += mcts_playout(opts, board, OPPOSITE[color], depth+1, -sgn, moves_next);
    board.unmove(move);
    if (uct)
    {
        // update UCT
        uct[i].ni += 1;
        w = win(sgn*value, opts.eval_pos ? (opts.eval_pos.MATE) : (opts.eval_move.MATE));
        d = w - uct[i].mi;
        uct[i].mi = uct[i].mi + d/uct[i].ni;
        uct[i].vi = ((uct[i].ni-1)*uct[i].vi + d*(w - uct[i].mi))/uct[i].ni;
    }
    return value;
}
function UCB1(si)
{
    // https://en.wikipedia.org/wiki/Upper_Confidence_Bound#UCB1-Tuned
    ++si.Ni;
    return si.ni ? (si.mi + stdMath.sqrt(stdMath.min(0.25, si.vi)*stdMath.log(si.Ni-1)/si.ni)) : Infinity;
}
function win(x, MATE)
{
    return clamp((x+MATE)/(2*MATE), 0, 1);
    //return 1 / (1 + stdMath.exp(-x/20));
}
function evaluate(opts, board, color, depth, sgn, moves)
{
    switch (opts.algo)
    {
        case "mcts":
        return mcts(opts, board, color, depth, sgn, moves);

        case "bns":
        return bns(opts, board, color, depth, sgn, moves);

        case "mtdf":
        return mtdf(opts, board, color, depth, sgn, moves);

        default:
        return alphabeta(opts, board, color, depth, sgn, moves, -Infinity, Infinity);
    }
}
var MATE = 1000, DRAW = 500, VALUE = [MATE, 100, 10, 10, 20, 1];
function eval_move(board, color, move, opponent_moves)
{
    /*
    move evaluation function: a) material gain, b) closeness to opposite king, c) opponent mobility, ..
    */
    // O(1)
    var opK = board.king[COLOR[OPPOSITE[color]]],
        f1 = 1, f2 = 0.12, f3 = 0.12, f4 = 20;
    if (0 === opponent_moves) return board.threatened_at_by(opK.y, opK.x, color) ? MATE : DRAW;
    var moved = move[0], placed = board._[move[3]][move[4]], taken = move[5],
        d1 = stdMath.abs(move[2]-opK.x)+stdMath.abs(move[1]-opK.y),
        d2 = stdMath.abs(move[4]-opK.x)+stdMath.abs(move[3]-opK.y),
        close_to_opposite_king = d1-d2,//(d2 > d1 ? (-d2) : (d2 < d1 ? (16-d2) : 0)),
        promotion_gain = VALUE[placed.type-1]-VALUE[moved.type-1],
        capture_gain = !taken || !taken.type ? 0 : VALUE[taken.type-1],
        material_gain = promotion_gain + capture_gain,
        opponent_mobility = board.halfMoves < f4 ? 0 : (opponent_moves || 0)
    ;
    return f1*material_gain + f2*close_to_opposite_king - f3*opponent_mobility;
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
// utils
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
function order_moves(moves, scores)
{
    var si = scores.map(function(s, i) {return [s, i];}).sort(function(a, b) {return b[0]-a[0];});
    scores.forEach(function(s, i) {scores[i] = si[i][0];});
    return si.map(function(si) {return moves[si[1]];});
}
function best_n_moves(n, moves, board, player, sgn)
{
    return order_moves(moves, moves.map(function(mov) {
        var move = board.move(mov[0], mov[1], mov[2], mov[3], mov[4], true),
            score = sgn*eval_move(board, player, move, null);
        board.unmove(move);
        return score;
    })).slice(0, n);
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
