"use strict";

// use: node tournament.js [stockfish|sunfish|ab|mtdf|bns|mcts|abmcts|mtdfmcts] [stockfish|sunfish|ab|mtdf|bns|mcts|abmcts|mtdfmcts] nmatches --depth=DEPTH --playout=PLAYOUT --iter=ITER --uct=UCT --deepen --show --elo=ELO

// In tournament of 10 match(es) between STOCKFISH 16.1 (ELO1900) and SUNFISH 2023 result is 8 - 2 (min.moves 46,max.moves 128)
// In tournament of 10 match(es) between STOCKFISH 18 (ELO1900) and SUNFISH 2023 result is 7 - 3 (min.moves 36,max.moves 86)

// In tournament of 4 match(es) between AB-245-d and SUNFISH 2023 result is 1.5 - 2.5 (min.moves 12,max.moves 127)

// In tournament of 5 match(es) between MTD(f)-245-d and SUNFISH 2023 result is 1.5 - 3.5 (min.moves 26,max.moves 106)

// In tournament of 10 match(es) between BNS-7 and SUNFISH 2023 result is 3 - 7 (min.moves 26,max.moves 106)

// In tournament of 10 match(es) between MCTS-25-2-500 and SUNFISH 2023 result is 5 - 5 (min.moves 26,max.moves 123)
// In tournament of 10 match(es) between MCTS-25-3-500 and SUNFISH 2023 result is 4.5 - 5.5 (min.moves 8,max.moves 150)
// In tournament of 10 match(es) between MCTS-25-5-500 and SUNFISH 2023 result is 5.5 - 4.5 (min.moves 38,max.moves 130)
// In tournament of 10 match(es) between MCTS-25-2-500 and SUNFISH 2023 result is 3 - 7 (min.moves 46,max.moves 106)
// In tournament of 10 match(es) between MCTS-35-5-800 and SUNFISH 2023 result is 5.5 - 4.5 (min.moves 32,max.moves 112)

// In tournament of 4 match(es) between ABMCTS-25-3-0-100 and SUNFISH 2023 result is 3 - 1 (min.moves 20,max.moves 76)
// In tournament of 10 match(es) between ABMCTS-25-3-0-100 and SUNFISH 2023 result is 5 - 5 (min.moves 34,max.moves 174)
// In tournament of 10 match(es) between ABMCTS-25-3-4-200 and SUNFISH 2023 result is 6.5 - 3.5 (min.moves 44,max.moves 134)
// In tournament of 10 match(es) between ABMCTS-25-3-4-300 and SUNFISH 2023 result is 6 - 4 (min.moves 48,max.moves 138)

// In tournament of 6 match(es) between AB-245-d and MCTS-25-4-500 result is 0 - 6 (min.moves 9,max.moves 59)
// In tournament of 5 match(es) between ABMCTS-25-3-4-300 and MCTS-25-4-300 result is 5 - 0 (min.moves 9,max.moves 59)

