"use strict";

// use: node tournament.js player1 player2 nmatches --show --deepen --depth=DEPTH --bns=BNS --ab=AB --mcts=MCTS --uct=UCT --iter=ITER --elo=ELO --name1=PLAYER1 --name2=PLAYER2

// In 6 matches of STOCKFISH 18 (ELO1900) vs SUNFISH 2023 result is 3 - 3 (0 draws,min.plies 50,max.plies 100)

// In 6 matches of AB-245-d vs SUNFISH 2023 result is 1 - 5 (2 draws,min.plies 24,max.plies 120)

// In 6 matches of MTDf-245-d vs SUNFISH 2023 result is 3 - 3 (0 draws,min.plies 28,max.plies 82)

// In 6 matches of BNS-6 vs SUNFISH 2023 result is 2.5 - 3.5 (3 draws,min.plies 20,max.plies 106)
// In 6 matches of BNS-7 vs SUNFISH 2023 result is 2 - 4 (2 draws,min.plies 52,max.plies 128)
// In 6 matches of BNS-8 vs SUNFISH 2023 result is 1.5 - 4.5 (3 draws,min.plies 44,max.plies 132)

// In 6 matches of MCTS-9-5-500 vs SUNFISH 2023 result is 3 - 3 (2 draws,min.plies 24,max.plies 102)
// In 6 matches of MCTS-10-4-500 vs SUNFISH 2023 result is 3.5 - 2.5 (3 draws,min.plies 40,max.plies 62)
// In 6 matches of MCTS-10-5-500 vs SUNFISH 2023 result is 2.5 - 3.5 (1 draw,min.plies 18,max.plies 149)
// In 6 matches of MCTS-15-4-500 vs SUNFISH 2023 result is 2.5 - 3.5 (5 draws,min.plies 36,max.plies 118)
// In 6 matches of MCTS-15-5-500 vs SUNFISH 2023 result is 3 - 3 (0 draws,min.plies 20,max.plies 64)
// In 6 matches of MCTS-15-10-1000 vs SUNFISH 2023 result is 3 - 3 (4 draws,min.plies 38,max.plies 164)
// In 6 matches of MCTS-25-4-500 vs SUNFISH 2023 result is 1.5 - 4.5 (3 draws,min.plies 32,max.plies 118)
// In 6 matches of MCTS-25-5-500 vs SUNFISH 2023 result is 2 - 4 (4 draws,min.plies 34,max.plies 142)
// In 6 matches of MCTS-25-10-1000 vs SUNFISH 2023 result is 2 - 4 (2 draws,min.plies 42,max.plies 138)
// In 6 matches of MCTS-35-4-500 vs SUNFISH 2023 result is 1.5 - 4.5 (3 draws,min.plies 30,max.plies 128)
// In 6 matches of MCTS-35-5-500 vs SUNFISH 2023 result is 2.5 - 3.5 (3 draws,min.plies 38,max.plies 124)

// In 6 matches of ABMCTS-10-5-3-100 vs SUNFISH 2023 result is 3.5 - 2.5 (1 draw,min.plies 18,max.plies 96)

// In 6 matches of MIXED(MTDf,MCTS-10) vs SUNFISH 2023 result is 2 - 4 (2 draws,min.plies 40,max.plies 182)
// In 6 matches of MIXED(MCTS-10,MTDf) vs SUNFISH 2023 result is 3 - 3 (2 draws,min.plies 30,max.plies 94)

