// identicon.js - Identicon rendering class
// 
// hgwrsgr@gmail.com (2009-11-14)
// http://www.moreslowly.jp/products/identicon/
// http://github.com/hgwr/identicon
// 
// Based on Jeff Atwood's C# Code
// Identicon-sample-vs-2005-v13/App_Code/IdenticonRenderer.cs
// http://www.codinghorror.com/blog/archives/000774.html
//
// IE8 needs ExplorerCanvas (http://excanvas.sourceforge.net/)
//
// Sample Code
//
//   HTML
//   
//     <!--[if IE]><script type="text/javascript" src="excanvas.js"></script><![endif]-->
//     <script type="text/javascript" src="identicon.js"></script>
//
//   JavaScript
//   
//     canvas = document.createElement('canvas');
//     canvas.setAttribute("width", size);
//     canvas.setAttribute("height", size);
//     document.body.appendChild(canvas);
//     if (typeof G_vmlCanvasManager != "undefined") {
//         canvas = G_vmlCanvasManager.initElement(canvas);
//     }
//     code = Math.round(Math.random() * Math.pow(2, 32));
//     new Identicon(canvas, code, size);
//     

var Identicon = function (canvas, code, size) {
    this.PATCH_GRIDS = this.PATCH_CELLS + 1;
    this.patchFlags = [ this.PATCH_SYMMETRIC, 0, 0, 0, this.PATCH_SYMMETRIC, 0, 0, 0,
                        this.PATCH_SYMMETRIC, 0, 0, 0, 0, 0, 0, (this.PATCH_SYMMETRIC + this.PATCH_INVERTED) ];

    this.setPatchSize(size);
    this.render(canvas, code);
};

