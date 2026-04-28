"use strict";

// use: node tournament.js engine1 engine2 nmatches --show --deepen --depth=DEPTH --bns=BNS --ab=AB --mcts=MCTS --uct=UCT --iter=ITER --elo=ELO

// In 6 matches of STOCKFISH 18 (ELO1900) vs SUNFISH 2023 result is 5.5 - 0.5 (1 draw,min.plies 48,max.plies 68)

// In 6 matches of AB-245-d vs SUNFISH 2023 result is 1.5 - 4.5 (3 draws,min.plies 30,max.plies 110)
// In 6 matches of MTDf-245-d vs SUNFISH 2023 result is 2.5 - 3.5 (3 draws,min.plies 36,max.plies 120)
// In 6 matches of BNS-7 vs SUNFISH 2023 result is 1.5 - 4.5 (1 draw,min.plies 30,max.plies 108)
// In 6 matches of BNS-8 vs SUNFISH 2023 result is 1.5 - 4.5 (3 draws,min.plies 44,max.plies 140)
// In 6 matches of MCTS-10-4-500 vs SUNFISH 2023 result is 2 - 4 (4 draws,min.plies 36,max.plies 140)
// In 6 matches of MCTS-15-4-500 vs SUNFISH 2023 result is 1.5 - 4.5 (3 draws,min.plies 20,max.plies 116)
// In 6 matches of MCTS-25-4-500 vs SUNFISH 2023 result is 1.5 - 4.5 (3 draws,min.plies 36,max.plies 144)
// In 6 matches of MCTS-35-4-500 vs SUNFISH 2023 result is 1.5 - 4.5 (3 draws,min.plies 8,max.plies 148)

// In 6 matches of ABMCTS-10-5-3-100 vs SUNFISH 2023 result is 3.5 - 2.5 (3 draws,min.plies 38,max.plies 80)

// In 6 matches of MIXED(MCTS-10,MTDf) vs SUNFISH 2023 result is 1.5 - 4.5 (3 draws,min.plies 36,max.plies 111)
// In 6 matches of MIXED(MTDf,MCTS-10) vs SUNFISH 2023 result is 2 - 4 (2 draws,min.plies 40,max.plies 114)
// In 6 matches of MIXED(MCTS-15,MTDf) vs SUNFISH 2023 result is 2 - 4 (4 draws,min.plies 58,max.plies 126)
// In 6 matches of MIXED(MTDf,MCTS-15) vs SUNFISH 2023 result is 1.5 - 4.5 (1 draw,min.plies 14,max.plies 155)

const echo = console.log;
const args = (function parse_args() {
    const args = {
        PLAYER1:        'ab',
        PLAYER2:        'sunfish',
        NUM_MATCHES:    2,
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

    const supported_engines = [
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
        'stockfish'
    ];

    args.PLAYER1 = (process.argv[2] || 'ab').trim().toLowerCase();
    args.PLAYER2 = (process.argv[3] || 'sunfish').trim().toLowerCase();

    if (-1 === supported_engines.indexOf(args.PLAYER1) || -1 === supported_engines.indexOf(args.PLAYER2))
    {
        echo('Unsupported engines: '+[args.PLAYER1,args.PLAYER2].join(' vs '));
        echo('Supported engines/algorithms: '+supported_engines.join(', '));
        process.exit(1);
    }

    args.NUM_MATCHES = parseInt(process.argv[4] || '2') || 2;
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
        ++i;
    }

    return args;
})();

const ChessGame = require('./src/ChessGame.js');
const ChessSearch = require('./src/ChessSearch.js');
const engine = {
    sunfish:    null,
    stockfish:  null
};
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
    stockfish:  'STOCKFISH 18 (ELO'+String(algorithm.stockfish.elo)+')'
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
                ++plies;
                if (args.SHOW)
                {
                    output = String(plies)+'. ' + game.whoseTurn().slice(0,1) + ':' + move.from + move.to + (move.promotion || '');
                }
                game.doMove(move.from, move.to, move.promotion);
                if (args.SHOW)
                {
                    output += game.isCheck() ? ' (check)' : '';
                    echo(output);
                }
            }
            else
            {
                if (args.SHOW)
                {
                    output = String(plies+1) + '. ' + game.whoseTurn().slice(0,1) + ':nomove';
                    echo(output);
                }
                game.noMove();
            }
            if (game.isGameOver())
            {
                const winner = game.winner();
                const score = 'DRAW' === winner ? 0.5 : ('WHITE' === winner ? 1 : 0);
                game.dispose();
                return GAME_OVER(score, plies);
            }
            switch (game.whoseTurn())
            {
                case 'WHITE':
                WHITE(game, play_next);
                break;
                case 'BLACK':
                BLACK(game, play_next);
                break;
            }
        }
        const game = new ChessGame();
        let plies = 0;
        switch (game.whoseTurn())
        {
            case 'WHITE':
            WHITE(game, play_next);
            break;
            case 'BLACK':
            BLACK(game, play_next);
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
    }
    if (match < args.NUM_MATCHES)
    {
        ++match;
        if (init[args.PLAYER1]) init[args.PLAYER1]();
        if (init[args.PLAYER2]) init[args.PLAYER2]();
        if (match & 1)
        {
            echo('Playing match '+String(match)+' of '+String(args.NUM_MATCHES)+': '+player[args.PLAYER1]+' vs '+player[args.PLAYER2]+' ..');
            play_match(play[args.PLAYER1], play[args.PLAYER2], function(score_for_white, plies) {
                echo('Result after '+String(plies)+' plies: '+(0.5 === score_for_white ? '½' : String(score_for_white))+' - '+(0.5 === score_for_white ? '½' : String(1-score_for_white)));
                tournament(match, matches_won_by_p1 + score_for_white, draws+(0.5 === score_for_white ? 1 : 0), Math.min(plies, min_plies), Math.max(plies, max_plies), done);
            });
        }
        else
        {
            echo('Playing match '+String(match)+' of '+String(args.NUM_MATCHES)+': '+player[args.PLAYER2]+' vs '+player[args.PLAYER1]+' ..');
            play_match(play[args.PLAYER2], play[args.PLAYER1], function(score_for_white, plies) {
                echo('Result after '+String(plies)+' plies: '+(0.5 === score_for_white ? '½' : String(score_for_white))+' - '+(0.5 === score_for_white ? '½' : String(1-score_for_white)));
                tournament(match, matches_won_by_p1 + 1-score_for_white, draws+(0.5 === score_for_white ? 1 : 0), Math.min(plies, min_plies), Math.max(plies, max_plies), done);
            });
        }
    }
    else if (args.NUM_MATCHES)
    {
        echo('In '+String(args.NUM_MATCHES)+' '+(1 === args.NUM_MATCHES ? 'match' : 'matches')+' of '+player[args.PLAYER1]+' vs '+player[args.PLAYER2]+' result is '+String(matches_won_by_p1)+' - '+String(args.NUM_MATCHES-matches_won_by_p1)+' ('+String(draws)+' '+(1 === draws ? 'draw' : 'draws')+',min.plies '+String(min_plies)+',max.plies '+String(max_plies)+')');
        if (done) done(matches_won_by_p1, args.NUM_MATCHES-matches_won_by_p1, draws, min_plies, max_plies);
    }
}

function ready(f)
{
    if (!f.waitFor) f();
    else setTimeout(function() {ready(f);}, 100);
}

function go()
{
    tournament();
}
go.waitFor = 0;

if (-1 < [args.PLAYER1,args.PLAYER2].indexOf('sunfish'))
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

if (-1 < [args.PLAYER1,args.PLAYER2].indexOf('stockfish'))
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