const args = (function parse_args() {
    const echo = console.log;

    const args = {
        PLAYER1:        'human',
        PLAYER2:        'sunfish',
        NUM_MATCHES:    1,
        SHOW:           false,
        DEEPEN:         false,
        DEPTH:          3,
        BNS:            Infinity,
        AB:             Infinity,
        MCTS:           Infinity,
        UCT:            0,
        ITER:           100,
        ELO:            1500
    };

    const supported_players = [
        'ab',
        'mtdf',
        'bns',
        'mcts',
        'abmcts',
        'mctsab',
        'abbns',
        'mixed1',
        'mixed2',
        'mixed3',
        'mixed4',
        'sunfish',
        'stockfish',
        'human'
    ];

    args.PLAYER1 = {player:(process.argv[2] || 'human').trim().toLowerCase(), name: null};
    args.PLAYER2 = {player:(process.argv[3] || 'sunfish').trim().toLowerCase(), name: null};

    if (-1 === supported_players.indexOf(args.PLAYER1.player) || -1 === supported_players.indexOf(args.PLAYER2.player))
    {
        echo('Unsupported players: '+[args.PLAYER1.player, args.PLAYER2.player].join(' vs '));
        echo('Supported players: '+supported_players.join(', '));
        process.exit(1);
    }

    args.NUM_MATCHES = parseInt(process.argv[4] || '1') || 1;
    let i = 5;
    while (process.argv.length > i)
    {
        if ('--show' === process.argv[i].toLowerCase()) args.SHOW = true;
        if ('--deepen' === process.argv[i].toLowerCase()) args.DEEPEN = true;
        if ('--depth=' === process.argv[i].slice(0, 8).toLowerCase()) args.DEPTH = parseInt(process.argv[i].slice(8).trim()) || 0;
        if ('--bns=' === process.argv[i].slice(0, 6).toLowerCase()) args.BNS = parseInt(process.argv[i].slice(6).trim()) || 0;
        if ('--ab=' === process.argv[i].slice(0, 5).toLowerCase()) args.AB = parseInt(process.argv[i].slice(5).trim()) || 0;
        if ('--mcts=' === process.argv[i].slice(0, 7).toLowerCase()) args.MCTS = parseInt(process.argv[i].slice(7).trim()) || 0;
        if ('--uct=' === process.argv[i].slice(0, 6).toLowerCase()) args.UCT = parseInt(process.argv[i].slice(6).trim()) || 0;
        if ('--iter=' === process.argv[i].slice(0, 7).toLowerCase()) args.ITER = parseInt(process.argv[i].slice(7).trim()) || 100;
        if ('--elo=' === process.argv[i].slice(0, 6).toLowerCase()) args.ELO = parseInt(process.argv[i].slice(6).trim()) || 1500;
        if ('--name1=' === process.argv[i].slice(0, 8).toLowerCase()) args.PLAYER1.name = process.argv[i].slice(8).trim();
        if ('--name2=' === process.argv[i].slice(0, 8).toLowerCase()) args.PLAYER2.name = process.argv[i].slice(8).trim();
        ++i;
    }
    return args;
})();

