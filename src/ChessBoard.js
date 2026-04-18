/**
*  ChessBoard
*  A chess board for HTML
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

function ChessBoard(container, squares, container_moves, moves)
{
    var self = this;
    self.make = function(get_piece_at)  {
        var nt, nb, nl, nr, span, i, j, square, piece;
        container.textContent = '';
        addClass(container, 'chessboard');
        addClass(squares, 'chessboard-squares');
        container.appendChild(squares);
        if (container_moves && moves)
        {
            addClass(moves, 'chessboard-moves');
            container_moves.textContent = '';
            container_moves.appendChild(moves);
        }
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
                    piece = get_piece_at(square.id);
                    if (piece)
                    {
                        addClass(square, ('BLACK' === piece.color ? 'b-' : 'w-')+piece.type.toLowerCase());
                        addClass(square, 'piece');
                    }
                }
                squares.appendChild(square);
            }
        }
    };
    self.empty = function(square) {
        if (square)
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
    };
    self.add = function(square, piece) {
        if (square && piece)
        {
            addClass(square, ('BLACK' === piece.color ? 'b-' : 'w-')+piece.type.toLowerCase());
            addClass(square, 'piece');
        }
    };
    self.move = function(piece, square1, square2) {
        self.empty(square1);
        self.empty(square2);
        self.add(square2, piece);
    };
    self.maybe_remove = function(square, piece) {
        if (square && !piece) self.empty(square);
    };
    self.show_possible_moves = function(moves) {
        moves.forEach(function(m) {addClass(el(m), 'active');});
    };
    self.clear_possible_moves = function() {
        $('.square.active', container).forEach(function(s) {removeClass(s, 'active');});
    };
}

// utils
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
function hasEventOptions()
{
    if (null == hasEventOptions.supported)
    {
        var passiveSupported = false, options = {};
        try {
            Object.defineProperty(options, 'passive', {
                get: function(){
                    passiveSupported = true;
                    return false;
                }
            });
            window.addEventListener('test', null, options);
            window.removeEventListener('test', null, options);
        } catch(e) {
            passiveSupported = false;
        }
        hasEventOptions.supported = passiveSupported;
    }
    return hasEventOptions.supported;
}
function addEvent(target, event, handler, options)
{
    if (target.attachEvent) target.attachEvent('on' + event, handler);
    else target.addEventListener(event, handler, hasEventOptions() ? options : ('object' === typeof(options) ? !!options.capture : !!options));
}
function removeEvent(target, event, handler, options)
{
    // if (el.removeEventListener) not working in IE11
    if (target.detachEvent) target.detachEvent('on' + event, handler);
    else target.removeEventListener(event, handler, hasEventOptions() ? options : ('object' === typeof(options) ? !!options.capture : !!options));
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