Identicon.prototype = {
    // Each "patch" in an Identicon is a polygon created from a list of vertices on a 5 by 5 grid.
    // Vertices are numbered from 0 to 24, starting from top-left corner of
    // the grid, moving left to right and top to bottom.
    PATCH_CELLS: 4,
    PATCH_SYMMETRIC: 1,
    PATCH_INVERTED: 2,
    DEFAULT_PATCH_SIZE: 20,
    MAX_SIZE: 512,
    MIN_SIZE: 16,

    patchTypes: [ [ 0, 4, 24, 20, 0 ],
                  [ 0, 4, 20, 0 ],
                  [ 2, 24, 20, 2 ],
                  [ 0, 2, 22, 20, 0 ],
                  [ 2, 14, 22, 10, 2 ],
                  [ 0, 14, 24, 22, 0 ],
                  [ 2, 24, 22, 13, 11, 22, 20, 2 ],
                  [ 0, 14, 22, 0 ],
                  [ 6, 8, 18, 16, 6 ],
                  [ 4, 20, 10, 12, 2, 4 ],
                  [ 0, 2, 12, 10, 0 ],
                  [ 10, 14, 22, 10 ],
                  [ 20, 12, 24, 20 ],
                  [ 10, 2, 12, 10 ],
                  [ 0, 2, 10, 0 ],
                  [ 0, 4, 24, 20, 0 ]
                ],
    centerPatchTypes: [ 0, 4, 8, 15 ],

    patchShapes: null,
    patchSize: null,
    // used to center patch shape at origin because shape rotation works correctly.
    patchOffset: null,

    setPatchSize: function (size) {
        var i = 0, j = 0, patchVertices, v, vx, vy, scale;
        if (size > this.MAX_SIZE) { size = this.MAX_SIZE; }
        if (size < this.MIN_SIZE) { size = this.MIN_SIZE; }
        this.patchSize = size;
        this.patchOffset = this.patchSize / 2.0; // used to center patch shape at origin.
        scale = this.patchSize / this.PATCH_CELLS;
        this.patchShapes = [];
        for (i = 0; i < this.patchTypes.length; i++) {
            this.patchShapes[i] = [];
            patchVertices = this.patchTypes[i];
            for (j = 0; j < patchVertices.length; j++) {
                v = patchVertices[j];
                vx = (v % this.PATCH_GRIDS * scale) - this.patchOffset;
                vy = (v / this.PATCH_GRIDS * scale) - this.patchOffset;
                this.patchShapes[i].push([vx, vy]);
            }
        }
    },

    render: function(canvas, code) {
        if (typeof canvas == "string") {
            canvas = document.getElementById(canvas);
        }
        if (! canvas.getContext) {
            return;
        }

        // decode the code into parts:
        // bit 0-1: middle patch type
        var centerType = this.centerPatchTypes[code & 0x3],
            // bit 2: middle invert
            centerInvert = ((code >> 2) & 0x1) !== 0,
            // bit 3-6: corner patch type
            cornerType = (code >> 3) & 0x0f,
            // bit 7: corner invert
            cornerInvert = ((code >> 7) & 0x1) !== 0,
            // bit 8-9: corner turns
            cornerTurn = (code >> 8) & 0x3,
            // bit 10-13: side patch type
            sideType = (code >> 10) & 0x0f,
            // bit 14: side invert
            sideInvert = ((code >> 14) & 0x1) !== 0,
            // bit 15: corner turns
            sideTurn = (code >> 15) & 0x3,
            // bit 16-20: blue color component
            blue = (code >> 16) & 0x01f,
            // bit 21-26: green color component
            green = (code >> 21) & 0x01f,
            // bit 27-31: red color component
            red = (code >> 27) & 0x01f;

            // color components are used at top of the range for color difference
            // use white background for now. TODO: support transparency.
        var foreColor = [(red << 3), (green << 3), (blue << 3)],
            backColor = [255, 255, 255];

        // outline shapes with a noticeable color (complementary will do) if
        // shape color and background color are too similar (measured by color
        // distance).
        var strokeColor = null;
        if (this.colorDistance(foreColor, backColor) < 32) {
            strokeColor = this.toStyle(this.complementaryColor(foreColor));
        }
        foreColor = this.toStyle(foreColor);
        backColor = this.toStyle(backColor);

        var ctx = canvas.getContext('2d');
        // render at larger source size (to be scaled down later)
        ctx.save();
        ctx.scale(1/3, 1/3);

        // center patch
        this.drawPatch(ctx, this.patchSize, this.patchSize, centerType, 0, centerInvert, foreColor, backColor, strokeColor);

        // side patch (top)
        this.drawPatch(ctx, this.patchSize, 0, sideType, sideTurn++, sideInvert, foreColor, backColor, strokeColor);
        // side patch (right)
        this.drawPatch(ctx, this.patchSize * 2, this.patchSize, sideType, sideTurn++, sideInvert, foreColor, backColor, strokeColor);
        // side patch (bottom)
        this.drawPatch(ctx, this.patchSize, this.patchSize * 2, sideType, sideTurn++, sideInvert, foreColor, backColor, strokeColor);
        // side patch (left)
        this.drawPatch(ctx, 0, this.patchSize, sideType, sideTurn++, sideInvert, foreColor, backColor, strokeColor);

        // corner patch (top left)
        this.drawPatch(ctx, 0, 0, cornerType, cornerTurn++, cornerInvert, foreColor, backColor, strokeColor);
        // corner patch (top right)
        this.drawPatch(ctx, this.patchSize * 2, 0, cornerType, cornerTurn++, cornerInvert, foreColor, backColor, strokeColor);
        // corner patch (bottom right)
        this.drawPatch(ctx, this.patchSize * 2, this.patchSize * 2, cornerType, cornerTurn++, cornerInvert, foreColor, backColor, strokeColor);
        // corner patch (bottom left)
        this.drawPatch(ctx, 0, this.patchSize * 2, cornerType, cornerTurn++, cornerInvert, foreColor, backColor, strokeColor);
        ctx.restore();
    },

    drawPatch: function(ctx, x, y, patch, turn, invert, fore, back, stroke) {
        var i = 0, vertices, vertices_len, vertex;

        patch %= this.patchTypes.length;
        turn %= 4;
        if ((this.patchFlags[patch] & this.PATCH_INVERTED) !== 0) {
            invert = !invert;
        }

        // paint the background
        ctx.fillStyle = invert ? fore : back;
        ctx.fillRect(x, y, this.patchSize, this.patchSize);

        // offset and rotate coordinate space by patch position (x, y) and
        // 'turn' before rendering patch shape
        ctx.save();
        ctx.translate(x + this.patchOffset, y + this.patchOffset);
        ctx.rotate(turn * Math.PI / 2.0);

        vertices = this.patchShapes[patch];
        vertices_len = vertices.length;

        // if stroke color was specified, apply stroke
        // stroke color should be specified if fore color is too close to the back color.
        if (stroke) {
            ctx.strokeStyle = stroke;
            ctx.beginPath();
            for (i = 0; i < vertices_len; i++) {
                vertex = vertices[i];
                ctx.lineTo(vertex[0], vertex[1]);
            }
            ctx.closePath();
            ctx.stroke();
        }

        // render rotated patch using fore color (back color if inverted)
        ctx.fillStyle = invert ? back : fore;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        for (i = 0; i < vertices_len; i++) {
            vertex = vertices[i];
            ctx.lineTo(vertex[0], vertex[1]);
        }
        ctx.fill();

        // restore previous rotation
        ctx.restore();
    },

    colorDistance: function (c1, c2) {
        var dx = c1[0] - c2[0],
            dy = c1[1] - c2[1],
            dz = c1[2] - c2[2];
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    },

    complementaryColor: function(c) {
        return [ (c[0] ^ 0xff), (c[1] ^ 0xff), (c[2] ^ 0xff) ];
    },

    toStyle: function(color) {
        return ["rgb(", color.join(","), ")"].join("");
    }
};