const args = (function parse_args() {
    const args = {
        PLAYER1:        'mcts',
        PLAYER2:        'ab',
        NUM_MATCHES:    2,
        DEPTH:          3,
        PLAYOUT:        Infinity,
        UCT:            0,
        ITER:           100,
        DEEPEN:         false,
        SHOW:           false,
        ELO:            1500
    };

    const supported_engines = [
        'ab',
        'mtdf',
        'bns',
        'mcts',
        'abmcts',
        'mtdfmcts',
        'sunfish',
        'stockfish'
    ];

    args.PLAYER1 = (process.argv[2] || 'mcts').trim().toLowerCase();
    args.PLAYER2 = (process.argv[3] || 'ab').trim().toLowerCase();

    if (-1 === supported_engines.indexOf(args.PLAYER1) || -1 === supported_engines.indexOf(args.PLAYER2))
    {
        console.log('Unsupported engine(s): '+[args.PLAYER1,args.PLAYER2].join(' vs '));
        console.log('Supported engines/algorithms: '+supported_engines.join(', '));
        process.exit(1);
    }

    args.NUM_MATCHES = parseInt(process.argv[4] || '2') || 2;
    let i = 5;
    while (process.argv.length > i)
    {
        if ('--depth=' === process.argv[i].slice(0, 8).toLowerCase()) args.DEPTH = parseInt(process.argv[i].slice(8).trim()) || 0;
        if ('--playout=' === process.argv[i].slice(0, 10).toLowerCase()) args.PLAYOUT = parseInt(process.argv[i].slice(10).trim()) || 0;
        if ('--uct=' === process.argv[i].slice(0, 6).toLowerCase()) args.UCT = parseInt(process.argv[i].slice(6).trim()) || 0;
        if ('--iter=' === process.argv[i].slice(0, 7).toLowerCase()) args.ITER = parseInt(process.argv[i].slice(7).trim()) || 100;
        if ('--deepen' === process.argv[i].slice(0, 8).toLowerCase()) args.DEEPEN = true;
        if ('--show' === process.argv[i].toLowerCase()) args.SHOW = true;
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
const opts = {
    ab:        {algo:"ab", iterativedeepening:true, depth:245, time:10000},
    mtdf:      {algo:"mtdf", iterativedeepening:true, depth:245, time:10000},
    bns:       {algo:"bns", iterativedeepening:args.DEEPEN, depth:args.DEPTH, time:10000},
    mcts:      {algo:"mcts", iterations:args.ITER, uct:args.UCT, depth:args.DEPTH, time:10000},
    abmcts:    {algo:"ab", playout:args.PLAYOUT, iterations:args.ITER, uct:args.UCT, depth:args.DEPTH, time:10000},
    mtdfmcts:  {algo:"mtdf", playout:args.PLAYOUT, iterations:args.ITER, uct:args.UCT, depth:args.DEPTH, time:10000},
    sunfish:   {depth:245, time:10000},
    stockfish: {elo:args.ELO, depth:245, time:10000}
};

const init = {
    ab: function() {
    },
    mtdf: function() {
    },
    bns: function() {
    },
    mcts: function() {
    },
    abmcts: function() {
    },
    mtdfmcts: function() {
    },
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
        then((new ChessSearch.HybridSearch(game, opts.ab)).bestMove(game.getBoard().turn));
    },
    mtdf: function(game, then) {
        then((new ChessSearch.HybridSearch(game, opts.mtdf)).bestMove(game.getBoard().turn));
    },
    bns: function(game, then) {
        then((new ChessSearch.HybridSearch(game, opts.bns)).bestMove(game.getBoard().turn));
    },
    mcts: function(game, then) {
        then((new ChessSearch.HybridSearch(game, opts.mcts)).bestMove(game.getBoard().turn));
    },
    abmcts: function(game, then) {
        then((new ChessSearch.HybridSearch(game, opts.abmcts)).bestMove(game.getBoard().turn));
    },
    mtdfmcts: function(game, then) {
        then((new ChessSearch.HybridSearch(game, opts.mtdfmcts)).bestMove(game.getBoard().turn));
    },
    sunfish: function(game, then) {
        engine.sunfish.sendCMD('position startpos moves ' + game.getMovesUpToNow().join(' '));
        engine.sunfish.sendCMD('go ' + (opts.sunfish.depth ? ('depth ' + String(opts.sunfish.depth)) : '') + (opts.sunfish.time ? ('wtime ' + String(opts.sunfish.time) + ' btime ' + String(opts.sunfish.time)) : ''), then);
    },
    stockfish: function(game, then) {
        engine.stockfish.move = then;
        engine.stockfish.sendCMD('position startpos moves ' + game.getMovesUpToNow().join(' '));
        engine.stockfish.sendCMD('go ' + (opts.stockfish.depth ? ('depth ' + String(opts.stockfish.depth)) : '') + (opts.stockfish.time ? ('wtime ' + String(opts.stockfish.time) + ' btime ' + String(opts.stockfish.time)) : ''));
    }
};
const player = {
    ab:         'AB-'+String(opts.ab.depth)+(opts.ab.iterativedeepening ? '-d' : ''),
    mtdf:       'MTD(f)-'+String(opts.mtdf.depth)+(opts.mtdf.iterativedeepening ? '-d' : ''),
    bns:        'BNS-'+String(opts.bns.depth)+(opts.bns.iterativedeepening ? '-d' : ''),
    mcts:       'MCTS-'+String(opts.mcts.depth)+'-'+String(opts.mcts.uct)+'-'+String(opts.mcts.iterations),
    abmcts:     'ABMCTS-'+String(opts.abmcts.depth)+'-'+String(opts.abmcts.playout)+'-'+String(opts.abmcts.uct)+'-'+String(opts.abmcts.iterations),
    mtdfmcts:   'MTDMCTS-'+String(opts.mtdfmcts.depth)+'-'+String(opts.mtdfmcts.playout)+'-'+String(opts.mtdfmcts.uct)+'-'+String(opts.mtdfmcts.iterations),
    stockfish:  'STOCKFISH 18 (ELO'+String(opts.stockfish.elo)+')',
    sunfish:    'SUNFISH 2023'
};

function tournament(match, matches_won_by_p1, min_plies, max_plies, done)
{
    function play_match(WHITE, BLACK, GAME_OVER)
    {
        function play_next(move)
        {
            if (move)
            {
                ++plies;
                if (args.SHOW) console.log(String(plies)+'. '+game.whoseTurn().slice(0,1)+':'+move.from+move.to+(move.promotion||''));
                game.doMove(move.from, move.to, move.promotion);
            }
            else
            {
                if (args.SHOW) console.log(String(plies+1)+'. '+game.whoseTurn().slice(0,1)+':nomove');
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
            //engine.stockfish.sendCMD('setoption name Skill Level value ' + String(opts.stockfish.skill));
            engine.stockfish.sendCMD('setoption name UCI_LimitStrength value true');
            engine.stockfish.sendCMD('setoption name UCI_Elo value ' + String(opts.stockfish.elo));
        }
        match = 0;
        matches_won_by_p1 = 0;
        min_plies = 1e6;
        max_plies = 0;
    }
    if (match < args.NUM_MATCHES)
    {
        ++match;
        init[args.PLAYER1]();
        init[args.PLAYER2]();
        if (match & 1)
        {
            console.log('Playing match '+String(match)+' of '+String(args.NUM_MATCHES)+': '+player[args.PLAYER1]+' vs '+player[args.PLAYER2]+' ..');
            play_match(play[args.PLAYER1], play[args.PLAYER2], function(score_for_white, plies) {
                console.log('Result after '+String(plies)+' moves: '+(0.5 === score_for_white ? '½' : String(score_for_white))+' - '+(0.5 === score_for_white ? '½' : String(1-score_for_white)));
                tournament(match, matches_won_by_p1 + score_for_white, Math.min(plies, min_plies), Math.max(plies, max_plies), done);
            });
        }
        else
        {
            console.log('Playing match '+String(match)+' of '+String(args.NUM_MATCHES)+': '+player[args.PLAYER2]+' vs '+player[args.PLAYER1]+' ..');
            play_match(play[args.PLAYER2], play[args.PLAYER1], function(score_for_white, plies) {
                console.log('Result after '+String(plies)+' moves: '+(0.5 === score_for_white ? '½' : String(score_for_white))+' - '+(0.5 === score_for_white ? '½' : String(1-score_for_white)));
                tournament(match, matches_won_by_p1 + 1-score_for_white, Math.min(plies, min_plies), Math.max(plies, max_plies), done);
            });
        }
    }
    else if (args.NUM_MATCHES)
    {
        console.log('In tournament of '+String(args.NUM_MATCHES)+' match(es) between '+player[args.PLAYER1]+' and '+player[args.PLAYER2]+' result is '+String(matches_won_by_p1)+' - '+String(args.NUM_MATCHES-matches_won_by_p1)+' (min.moves '+String(min_plies)+',max.moves '+String(max_plies)+')');
        if (done) done(matches_won_by_p1, args.NUM_MATCHES-matches_won_by_p1, min_plies, max_plies);
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
                console.log(output);
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
                console.log("Got line ("+(typeof output)+"):", output);
            }
            /*else if ('info ' === output.slice(0, 5))
            {
                console.log(output);
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