/**
*  ChessBoard
*  A chess board for HTML
*  https://github.com/foo123/Chess
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

function ChessBoard(container, get_piece_at)
{
    var self = this;
    self.make = function()  {
        var nt, nb, nl, nr, span, i, j, squares, square, piece;
        container.textContent = '';
        addClass(container, 'chessboard');
        squares = $$('div');
        addClass(squares, 'chessboard-squares');
        container.appendChild(squares);
        nt = $$('div');
        addClass(nt, 'chessboard-numbers');
        addClass(nt, 'top');
        container.appendChild(nt);
        nb = $$('div');
        addClass(nb, 'chessboard-numbers');
        addClass(nb, 'bottom');
        container.appendChild(nb);
        nl = $$('div');
        addClass(nl, 'chessboard-numbers');
        addClass(nl, 'left');
        container.appendChild(nl);
        nr = $$('div');
        addClass(nr, 'chessboard-numbers');
        addClass(nr, 'right');
        container.appendChild(nr);
        for (i=8; i>=1; --i)
        {
            span = $$('span');
            span.textContent = String(i);
            span.style.setProperty('--x', '0');
            span.style.setProperty('--y', String(8-i));
            nl.appendChild(span);

            span = $$('span');
            span.textContent = String(i);
            span.style.setProperty('--x', '0');
            span.style.setProperty('--y', String(8-i));
            nr.appendChild(span);

            span = $$('span');
            span.textContent = String.fromCharCode('a'.charCodeAt(0) + 8-i);
            span.style.setProperty('--y', '0');
            span.style.setProperty('--x', String(8-i));
            nt.appendChild(span);

            span = $$('span');
            span.textContent = String.fromCharCode('a'.charCodeAt(0) + 8-i);
            span.style.setProperty('--y', '0');
            span.style.setProperty('--x', String(8-i));
            nb.appendChild(span);

            for (j=0; j<8; ++j)
            {
                square = $$('div');
                square.id = String.fromCharCode('a'.charCodeAt(0) + j)+''+String(i);
                square.style.setProperty('--x', String(j));
                square.style.setProperty('--y', String(8-i));
                addClass(square, 'square');
                addClass(square, i & 1 ? (j & 1 ? 'white' : 'black') : (j & 1 ? 'black' : 'white'));
                if (get_piece_at)
                {
                    piece = get_piece(get_piece_at(square.id));
                    if (piece) add(square, piece);
                }
                squares.appendChild(square);
            }
        }
    };
    self.container = function() {
        return container;
    };
    self.doMove = function(piece, square1, square2) {
        if ((square1=get_square(square1)) && (square2=get_square(square2)) && (piece = get_piece(piece)))
        {
            move(piece, square1, square2);

            if ('PAWN' === piece.type)
            {
                // handle en passants
                if ('BLACK' === piece.color && '3' === square2.id.charAt(1))
                {
                    maybe_remove(el(square2.id.charAt(0)+'4'), get_piece_at(square2.id.charAt(0)+'4'));
                }
                if ('WHITE' === piece.color && '6' === square2.id.charAt(1))
                {
                    maybe_remove(el(square2.id.charAt(0)+'5'), get_piece_at(square2.id.charAt(0)+'5'));
                }
            }

            if ('KING' === piece.type)
            {
                if ('e1' === square1.id)
                {
                    if ('g1' === square2.id)
                    {
                        // kingside castling white
                        move(get_piece_at('f1'), el('h1'), el('f1'));
                    }
                    else if ('c1' === square2.id)
                    {
                        // queenside castling white
                        move(get_piece_at('d1'), el('a1'), el('d1'));
                    }
                }
                else if ('e8' === square1.id)
                {
                    if ('g8' === square2.id)
                    {
                        // kingside castling black
                        move(get_piece_at('f8'), el('h8'), el('f8'));
                    }
                    else if ('c8' === square2.id)
                    {
                        // queenside castling black
                        move(get_piece_at('d8'), el('a8'), el('d8'));
                    }
                }
            }
        }
    };
    self.undoMove = function(piece, otherpiece, square1, square2) {
        if ((square1=get_square(square1)) && (square2=get_square(square2)))
        {
            empty(square1);
            empty(square2);
            piece = get_piece(piece);
            otherpiece = get_piece(otherpiece);
            if (piece) add(square1, piece);
            if (otherpiece) add(square2, otherpiece);

            if (piece)
            {
                if ('PAWN' === piece.type)
                {
                    // handle en passants
                    if ('BLACK' === piece.color && '3' === square2.id.charAt(1))
                    {
                        add(el(square2.id.charAt(0)+'4'), get_piece_at(square2.id.charAt(0)+'4'));
                    }
                    if ('WHITE' === piece.color && '6' === square2.id.charAt(1))
                    {
                        add(el(square2.id.charAt(0)+'5'), get_piece_at(square2.id.charAt(0)+'5'));
                    }
                }

                if ('KING' === piece.type)
                {
                    if ('e1' === square1.id)
                    {
                        if ('g1' === square2.id)
                        {
                            // kingside castling white
                            move(get_piece_at('h1'), el('f1'), el('h1'));
                        }
                        else if ('c1' === square2.id)
                        {
                            // queenside castling white
                            move(get_piece_at('a1'), el('d1'), el('a1'));
                        }
                    }
                    else if ('e8' === square1.id)
                    {
                        if ('g8' === square2.id)
                        {
                            // kingside castling black
                            move(get_piece_at('h8'), el('f8'), el('h8'));
                        }
                        else if ('c8' === square2.id)
                        {
                            // queenside castling black
                            move(get_piece_at('a8'), el('d8'), el('a8'));
                        }
                    }
                }
            }
        }
    };
    self.showPossibleMoves = function(moves) {
        moves.forEach(function(m) {addClass(el(m), 'active');});
    };
    self.clearPossibleMoves = function() {
        $('.square.active', container).forEach(function(s) {removeClass(s, 'active');});
    };
}

// utils
function get_square(square)
{
    if ("string" === typeof square) square = el(square);
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
        else if (!piece.type || (-1 === (['KING','QUEEN','BISHOP','KNIGHT','ROOK','PAWN']).indexOf(String(piece.type).toUpperCase())))
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
}
function add(square, piece)
{
    addClass(square, ('BLACK' === piece.color ? 'b-' : 'w-') + piece.type.toLowerCase());
    addClass(square, 'piece');
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
function el(id)
{
    return document.getElementById(id);
}
function $(sel, el)
{
    return Array.prototype.slice.call((el || document).querySelectorAll(sel) || []);
}
function $$(tag)
{
    return document.createElement(tag);
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