const ChessGame = require('./src/ChessGame.js');
const ChessBoard = require('./src/ChessBoard.js');
const ChessSearch = require('./src/ChessSearch.js');
const engine = {
    sunfish:    null,
    stockfish:  null
};
let repl = null;
const algorithm = {
    ab:        {algo:"ab", iterativedeepening:true, depth:245, time:10000, log:args.SHOW},
    mtdf:      {algo:"mtdf", iterativedeepening:true, depth:245, time:10000, log:args.SHOW},
    bns:       {algo:"bns", iterativedeepening:args.DEEPEN, depth:args.DEPTH, time:10000, log:args.SHOW},
    mcts:      {algo:"mcts", iterations:args.ITER, uct:args.UCT, depth:args.DEPTH, time:10000, log:args.SHOW},
    mctsab:    {algo:"mcts", iterations:args.ITER, uct:args.UCT, mcts:args.MCTS, ab:args.AB, depth:args.DEPTH, time:10000, log:args.SHOW},
    abmcts:    {algo:"ab", iterativedeepening:args.DEEPEN, iterations:args.ITER, uct:args.UCT, mcts:args.MCTS, depth:args.DEPTH, time:10000, log:args.SHOW},
    abbns:     {algo:"ab", iterativedeepening:args.DEEPEN, bns:args.BNS, depth:args.DEPTH, time:10000, log:args.SHOW},
    sunfish:   {depth:245, time:10000},
    stockfish: {elo:args.ELO, depth:245, time:10000}
};
const init = {
    sunfish: function() {
        engine.sunfish.sendCMD('ucinewgame');
        engine.sunfish.sendCMD('isready');
    },
    stockfish: function() {
        engine.stockfish.sendCMD('ucinewgame');
        engine.stockfish.sendCMD('isready');
    }
};
const play = {
    ab: function(game, then) {
        then((new ChessSearch.HybridSearch(game, algorithm.ab)).bestMove(game.getBoard().turn));
    },
    mtdf: function(game, then) {
        then((new ChessSearch.HybridSearch(game, algorithm.mtdf)).bestMove(game.getBoard().turn));
    },
    bns: function(game, then) {
        then((new ChessSearch.HybridSearch(game, algorithm.bns)).bestMove(game.getBoard().turn));
    },
    mcts: function(game, then) {
        then((new ChessSearch.HybridSearch(game, algorithm.mcts)).bestMove(game.getBoard().turn));
    },
    mctsab: function(game, then) {
        then((new ChessSearch.HybridSearch(game, algorithm.mctsab)).bestMove(game.getBoard().turn));
    },
    abmcts: function(game, then) {
        then((new ChessSearch.HybridSearch(game, algorithm.abmcts)).bestMove(game.getBoard().turn));
    },
    abbns: function(game, then) {
        then((new ChessSearch.HybridSearch(game, algorithm.abbns)).bestMove(game.getBoard().turn));
    },
    mixed1: function(game, then) {
        const mtdf = {algo:"mtdf", iterativedeepening:true, depth:245, time:10000, log:args.SHOW};
        const mcts = {algo:"mcts", iterations:500, uct:4, depth:10, time:10000, log:args.SHOW};
        const board = game.getBoard();
        then((new ChessSearch.HybridSearch(game, game.isCheck() ? mtdf : mcts)).bestMove(board.turn));
    },
    mixed2: function(game, then) {
        const mtdf = {algo:"mtdf", iterativedeepening:true, depth:245, time:10000, log:args.SHOW};
        const mcts = {algo:"mcts", iterations:500, uct:4, depth:10, time:10000, log:args.SHOW};
        const board = game.getBoard();
        then((new ChessSearch.HybridSearch(game, game.isCheck() ? mcts : mtdf)).bestMove(board.turn));
    },
    mixed3: function(game, then) {
        const bns = {algo:"bns", depth:7, time:10000, log:args.SHOW};
        const mcts = {algo:"mcts", iterations:500, uct:4, depth:10, time:10000, log:args.SHOW};
        const board = game.getBoard();
        then((new ChessSearch.HybridSearch(game, game.isCheck() ? mcts : bns)).bestMove(board.turn));
    },
    mixed4: function(game, then) {
        const bns = {algo:"bns", depth:7, time:10000, log:args.SHOW};
        const mcts = {algo:"mcts", iterations:500, uct:4, depth:10, time:10000, log:args.SHOW};
        const board = game.getBoard();
        then((new ChessSearch.HybridSearch(game, game.isCheck() ? bns : mcts)).bestMove(board.turn));
    },
    sunfish: function(game, then) {
        engine.sunfish.sendCMD('position startpos moves ' + game.getMovesUpToNow().join(' '));
        engine.sunfish.sendCMD('go ' + (algorithm.sunfish.depth ? ('depth ' + String(algorithm.sunfish.depth)) : '') + (algorithm.sunfish.time ? ('wtime ' + String(algorithm.sunfish.time) + ' btime ' + String(algorithm.sunfish.time)) : ''), then);
    },
    stockfish: function(game, then) {
        engine.stockfish.move = then;
        engine.stockfish.sendCMD('position startpos moves ' + game.getMovesUpToNow().join(' '));
        engine.stockfish.sendCMD('go ' + (algorithm.stockfish.depth ? ('depth ' + String(algorithm.stockfish.depth)) : '') + (algorithm.stockfish.time ? ('wtime ' + String(algorithm.stockfish.time) + ' btime ' + String(algorithm.stockfish.time)) : ''));
    },
    human: function(game, then, board, player) {
        if (!repl)
        {
            // init repl
            repl = require('repl').start({
                prompt: /*game.whoseTurn().slice(0, 1)*/player + ': ',
                writer: function(out) {
                    return null != out ? String(out) : '';
                },
                eval: function(move, ctx, r, ret) {
                    ctx.output = function(msg) {ret(null, msg);};
                    move = String(move).trim().toLowerCase();
                    if ("undo" === move)
                    {
                        ctx.then("undo");
                    }
                    else
                    {
                        const match = move.match(/([a-h][1-8])\s*([a-h][1-8])\s*([qrbn])?/);
                        if (match)
                        {
                            const piece = ctx.game.getPieceAt(match[1]);
                            if (!piece || (piece.color !== ctx.game.whoseTurn()) || !ctx.game.getPossibleMovesAt(match[1]).filter((m) => m.slice(0, 2) === match[2]).length)
                            {
                                ret(null, 'invalid move');
                            }
                            else
                            {
                                ctx.then({from:match[1], to:match[2], promotion:match[3]});
                            }
                        }
                        else
                        {
                            ret(null, 'invalid move');
                        }
                    }
                }
            });
            repl.context.msg = '';
        }
        repl.context.game = game;
        repl.context.board = board;
        repl.context.then = then;
    }
};
const player = {
    ab:         'AB-'+String(algorithm.ab.depth)+(algorithm.ab.iterativedeepening ? '-d' : ''),
    mtdf:       'MTDf-'+String(algorithm.mtdf.depth)+(algorithm.mtdf.iterativedeepening ? '-d' : ''),
    bns:        'BNS-'+String(algorithm.bns.depth)+(algorithm.bns.iterativedeepening ? '-d' : ''),
    mcts:       'MCTS-'+String(algorithm.mcts.depth)+'-'+String(algorithm.mcts.uct)+'-'+String(algorithm.mcts.iterations),
    mctsab:     'MCTSAB-'+String(algorithm.mctsab.depth)+'-'+String(algorithm.mctsab.uct)+'-'+String(algorithm.mctsab.mcts)+'-'+String(algorithm.mctsab.ab)+'-'+String(algorithm.mctsab.iterations),
    abmcts:     'ABMCTS-'+String(algorithm.abmcts.depth)+'-'+String(algorithm.abmcts.uct)+'-'+String(algorithm.abmcts.mcts)+'-'+String(algorithm.abmcts.iterations)+(algorithm.abmcts.iterativedeepening ? '-d' : ''),
    abbns:      'ABBNS-'+String(algorithm.abbns.depth)+'-'+String(algorithm.abbns.bns)+(algorithm.abbns.iterativedeepening ? '-d' : ''),
    mixed1:     'MIXED(MTDf,MCTS)',
    mixed2:     'MIXED(MCTS,MTDf)',
    mixed3:     'MIXED(MCTS,BNS)',
    mixed4:     'MIXED(BNS,MCTS)',
    sunfish:    'SUNFISH 2023',
    stockfish:  'STOCKFISH 18 (ELO'+String(algorithm.stockfish.elo)+')',
    human:      'human'
};

