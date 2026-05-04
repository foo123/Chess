/**
*  ChessBoard
*  A chess board for HTML and Terminal
*  https://github.com/foo123/chess.js
*  @VERSION: 1.0.0
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
}('undefined' !== typeof self ? self : this, 'ChessBoard', function(undef) {
"use strict";

function ChessBoard(get_piece_at)
{
    var self = this;

    if (!(self instanceof ChessBoard)) return new ChessBoard(get_piece_at);
    if ("function" !== typeof get_piece_at) get_piece_at = null;

    self.dispose = function() {
        get_piece_at = null;
    };
    self.toHTML = function(container, forPlayer)  {
        if (!container) return;
        forPlayer = String(forPlayer || "white").toLowerCase();
        var nt, nb, nl, nr, span, ii, i, jj, j, squares, square, piece;

        container.textContent = '';
        addClass(container, 'chessboard');

        // squares
        squares = create('div');
        addClass(squares, 'chessboard-squares');
        container.appendChild(squares);

        // top numbering
        nt = create('div');
        addClass(nt, 'chessboard-numbers');
        addClass(nt, 'top');
        container.appendChild(nt);

        // bottom numbering
        nb = create('div');
        addClass(nb, 'chessboard-numbers');
        addClass(nb, 'bottom');
        container.appendChild(nb);

        // left numbering
        nl = create('div');
        addClass(nl, 'chessboard-numbers');
        addClass(nl, 'left');
        container.appendChild(nl);

        // right numbering
        nr = create('div');
        addClass(nr, 'chessboard-numbers');
        addClass(nr, 'right');
        container.appendChild(nr);

        for (ii=8; ii>=1; --ii)
        {
            i = "black" === forPlayer ? 9-ii : ii;
            span = create('span');
            span.textContent = String(i);
            span.style.setProperty('--x', '0');
            span.style.setProperty('--y', String(8-i));
            nl.appendChild(span);

            span = create('span');
            span.textContent = String(i);
            span.style.setProperty('--x', '0');
            span.style.setProperty('--y', String(8-i));
            nr.appendChild(span);

            span = create('span');
            span.textContent = String.fromCharCode('a'.charCodeAt(0) + 8-i);
            span.style.setProperty('--y', '0');
            span.style.setProperty('--x', String(8-i));
            nt.appendChild(span);

            span = create('span');
            span.textContent = String.fromCharCode('a'.charCodeAt(0) + 8-i);
            span.style.setProperty('--y', '0');
            span.style.setProperty('--x', String(8-i));
            nb.appendChild(span);

            for (jj=0; jj<8; ++jj)
            {
                j = "black" === forPlayer ? 7-jj : jj;
                square = create('button');
                square.id = String.fromCharCode('a'.charCodeAt(0) + j)+''+String(i);
                square.style.setProperty('--x', String(j));
                square.style.setProperty('--y', String(8-i));
                addClass(square, 'square');
                addClass(square, i & 1 ? (j & 1 ? 'white' : 'black') : (j & 1 ? 'black' : 'white'));
                attr(square, 'title', 'square '+square.id+' is empty');
                if (get_piece_at && (piece = get_piece(get_piece_at(square.id))))
                {
                    add(square, piece);
                }
                squares.appendChild(square);
            }
        }
    };
    self.toString = function(type, forPlayer, pieceset) {
        type = String(type || "ascii").toLowerCase();
        forPlayer = String(forPlayer || "white").toLowerCase();
        if (pieceset)
        {
            if (pieceset.white && pieceset.black)
            {
                // pass
            }
            else if (pieceset.pawn && pieceset.king)
            {
                pieceset = {white: pieceset, black: pieceset};
            }
            else
            {
                pieceset = null;
            }
        }
        if (!pieceset)
        {
            if ("terminal" === type)
            {
                pieceset = {
                    white: {
                        pawn: "\u2659",
                        rook: "\u265C",
                        knight: "\u265E",
                        bishop: "\u265D",
                        queen: "\u265B",
                        king: "\u265A"
                    },
                    black: {
                        pawn: "\u2659",
                        rook: "\u265C",
                        knight: "\u265E",
                        bishop: "\u265D",
                        queen: "\u265B",
                        king: "\u265A"
                    }
                };
            }
            else
            {
                pieceset = {
                    white: {
                        pawn: "P",
                        rook: "R",
                        knight: "N",
                        bishop: "B",
                        queen: "Q",
                        king: "K"
                    },
                    black: {
                        pawn: "p",
                        rook: "r",
                        knight: "n",
                        bishop: "b",
                        queen: "q",
                        king: "k"
                    }
                };
            }
        }
        var ii, i, jj, j, k,
            square, square_color,
            piece, out = '';
        out += '  ';
        for (i=0; i<8; ++i)
        {
            out += '  ' + String.fromCharCode('a'.charCodeAt(0) + ("black" === forPlayer ? 7-i : i)) + '  ';
        }
        for (ii=8; ii>=1; --ii)
        {
            i = "black" === forPlayer ? 9-ii : ii;
            for (k=-1; k<=1; ++k)
            {
                out += "\n";
                out += String(k ? ' ' : i) + ' ';
                for (jj=0; jj<8; ++jj)
                {
                    j = "black" === forPlayer ? 7-jj : jj;
                    square = String.fromCharCode('a'.charCodeAt(0) + j)+''+String(i);
                    square_color = i & 1 ? (j & 1 ? 'white' : 'black') : (j & 1 ? 'black' : 'white');
                    if (k)
                    {
                        if ("terminal" === type)
                        {
                            out += "\x1b[" + ('black' === square_color ? /*'41'*/'48;2;119;97;63' : /*'43''103'*/'48;2;225;183;119') + "m     \x1b[0m";
                        }
                        else
                        {
                            out += 'black' === square_color ? '#####' : '     ';
                        }
                    }
                    else
                    {
                        if (get_piece_at && (piece = get_piece(get_piece_at(square))))
                        {
                            if ("terminal" === type)
                            {
                                out += "\x1b[" + ('black' === piece.color.toLowerCase() ? '30' : '1;37') + ";" + ('black' === square_color ? /*'41'*/'48;2;119;97;63' : /*'43''103'*/'48;2;225;183;119') + "m  " + (pieceset[piece.color.toLowerCase()][piece.type.toLowerCase()] || ' ') + "  \x1b[0m";
                            }
                            else
                            {
                                out += ('black' === square_color ? '# ' : '  ') + (pieceset[piece.color.toLowerCase()][piece.type.toLowerCase()] || ' ') + ('black' === square_color ? ' #' : '  ');
                            }
                        }
                        else
                        {
                            if ("terminal" === type)
                            {
                                out += "\x1b[" + ('black' === square_color ? /*'41'*/'48;2;119;97;63' : /*'43''103'*/'48;2;225;183;119') + "m     \x1b[0m";
                            }
                            else
                            {
                                out += 'black' === square_color ? '#####' : '     ';
                            }
                        }
                    }
                }
                out += ' ' + String(k ? ' ' : i);
            }
        }
        out += "\n";
        out += '  ';
        for (i=0; i<8; ++i)
        {
            out += '  ' + String.fromCharCode('a'.charCodeAt(0) + ("black" ===forPlayer ? 7-i : i)) + '  ';
        }
        return out;
    };
    self.doMove = function(square1, square2) {
        var piece = null;
        if (get_piece_at && (square1=get_square(square1)) && (square2=get_square(square2)) && (piece = get_piece(get_piece_at(square2.id))))
        {
            move(piece, square1, square2);

            if ('PAWN' === piece.type)
            {
                // handle en passants
                if ('BLACK' === piece.color && '3' === square2.id.charAt(1))
                {
                    maybe_remove(get_square(square2.id.charAt(0)+'4'), get_piece(get_piece_at(square2.id.charAt(0)+'4')));
                }
                if ('WHITE' === piece.color && '6' === square2.id.charAt(1))
                {
                    maybe_remove(get_square(square2.id.charAt(0)+'5'), get_piece(get_piece_at(square2.id.charAt(0)+'5')));
                }
            }

            if ('KING' === piece.type)
            {
                if ('e1' === square1.id)
                {
                    if ('g1' === square2.id)
                    {
                        // kingside castling white
                        move(get_piece(get_piece_at('f1')), get_square('h1'), get_square('f1'));
                    }
                    else if ('c1' === square2.id)
                    {
                        // queenside castling white
                        move(get_piece(get_piece_at('d1')), get_square('a1'), get_square('d1'));
                    }
                }
                else if ('e8' === square1.id)
                {
                    if ('g8' === square2.id)
                    {
                        // kingside castling black
                        move(get_piece(get_piece_at('f8')), get_square('h8'), get_square('f8'));
                    }
                    else if ('c8' === square2.id)
                    {
                        // queenside castling black
                        move(get_piece(get_piece_at('d8')), get_square('a8'), get_square('d8'));
                    }
                }
            }
        }
    };
    self.undoMove = function(piece, removed_piece, square1, square2) {
        if (get_piece_at && (square1=get_square(square1)) && (square2=get_square(square2)))
        {
            empty(square1);
            empty(square2);
            piece = get_piece(piece);
            removed_piece = get_piece(removed_piece);
            if (piece) add(square1, piece);
            if (removed_piece) add(square2, removed_piece);

            if (piece)
            {
                if ('PAWN' === piece.type)
                {
                    // handle en passants
                    if ('BLACK' === piece.color && '3' === square2.id.charAt(1))
                    {
                        add(get_square(square2.id.charAt(0)+'4'), get_piece(get_piece_at(square2.id.charAt(0)+'4')));
                    }
                    if ('WHITE' === piece.color && '6' === square2.id.charAt(1))
                    {
                        add(get_square(square2.id.charAt(0)+'5'), get_piece(get_piece_at(square2.id.charAt(0)+'5')));
                    }
                }

                if ('KING' === piece.type)
                {
                    if ('e1' === square1.id)
                    {
                        if ('g1' === square2.id)
                        {
                            // kingside castling white
                            move(get_piece(get_piece_at('h1')), get_square('f1'), get_square('h1'));
                        }
                        else if ('c1' === square2.id)
                        {
                            // queenside castling white
                            move(get_piece(get_piece_at('a1')), get_square('d1'), get_square('a1'));
                        }
                    }
                    else if ('e8' === square1.id)
                    {
                        if ('g8' === square2.id)
                        {
                            // kingside castling black
                            move(get_piece(get_piece_at('h8')), get_square('f8'), get_square('h8'));
                        }
                        else if ('c8' === square2.id)
                        {
                            // queenside castling black
                            move(get_piece(get_piece_at('a8')), get_square('d8'), get_square('a8'));
                        }
                    }
                }
            }
        }
    };
    self.showPossibleMoves = function(moves, start) {
        moves.forEach(function(move) {
            var square = get_square(move.length > 2 ? move.slice(0, 2) : move);
            addClass(square, 'active');
            if (square !== start) attr(square, 'title', attr(square, 'title')+' (a move here from '+start.id+' is possible)');
        });
    };
    self.clearPossibleMoves = function(container) {
        if (!container) return;
        query('.square.active', container).forEach(function(square) {
            attr(removeClass(square, 'active'), 'title', attr(square, 'title').split(' (')[0]);
        });
    };
}
ChessBoard.prototype = {
    constructor: ChessBoard,
    dispose: null,
    toHTML: null,
    toString: null,
    doMove: null,
    undoMove: null,
    showPossibleMoves: null,
    clearPossibleMoves: null
};