function tournament(match, matches_won_by_p1, draws, min_plies, max_plies, done)
{
    function play_match(WHITE, BLACK, GAME_OVER)
    {
        function play_next(move)
        {
            let output;
            if (move)
            {
                if ("undo" === move)
                {
                    if (game.undoMove()) --plies; // undo opponent move
                    if (game.undoMove()) --plies; // undo player move
                }
                else
                {
                    ++plies;
                    if (args.SHOW)
                    {
                        output = String(plies)+'. ' + game.whoseTurn().slice(0, 1) + ':' + move.from + move.to + (move.promotion || '');
                    }
                    game.doMove(move.from, move.to, move.promotion);
                    if (args.SHOW)
                    {
                        output += game.isCheck() ? ' (check)' : '';
                        echo(output);
                    }
                }
            }
            else
            {
                if (args.SHOW)
                {
                    output = String(plies+1) + '. ' + game.whoseTurn().slice(0, 1) + ':nomove';
                    echo(output);
                }
                game.noMove();
            }
            if (game.isGameOver())
            {
                const winner = game.winner();
                const score = 'DRAW' === winner ? 0.5 : ('WHITE' === winner ? 1 : 0);
                board.dispose();
                game.dispose();
                return GAME_OVER(score, plies);
            }
            else
            {
                switch (game.whoseTurn())
                {
                    case 'WHITE':
                    if ('human' === WHITE.player)
                    {
                        echo(board.toString("terminal", "WHITE"));
                        repl_prompt(WHITE.name+': ');
                        repl_echo();
                    }
                    play[WHITE.player](game, play_next, board, WHITE.name);
                    break;
                    case 'BLACK':
                    if ('human' === BLACK.player)
                    {
                        echo(board.toString("terminal", "BLACK"));
                        repl_prompt(BLACK.name+': ');
                        repl_echo();
                    }
                    play[BLACK.player](game, play_next, board, BLACK.name);
                    break;
                }
            }
        }
        const game = new ChessGame();
        const board = new ChessBoard(square => game.getPieceAt(square));
        let plies = 0;
        switch (game.whoseTurn())
        {
            case 'WHITE':
            if ('human' === WHITE.player)
            {
                echo(board.toString("terminal", "WHITE"));
                repl_prompt(WHITE.name+': ');
                repl_echo();
            }
            play[WHITE.player](game, play_next, board, WHITE.name);
            break;
            case 'BLACK':
            if ('human' === BLACK.player)
            {
                echo(board.toString("terminal", "BLACK"));
                repl_prompt(BLACK.name+': ');
                repl_echo();
            }
            play[BLACK.player](game, play_next, board, BLACK.name);
            break;
        }
    }
    if (0 >= args.NUM_MATCHES) return;
    if (null == match)
    {
        if (engine.sunfish)
        {
            engine.sunfish.sendCMD('uci');
        }
        if (engine.stockfish)
        {
            engine.stockfish.sendCMD('uci');
            //engine.stockfish.sendCMD('setoption name Skill Level value ' + String(algorithm.stockfish.skill));
            engine.stockfish.sendCMD('setoption name UCI_LimitStrength value true');
            engine.stockfish.sendCMD('setoption name UCI_Elo value ' + String(algorithm.stockfish.elo));
        }
        match = 0;
        matches_won_by_p1 = 0;
        draws = 0;
        min_plies = 1e6;
        max_plies = 0;

        if (!args.PLAYER1.name || !args.PLAYER1.name.length) args.PLAYER1.name = player[args.PLAYER1.player];
        if (!args.PLAYER2.name || !args.PLAYER2.name.length) args.PLAYER2.name = player[args.PLAYER2.player];
    }
    if (match < args.NUM_MATCHES)
    {
        ++match;
        if (init[args.PLAYER1.player]) init[args.PLAYER1.player]();
        if (init[args.PLAYER2.player]) init[args.PLAYER2.player]();
        if (match & 1)
        {
            echo('Playing match '+String(match)+' of '+String(args.NUM_MATCHES)+': '+args.PLAYER1.name+' vs '+args.PLAYER2.name+' ..');
            play_match(args.PLAYER1, args.PLAYER2, function(score_for_white, plies) {
                echo('Result after '+String(plies)+' plies: '+(0.5 === score_for_white ? '½' : String(score_for_white))+' - '+(0.5 === score_for_white ? '½' : String(1-score_for_white)));
                tournament(match, matches_won_by_p1 + score_for_white, draws+(0.5 === score_for_white ? 1 : 0), Math.min(plies, min_plies), Math.max(plies, max_plies), done);
            });
        }
        else
        {
            echo('Playing match '+String(match)+' of '+String(args.NUM_MATCHES)+': '+args.PLAYER2.name+' vs '+args.PLAYER1.name+' ..');
            play_match(args.PLAYER2, args.PLAYER1, function(score_for_white, plies) {
                echo('Result after '+String(plies)+' plies: '+(0.5 === score_for_white ? '½' : String(score_for_white))+' - '+(0.5 === score_for_white ? '½' : String(1-score_for_white)));
                tournament(match, matches_won_by_p1 + 1-score_for_white, draws+(0.5 === score_for_white ? 1 : 0), Math.min(plies, min_plies), Math.max(plies, max_plies), done);
            });
        }
    }
    else if (args.NUM_MATCHES)
    {
        echo('In '+String(args.NUM_MATCHES)+' '+(1 === args.NUM_MATCHES ? 'match' : 'matches')+' of '+args.PLAYER1.name+' vs '+args.PLAYER2.name+' result is '+String(matches_won_by_p1)+' - '+String(args.NUM_MATCHES-matches_won_by_p1)+' ('+String(draws)+' '+(1 === draws ? 'draw' : 'draws')+',min.plies '+String(min_plies)+',max.plies '+String(max_plies)+')');
        repl_prompt('');
        repl_echo();
        if (done) done(matches_won_by_p1, args.NUM_MATCHES-matches_won_by_p1, draws, min_plies, max_plies);
    }
}