// utils
function get_square(square)
{
    if ("string" === typeof square) square = get(square);
    return square || null;
}
function get_piece(piece)
{
    if (piece)
    {
        if ("string" === typeof piece)
        {
            switch (piece.toUpperCase())
            {
                case 'P':
                piece = {color:'p' === piece ? 'BLACK' : 'WHITE', type:'PAWN'};
                break;

                case 'R':
                piece = {color:'r' === piece ? 'BLACK' : 'WHITE', type:'ROOK'};
                break;

                case 'N':
                piece = {color:'n' === piece ? 'BLACK' : 'WHITE', type:'KNIGHT'};
                break;

                case 'B':
                piece = {color:'b' === piece ? 'BLACK' : 'WHITE', type:'BISHOP'};
                break;

                case 'Q':
                piece = {color:'q' === piece ? 'BLACK' : 'WHITE', type:'QUEEN'};
                break;

                case 'K':
                piece = {color:'k' === piece ? 'BLACK' : 'WHITE', type:'KING'};
                break;

                default:
                piece = null;
                break;
            }
        }
        else if (!piece.type || (-1 === (['KING','QUEEN','BISHOP','KNIGHT','ROOK','PAWN']).indexOf(String(piece.type).toUpperCase())) || (-1 === (['WHITE','BLACK']).indexOf(String(piece.color).toUpperCase())))
        {
            piece = null;
        }
    }
    return piece || null;
}
function empty(square)
{
    removeClass(square, 'piece');
    removeClass(square, 'w-pawn');
    removeClass(square, 'b-pawn');
    removeClass(square, 'w-rook');
    removeClass(square, 'b-rook');
    removeClass(square, 'w-knight');
    removeClass(square, 'b-knight');
    removeClass(square, 'w-bishop');
    removeClass(square, 'b-bishop');
    removeClass(square, 'w-queen');
    removeClass(square, 'b-queen');
    removeClass(square, 'w-king');
    removeClass(square, 'b-king');
    attr(square, 'title', 'square '+square.id+' is empty');
}
function add(square, piece)
{
    addClass(square, ('BLACK' === piece.color ? 'b-' : 'w-') + piece.type.toLowerCase());
    addClass(square, 'piece');
    attr(square, 'title', piece.color+' '+piece.type+' on square '+square.id);
}
function move(piece, square1, square2)
{
    empty(square1);
    empty(square2);
    add(square2, piece);
}
function maybe_remove(square, piece)
{
    if (square && !piece) empty(square);
}
function query(sel, el)
{
    return Array.prototype.slice.call((el || document).querySelectorAll(sel) || []);
}
function get(id)
{
    return document.getElementById(id);
}
function create(tag)
{
    return document.createElement(tag);
}
function attr(el, att, val)
{
    if (3 === arguments.length)
    {
        el.setAttribute(att, String(val));
        return el;
    }
    return el.getAttribute(att);
}
function hasClass(el, className)
{
    if (el)
    {
        return el.classList
            ? el.classList.contains(className)
            : -1 !== (' ' + el.className + ' ').indexOf(' ' + className + ' ')
        ;
    }
}
function addClass(el, className)
{
    if (el)
    {
        if (el.classList) el.classList.add(className);
        else if (!hasClass(el, className)) el.className = '' === el.className ? className : (el.className + ' ' + className);
    }
    return el;
}
function removeClass(el, className)
{
    if (el)
    {
        if (el.classList) el.classList.remove(className);
        else el.className = ((' ' + el.className + ' ').replace(' ' + className + ' ', ' ')).trim();
    }
    return el;
}

// export it
ChessBoard.VERSION = "1.0.0";
return ChessBoard;
});