function echo(msg)
{
    if (repl)
    {
        repl.context.msg += msg + "\n";
    }
    else
    {
        console.log(msg);
    }
}
function repl_prompt(prompt)
{
    if (repl) repl.setPrompt(prompt);
}
function repl_echo()
{
    if (repl)
    {
        repl.context.output(repl.context.msg);
        repl.context.msg = '';
    }
}
function ready(f)
{
    if (!f.waitFor) f();
    else setTimeout(function() {ready(f);}, 100);
}

function go()
{
    tournament(null, null, null, null, null, () => process.exit(0));
}
go.waitFor = 0;

if (-1 < [args.PLAYER1.player, args.PLAYER2.player].indexOf('sunfish'))
{
    // load sunfish engine
    engine.sunfish = require('./sunfish/sunfish.js');
    engine.sunfish.sendCMD = function(cmd, engine_sunfish_move) {
        engine.sunfish.engine(cmd, function(output) {
            if ('bestmove ' === output.slice(0, 9))
            {
                let match = output.match(/^bestmove\s+([a-h][1-8])([a-h][1-8])([qrbn])?/);
                if (engine_sunfish_move) engine_sunfish_move(match ? {from:match[1], to:match[2], promotion:match[3]} : null);
            }
            /*else if ('info ' === output.slice(0, 5))
            {
                echo(output);
            }*/
        });
    };
}

if (-1 < [args.PLAYER1.player, args.PLAYER2.player].indexOf('stockfish'))
{
    // load stockfish engine
    const path = require('path');
    const stockfishjs = path.join(__dirname, './stockfish/stockfish-18-lite-single.js');
    const stockfishwasm = path.join(__dirname, './stockfish/stockfish-18-lite-single.wasm');
    engine.stockfish = {
        locateFile: function(file) {
            return file.indexOf('.wasm') > -1 ? (stockfishwasm + (file.indexOf('.wasm.map') > -1 ? '.map' : '')) : stockfishjs;
        },
        move: null
    };
    ++go.waitFor;
    require(stockfishjs)()(engine.stockfish).then(function checkIfReady() {
        if (engine.stockfish._isReady)
        {
            if (!engine.stockfish._isReady()) return setTimeout(checkIfReady, 10);
            delete engine.stockfish._isReady;
        }
        engine.stockfish.sendCMD = function(cmd) {
            setImmediate(function() {
                engine.stockfish.ccall("command", null, ["string"], [cmd], {async: /^go\b/.test(cmd)});
            });
        };
        engine.stockfish.listener = function(output) {
            if ((typeof output) !== "string")
            {
                echo("Got line ("+(typeof output)+"):", output);
            }
            /*else if ('info ' === output.slice(0, 5))
            {
                echo(output);
            }*/
            else if ('bestmove ' === output.slice(0, 9))
            {
                let match = output.match(/^bestmove\s+([a-h][1-8])([a-h][1-8])([qrbn])?/);
                if (engine.stockfish.move) engine.stockfish.move(match ? {from:match[1], to:match[2], promotion:match[3]} : null);
            }
        };
        --go.waitFor;
    });
}

// on ready go
ready(go);