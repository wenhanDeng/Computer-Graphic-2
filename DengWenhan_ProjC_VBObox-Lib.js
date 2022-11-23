//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)

// Tabs set to 2

/*=====================
  VBObox-Lib.js library: 
  ===================== 
Note that you don't really need 'VBObox' objects for any simple, 
    beginner-level WebGL/OpenGL programs: if all vertices contain exactly 
		the same attributes (e.g. position, color, surface normal), and use 
		the same shader program (e.g. same Vertex Shader and Fragment Shader), 
		then our textbook's simple 'example code' will suffice.
		  
***BUT*** that's rare -- most genuinely useful WebGL/OpenGL programs need 
		different sets of vertices with  different sets of attributes rendered 
		by different shader programs.  THUS a customized VBObox object for each 
		VBO/shader-program pair will help you remember and correctly implement ALL 
		the WebGL/GLSL steps required for a working multi-shader, multi-VBO program.
		
One 'VBObox' object contains all we need for WebGL/OpenGL to render on-screen a 
		set of shapes made from vertices stored in one Vertex Buffer Object (VBO), 
		as drawn by calls to one 'shader program' that runs on your computer's 
		Graphical Processing Unit(GPU), along with changes to values of that shader 
		program's one set of 'uniform' varibles.  
The 'shader program' consists of a Vertex Shader and a Fragment Shader written 
		in GLSL, compiled and linked and ready to execute as a Single-Instruction, 
		Multiple-Data (SIMD) parallel program executed simultaneously by multiple 
		'shader units' on the GPU.  The GPU runs one 'instance' of the Vertex 
		Shader for each vertex in every shape, and one 'instance' of the Fragment 
		Shader for every on-screen pixel covered by any part of any drawing 
		primitive defined by those vertices.
The 'VBO' consists of a 'buffer object' (a memory block reserved in the GPU),
		accessed by the shader program through its 'attribute' variables. Shader's
		'uniform' variable values also get retrieved from GPU memory, but their 
		values can't be changed while the shader program runs.  
		Each VBObox object stores its own 'uniform' values as vars in JavaScript; 
		its 'adjust()'	function computes newly-updated values for these uniform 
		vars and then transfers them to the GPU memory for use by shader program.
EVENTUALLY you should replace 'cuon-matrix-quat03.js' with the free, open-source
   'glmatrix.js' library for vectors, matrices & quaternions: Google it!
		This vector/matrix library is more complete, more widely-used, and runs
		faster than our textbook's 'cuon-matrix-quat03.js' library.  
		--------------------------------------------------------------
		I recommend you use glMatrix.js instead of cuon-matrix-quat03.js
		--------------------------------------------------------------
		for all future WebGL programs. 
You can CONVERT existing cuon-matrix-based programs to glmatrix.js in a very 
    gradual, sensible, testable way:
		--add the glmatrix.js library to an existing cuon-matrix-based program;
			(but don't call any of its functions yet).
		--comment out the glmatrix.js parts (if any) that cause conflicts or in	
			any way disrupt the operation of your program.
		--make just one small local change in your program; find a small, simple,
			easy-to-test portion of your program where you can replace a 
			cuon-matrix object or function call with a glmatrix function call.
			Test; make sure it works. Don't make too large a change: it's hard to fix!
		--Save a copy of this new program as your latest numbered version. Repeat
			the previous step: go on to the next small local change in your program
			and make another replacement of cuon-matrix use with glmatrix use. 
			Test it; make sure it works; save this as your next numbered version.
		--Continue this process until your program no longer uses any cuon-matrix
			library features at all, and no part of glmatrix is commented out.
			Remove cuon-matrix from your library, and now use only glmatrix.

	------------------------------------------------------------------
	VBObox -- A MESSY SET OF CUSTOMIZED OBJECTS--NOT REALLY A 'CLASS'
	------------------------------------------------------------------
As each 'VBObox' object can contain:
  -- a DIFFERENT GLSL shader program, 
  -- a DIFFERENT set of attributes that define a vertex for that shader program, 
  -- a DIFFERENT number of vertices to used to fill the VBOs in GPU memory, and 
  -- a DIFFERENT set of uniforms transferred to GPU memory for shader use.  
  THUS:
		I don't see any easy way to use the exact same object constructors and 
		prototypes for all VBObox objects.  Every additional VBObox objects may vary 
		substantially, so I recommend that you copy and re-name an existing VBObox 
		prototype object, and modify as needed, as shown here. 
		(e.g. to make the VBObox3 object, copy the VBObox2 constructor and 
		all its prototype functions, then modify their contents for VBObox3 
		activities.)

*/

// Written for EECS 351-2,	Intermediate Computer Graphics,
//							Northwestern Univ. EECS Dept., Jack Tumblin
// 2016.05.26 J. Tumblin-- Created; tested on 'TwoVBOs.html' starter code.
// 2017.02.20 J. Tumblin-- updated for EECS 351-1 use for Project C.
// 2018.04.11 J. Tumblin-- minor corrections/renaming for particle systems.
//    --11e: global 'gl' replaced redundant 'myGL' fcn args; 
//    --12: added 'SwitchToMe()' fcn to simplify 'init()' function and to fix 
//      weird subtle errors that sometimes appear when we alternate 'adjust()'
//      and 'draw()' functions of different VBObox objects. CAUSE: found that
//      only the 'draw()' function (and not the 'adjust()' function) made a full
//      changeover from one VBObox to another; thus calls to 'adjust()' for one
//      VBObox could corrupt GPU contents for another.
//      --Created vboStride, vboOffset members to centralize VBO layout in the 
//      constructor function.
//    -- 13 (abandoned) tried to make a 'core' or 'resuable' VBObox object to
//      which we would add on new properties for shaders, uniforms, etc., but
//      I decided there was too little 'common' code that wasn't customized.
//=============================================================================
var floatsPerVertex = 7;
var c30 = Math.sqrt(0.75);					// == cos(30deg) == sqrt(3) / 2
var sq2	= Math.sqrt(2.0);						 
// for surface normals:
var sq23 = Math.sqrt(2.0/3.0)
var sq29 = Math.sqrt(2.0/9.0)
var sq89 = Math.sqrt(8.0/9.0)
var thrd = 1.0/3.0;
var numT = 12;
function makeT() {
    colorShapes = new Float32Array([
// Face 0: (right side).  Unit Normal Vector: N0 = (sq23, sq29, thrd)
     // Node 0 (apex, +z axis; 			color--blue, 				surf normal (all verts):
     0.0,	 0.0, sq2, 1.0,		 sq23,	sq29, thrd,
     // Node 1 (base: lower rt; red)
     			c30, -0.5, 0.0, 1.0, 		sq23,	sq29, thrd,
     // Node 2 (base: +y axis;  grn)
     			0.0,  1.0, 0.0, 1.0,  			sq23,	sq29, thrd, 
// Face 1: (left side).		Unit Normal Vector: N1 = (-sq23, sq29, thrd)
		 // Node 0 (apex, +z axis;  blue)
		 			0.0,	 0.0, sq2, 1.0,		 -sq23,	sq29, thrd,
     // Node 2 (base: +y axis;  grn)
     			0.0,  1.0, 0.0, 1.0,  		 -sq23,	sq29, thrd,
     // Node 3 (base:lower lft; white)
    			-c30, -0.5, 0.0, 1.0, 		 -sq23,	sq29,	thrd,
// Face 2: (lower side) 	Unit Normal Vector: N2 = (0.0, -sq89, thrd)
		 // Node 0 (apex, +z axis;  blue) 
		 			0.0,	 0.0, sq2, 1.0,				0.0, -sq89,	thrd,
    // Node 3 (base:lower lft; white)
    			-c30, -0.5, 0.0, 1.0, 		 		0.0, -sq89,	thrd,          																							//0.0, 0.0, 0.0, // Normals debug
     // Node 1 (base: lower rt; red) 
     			c30, -0.5, 0.0, 1.0, 		 		0.0, -sq89,	thrd,
// Face 3: (base side)  Unit Normal Vector: N2 = (0.0, 0.0, -1.0)
    // Node 3 (base:lower lft; white)
    			-c30, -0.5, 0.0, 1.0, 			0.0, 	0.0, -1.0,
    // Node 2 (base: +y axis;  grn)
     			0.0,  1.0, 0.0, 1.0,  			0.0, 	0.0, -1.0,
    // Node 1 (base: lower rt; red)
     			c30, -0.5, 0.0, 1.0, 				0.0, 	0.0, -1.0,
  ])
}

function makeCube() {
   cube = new Float32Array([
    1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0,
    -1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0,
    -1.0,-1.0, 1.0,1.0,   0.0, 0.0, 1.0,
    -1.0,-1.0, 1.0,1.0,   0.0, 0.0, 1.0,
    1.0, -1.0, 1.0, 1.0, 0.0, 0.0, 1.0,
    1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0,

    1.0, 1.0, 1.0, 1.0,  1.0, 0.0, 0.0,
    1.0,-1.0, 1.0, 1.0,  1.0, 0.0, 0.0,
    1.0,-1.0,-1.0, 1.0,  1.0, 0.0, 0.0,
    1.0,-1.0,-1.0, 1.0,  1.0, 0.0, 0.0,
    1.0, 1.0, -1.0, 1.0,  1.0, 0.0, 0.0,
    1.0, 1.0, 1.0, 1.0,  1.0, 0.0, 0.0,

    1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0,
    1.0, 1.0,-1.0, 1.0, 0.0, 1.0, 0.0,
    -1.0, 1.0,-1.0, 1.0, 0.0, 1.0, 0.0,
    -1.0, 1.0,-1.0, 1.0, 0.0, 1.0, 0.0,
    -1.0, 1.0,1.0, 1.0, 0.0, 1.0, 0.0,
    1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0,

    -1.0, 1.0, 1.0, 1.0, -1.0, 0.0, 0.0,
    -1.0, 1.0,-1.0, 1.0, -1.0, 0.0, 0.0,
    -1.0,-1.0,-1.0, 1.0, -1.0, 0.0, 0.0,
    -1.0,-1.0,-1.0, 1.0, -1.0, 0.0, 0.0,
    -1.0,-1.0, 1.0, 1.0, -1.0, 0.0, 0.0,
    -1.0, 1.0, 1.0, 1.0, -1.0, 0.0, 0.0,

    -1.0,-1.0,-1.0, 1.0, 0.0,-1.0, 0.0,
    1.0,-1.0,-1.0, 1.0, 0.0,-1.0, 0.0,
    1.0,-1.0, 1.0, 1.0, 0.0,-1.0, 0.0,
    1.0,-1.0, 1.0, 1.0, 0.0,-1.0, 0.0,
    -1.0,-1.0, 1.0, 1.0, 0.0,-1.0, 0.0,
    -1.0,-1.0,-1.0, 1.0, 0.0,-1.0, 0.0,


    -1.0,-1.0, -1.0,1.0,   0.0, 0.0, -1.0,
    1.0, -1.0, -1.0, 1.0, 0.0, 0.0, -1.0,
    1.0, 1.0, -1.0, 1.0, 0.0, 0.0, -1.0,
    1.0, 1.0, -1.0, 1.0, 0.0, 0.0, -1.0,
    -1.0,1.0, -1.0,1.0,   0.0, 0.0, -1.0,
    -1.0,-1.0, -1.0,1.0,   0.0, 0.0, -1.0,
   
    
    
     
   
    
   
   ])
}



function makeSphere() {
	//==============================================================================
	// Make a sphere from one OpenGL TRIANGLE_STRIP primitive.   Make ring-like 
	// equal-lattitude 'slices' of the sphere (bounded by planes of constant z), 
	// and connect them as a 'stepped spiral' design (see makeCylinder) to build the
	// sphere from one triangle strip.
	  var slices = 13;		// # of slices of the sphere along the z axis. >=3 req'd
												// (choose odd # or prime# to avoid accidental symmetry)
	  var sliceVerts	= 27;	// # of vertices around the top edge of the slice
												// (same number of vertices on bottom of slice, too)
	  var topColr = new Float32Array([0.7, 0.7, 0.7]);	// North Pole: light gray
	  var equColr = new Float32Array([0.3, 0.7, 0.3]);	// Equator:    bright green
	  var botColr = new Float32Array([0.9, 0.9, 0.9]);	// South Pole: brightest gray.
	  var sliceAngle = Math.PI/slices;	// lattitude angle spanned by one slice.
	
		// Create a (global) array to hold this sphere's vertices:
	  sphVerts = new Float32Array(  ((slices * 2* sliceVerts) -2) * floatsPerVertex);
											// # of vertices * # of elements needed to store them. 
											// each slice requires 2*sliceVerts vertices except 1st and
											// last ones, which require only 2*sliceVerts-1.
											
		// Create dome-shaped top slice of sphere at z=+1
		// s counts slices; v counts vertices; 
		// j counts array elements (vertices * elements per vertex)
		var cos0 = 0.0;					// sines,cosines of slice's top, bottom edge.
		var sin0 = 0.0;
		var cos1 = 0.0;
		var sin1 = 0.0;	
		var j = 0;							// initialize our array index
		var isLast = 0;
		var isFirst = 1;
		for(s=0; s<slices; s++) {	// for each slice of the sphere,
			// find sines & cosines for top and bottom of this slice
			if(s==0) {
				isFirst = 1;	// skip 1st vertex of 1st slice.
				cos0 = 1.0; 	// initialize: start at north pole.
				sin0 = 0.0;
			}
			else {					// otherwise, new top edge == old bottom edge
				isFirst = 0;	
				cos0 = cos1;
				sin0 = sin1;
			}								// & compute sine,cosine for new bottom edge.
			cos1 = Math.cos((s+1)*sliceAngle);
			sin1 = Math.sin((s+1)*sliceAngle);
			// go around the entire slice, generating TRIANGLE_STRIP verts
			// (Note we don't initialize j; grows with each new attrib,vertex, and slice)
			if(s==slices-1) isLast=1;	// skip last vertex of last slice.
			for(v=isFirst; v< 2*sliceVerts-isLast; v++, j+=floatsPerVertex) {	
				if(v%2==0)
				{				// put even# vertices at the the slice's top edge
								// (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
								// and thus we can simplify cos(2*PI(v/2*sliceVerts))  
					sphVerts[j  ] = sin0 * Math.cos(Math.PI*(v)/sliceVerts); 	
					sphVerts[j+1] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);	
					sphVerts[j+2] = cos0;		
					sphVerts[j+3] = 1.0;
          sphVerts[j+4] = sin0 * Math.cos(Math.PI*(v)/sliceVerts);; 
					sphVerts[j+5] = sin0 * Math.sin(Math.PI*(v)/sliceVerts); 
					sphVerts[j+6] = cos0;			
				}
				else { 	// put odd# vertices around the slice's lower edge;
								// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
								// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
					sphVerts[j  ] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);		// x
					sphVerts[j+1] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);		// y
					sphVerts[j+2] = cos1;																				// z
					sphVerts[j+3] = 1.0;																				// w.		
          sphVerts[j+4] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);
					sphVerts[j+5] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts); 
					sphVerts[j+6] = cos1;	
				}
			}
		}
	}
function makeDrawingaxis() {
  axisVerts = new Float32Array([
    0.0,  0.0,  0.0, 1.0,		1.0,  0,  0,	// X axis line (origin: gray)
    5,  0.0,  0.0, 1.0,		1.0,  0.0,  0.0,
    
    0.0,  0.0,  0.0, 1.0,		0.0,  1.0,  0,	// X axis line (origin: gray)
    0.0,  5.0,  0.0, 1.0,		0.0,  1.0,  0.0,
    
    0.0,  0.0,  0.0, 1.0,		0.0,  0,  1.0,	// X axis line (origin: gray)
    0.0,  0.0,  5.0, 1.0,		0.0,  0.0,  1.0,// 						 (endpoint: red)
  ])
}
function makeGroundGrid() {
	//==============================================================================
	// Create a list of vertices that create a large grid of lines in the x,y plane
	// centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.
	
  // # of lines to draw in x,y to make the grid.
  var xcount = 100;
  var ycount = 100;		
  var xymax	= 50.0;			// grid size; extends to cover +/-xymax in x and y.
		 var xColr = new Float32Array([1.0, 1.0, 0.3]);	// bright yellow
		 var yColr = new Float32Array([0.5, 1.0, 0.5]);	// bright green.
		 
		// Create an (global) array to hold this ground-plane's vertices:
		gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
							// draw a grid made of xcount+ycount lines; 2 vertices per line.
							
		var xgap = xymax/(xcount-1);		// HALF-spacing between lines in x,y;
		var ygap = xymax/(ycount-1);		// (why half? because v==(0line number/2))
		
		// First, step thru x values as we make vertical lines of constant-x:
		for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
			if(v%2==0) {	// put even-numbered vertices at (xnow, -xymax, 0)
				gndVerts[j  ] = -xymax + (v  )*xgap;	// x
				gndVerts[j+1] = -xymax;								// y
				gndVerts[j+2] = 0.0;									// z
				gndVerts[j+3] = 1.0;									// w.
			}
			else {				// put odd-numbered vertices at (xnow, +xymax, 0).
				gndVerts[j  ] = -xymax + (v-1)*xgap;	// x
				gndVerts[j+1] = xymax;								// y
				gndVerts[j+2] = 0.0;									// z
				gndVerts[j+3] = 1.0;									// w.
			}
			gndVerts[j+4] = 0.5;			// red
			gndVerts[j+5] = 0.8;			// grn
			gndVerts[j+6] = 0.33;			// blu
		}
		// Second, step thru y values as wqe make horizontal lines of constant-y:
		// (don't re-initialize j--we're adding more vertices to the array)
		for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
			if(v%2==0) {		// put even-numbered vertices at (-xymax, ynow, 0)
				gndVerts[j  ] = -xymax;								// x
				gndVerts[j+1] = -xymax + (v  )*ygap;	// y
				gndVerts[j+2] = 0.0;									// z
				gndVerts[j+3] = 1.0;									// w.
			}
			else {					// put odd-numbered vertices at (+xymax, ynow, 0).
				gndVerts[j  ] = xymax;								// x
				gndVerts[j+1] = -xymax + (v-1)*ygap;	// y
				gndVerts[j+2] = 0.0;									// z
				gndVerts[j+3] = 1.0;									// w.
			}
			gndVerts[j+4] = 0.4;			// red
			gndVerts[j+5] = 0.66;			// grn
			gndVerts[j+6] = 0.78;			// blu
		}
	}
//=============================================================================
//=============================================================================
function VBObox0() {
//=============================================================================
//=============================================================================
// CONSTRUCTOR for one re-usable 'VBObox0' object that holds all data and fcns
// needed to render vertices from one Vertex Buffer Object (VBO) using one 
// separate shader program (a vertex-shader & fragment-shader pair) and one
// set of 'uniform' variables.

// Constructor goal: 
// Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
// written into code) in all other VBObox functions. Keeping all these (initial)
// values here, in this one coonstrutor function, ensures we can change them 
// easily WITHOUT disrupting any other code, ever!
  
	this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
  'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
  //
  'uniform mat4 u_ModelMat0;\n' +
  'attribute vec4 a_Pos0;\n' +
  'attribute vec3 a_Colr0;\n'+
  'varying vec3 v_Colr0;\n' +
  //
  'void main() {\n' +
  '  gl_Position = u_ModelMat0 * a_Pos0;\n' +
  '	 v_Colr0 = a_Colr0;\n' +
  ' }\n';

	this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
  'precision mediump float;\n' +
  'varying vec3 v_Colr0;\n' +
  'void main() {\n' +
  '  gl_FragColor = vec4(v_Colr0, 1.0);\n' + 
  '}\n';

  makeGroundGrid()
  makeDrawingaxis()

	this.vboContents = new Float32Array(gndVerts.length + axisVerts.length)
  this.vboContents.set(gndVerts, 0)
  this.vboContents.set(axisVerts, gndVerts.length)
  axisStart = gndVerts.length

	this.vboVerts = this.vboContents.length / 7;						// # of vertices held in 'vboContents' array
 
	this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
	                              // bytes req'd by 1 vboContents array element;
																// (why? used to compute stride and offset 
																// in bytes for vertexAttribPointer() calls)
  this.vboBytes = this.vboContents.length * this.FSIZE;               
                                // total number of bytes stored in vboContents
                                // (#  of floats in vboContents array) * 
                                // (# of bytes/float).
   
	this.vboStride = this.vboBytes / this.vboVerts; 
	                              // (== # of bytes to store one complete vertex).
	                              // From any attrib in a given vertex in the VBO, 
	                              // move forward by 'vboStride' bytes to arrive 
	                              // at the same attrib for the next vertex. 

	            //----------------------Attribute sizes
  this.vboFcount_a_Pos0 =  4;    // # of floats in the VBO needed to store the
                                // attribute named a_Pos0. (4: x,y,z,w values)
  this.vboFcount_a_Colr0 = 3;   // # of floats for this attrib (r,g,b values) 



  console.assert((this.vboFcount_a_Pos0 +     // check the size of each and
                  this.vboFcount_a_Colr0) *   // every attribute in our VBO
                  this.FSIZE == this.vboStride, // for agreeement with'stride'
                  "Uh oh! VBObox0.vboStride disagrees with attribute-size values!");

              //----------------------Attribute offsets  
	this.vboOffset_a_Pos0 = 0;    // # of bytes from START of vbo to the START
	                              // of 1st a_Pos0 attrib value in vboContents[]
  this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;    
                                // (4 floats * bytes/float) 
                                // # of bytes from START of vbo to the START
                                // of 1st a_Colr0 attrib value in vboContents[]
	            //-----------------------GPU memory locations:
	this.vboLoc;									// GPU Location for Vertex Buffer Object, 
	                              // returned by gl.createBuffer() function call
	this.shaderLoc;								// GPU Location for compiled Shader-program  
	                            	// set by compile/link of VERT_SRC and FRAG_SRC.
								          //------Attribute locations in our shaders:
	this.a_PosLoc;								// GPU location for 'a_Pos0' attribute
	this.a_ColrLoc;								// GPU location for 'a_Colr0' attribute

	            //---------------------- Uniform locations &values in our shaders
	this.ModelMat = new Matrix4();	// Transforms CVV axes to model axes.
	this.u_ModelMatLoc;							// GPU location for u_ModelMat uniform
}

VBObox0.prototype.init = function() {
//=============================================================================
// Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
// kept in this VBObox. (This function usually called only once, within main()).
// Specifically:
// a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
//  executable 'program' stored and ready to use inside the GPU.  
// b) create a new VBO object in GPU memory and fill it by transferring in all
//  the vertex data held in our Float32array member 'VBOcontents'. 
// c) Find & save the GPU location of all our shaders' attribute-variables and 
//  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
// -------------------
// CAREFUL!  before you can draw pictures using this VBObox contents, 
//  you must call this VBObox object's switchToMe() function too!
//--------------------
// a) Compile,link,upload shaders-----------------------------------------------
this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
if (!this.shaderLoc) {
    console.log(this.constructor.name + 
    						'.init() failed to create executable Shaders on the GPU. Bye!');
    return;
  }
// CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
//  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}

	gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())

// b) Create VBO on GPU, fill it------------------------------------------------
	this.vboLoc = gl.createBuffer();	
  if (!this.vboLoc) {
    console.log(this.constructor.name + 
    						'.init() failed to create VBO in GPU. Bye!'); 
    return;
  }
  // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
  //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
  // (positions, colors, normals, etc), or 
  //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
  // that each select one vertex from a vertex array stored in another VBO.
  gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
  								this.vboLoc);				  // the ID# the GPU uses for this buffer.

  // Fill the GPU's newly-created VBO object with the vertex data we stored in
  //  our 'vboContents' member (JavaScript Float32Array object).
  //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
  //    use gl.bufferSubData() to modify VBO contents without changing VBO size)
  gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
 					 				this.vboContents, 		// JavaScript Float32Array
  							 	gl.STATIC_DRAW);			// Usage hint.
  //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
  //	(see OpenGL ES specification for more info).  Your choices are:
  //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
  //				contents rarely or never change.
  //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
  //				contents may change often as our program runs.
  //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
  // 			times and then discarded; for rapidly supplied & consumed VBOs.

  // c1) Find All Attributes:---------------------------------------------------
  //  Find & save the GPU location of all our shaders' attribute-variables and 
  //  uniform-variables (for switchToMe(), adjust(), draw(), reload(),etc.)
  this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos0');
  if(this.a_PosLoc < 0) {
    console.log(this.constructor.name + 
    						'.init() Failed to get GPU location of attribute a_Pos0');
    return -1;	// error exit.
  }
 	this.a_ColrLoc = gl.getAttribLocation(this.shaderLoc, 'a_Colr0');
  if(this.a_ColrLoc < 0) {
    console.log(this.constructor.name + 
    						'.init() failed to get the GPU location of attribute a_Colr0');
    return -1;	// error exit.
  }
  
  // c2) Find All Uniforms:-----------------------------------------------------
  //Get GPU storage location for each uniform var used in our shader programs: 
	this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat0');
  if (!this.u_ModelMatLoc) { 
    console.log(this.constructor.name + 
    						'.init() failed to get GPU location for u_ModelMat1 uniform');
    return;
  }  
}

VBObox0.prototype.switchToMe = function() {
//==============================================================================
// Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
//
// We only do this AFTER we called the init() function, which does the one-time-
// only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
// even then, you are STILL not ready to draw our VBObox's contents onscreen!
// We must also first complete these steps:
//  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
//  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
//  c) tell the GPU to connect the shader program's attributes to that VBO.

// a) select our shader program:
  gl.useProgram(this.shaderLoc);	
//		Each call to useProgram() selects a shader program from the GPU memory,
// but that's all -- it does nothing else!  Any previously used shader program's 
// connections to attributes and uniforms are now invalid, and thus we must now
// establish new connections between our shader program's attributes and the VBO
// we wish to use.  
  
// b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
//  instead connect to our own already-created-&-filled VBO.  This new VBO can 
//    supply values to use as attributes in our newly-selected shader program:
	gl.bindBuffer(gl.ARRAY_BUFFER,	        // GLenum 'target' for this GPU buffer 
										this.vboLoc);			    // the ID# the GPU uses for our VBO.

// c) connect our newly-bound VBO to supply attribute variable values for each
// vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
// this sets up data paths from VBO to our shader units:
  // 	Here's how to use the almost-identical OpenGL version of this function:
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  gl.vertexAttribPointer(
		this.a_PosLoc,//index == ID# for the attribute var in your GLSL shader pgm;
		this.vboFcount_a_Pos0,// # of floats used by this attribute: 1,2,3 or 4?
		gl.FLOAT,			// type == what data type did we use for those numbers?
		false,				// isNormalized == are these fixed-point values that we need
									//									normalize before use? true or false
		this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
		              // stored attrib for this vertex to the same stored attrib
		              //  for the next vertex in our VBO.  This is usually the 
									// number of bytes used to store one complete vertex.  If set 
									// to zero, the GPU gets attribute values sequentially from 
									// VBO, starting at 'Offset'.	
									// (Our vertex size in bytes: 4 floats for pos + 3 for color)
		this.vboOffset_a_Pos0);						
		              // Offset == how many bytes from START of buffer to the first
  								// value we will actually use?  (We start with position).
  gl.vertexAttribPointer(this.a_ColrLoc, this.vboFcount_a_Colr0, 
                        gl.FLOAT, false, 
                        this.vboStride, this.vboOffset_a_Colr0);
  							
// --Enable this assignment of each of these attributes to its' VBO source:
  gl.enableVertexAttribArray(this.a_PosLoc);
  gl.enableVertexAttribArray(this.a_ColrLoc);
}

VBObox0.prototype.isReady = function() {
//==============================================================================
// Returns 'true' if our WebGL rendering context ('gl') is ready to render using
// this objects VBO and shader program; else return false.
// see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter

var isOK = true;

  if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
    console.log(this.constructor.name + 
    						'.isReady() false: shader program at this.shaderLoc not in use!');
    isOK = false;
  }
  if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
      console.log(this.constructor.name + 
  						'.isReady() false: vbo at this.vboLoc not in use!');
    isOK = false;
  }
  return isOK;
}

VBObox0.prototype.adjust = function() {
//==============================================================================
// Update the GPU to newer, current values we now store for 'uniform' vars on 
// the GPU; and (if needed) update each attribute's stride and offset in VBO.

  // check: was WebGL context set to use our VBO & shader program?
  if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
  						'.adjust() call you needed to call this.switchToMe()!!');
  }  
	// Adjust values for our uniforms,

		this.ModelMat.setIdentity();
// THIS DOESN'T WORK!!  this.ModelMatrix = g_worldMat;
  this.ModelMat.set(g_cam);	// use our global, shared camera.
// READY to draw in 'world' coord axes.
	
//  this.ModelMat.rotate(g_angleNow0, 0, 0, 1);	  // rotate drawing axes,
//  this.ModelMat.translate(0.35, 0, 0);							// then translate them.
  //  Transfer new uniforms' values to the GPU:-------------
  // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
  gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										this.ModelMat.elements);	// send data from Javascript.
  // Adjust the attributes' stride and offset (if necessary)
  // (use gl.vertexAttribPointer() calls and gl.enableVertexAttribArray() calls)
}

VBObox0.prototype.draw = function() {
//=============================================================================
// Render current VBObox contents.

  // check: was WebGL context set to use our VBO & shader program?
  if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
  						'.draw() call you needed to call this.switchToMe()!!');
  }  
  // ----------------------------Draw the contents of the currently-bound VBO:
  gl.drawArrays(gl.LINES, 	    // select the drawing primitive to draw,
                  // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                  //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
  								0, 								// location of 1st vertex to draw;
  								this.vboVerts);		// number of vertices to draw on-screen.
}


VBObox0.prototype.reload = function() {
//=============================================================================
// Over-write current values in the GPU inside our already-created VBO: use 
// gl.bufferSubData() call to re-transfer some or all of our Float32Array 
// contents to our VBO without changing any GPU memory allocations.

 gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                  0,                  // byte offset to where data replacement
                                      // begins in the VBO.
 					 				this.vboContents);   // the JS source-data array used to fill VBO

}
/*
VBObox0.prototype.empty = function() {
//=============================================================================
// Remove/release all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  However, make sure this step is reversible by a call to 
// 'restoreMe()': be sure to retain all our Float32Array data, all values for 
// uniforms, all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}

VBObox0.prototype.restore = function() {
//=============================================================================
// Replace/restore all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  Use our retained Float32Array data, all values for  uniforms, 
// all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}
*/

//=============================================================================
//=============================================================================
function VBObox1() {
  //=============================================================================
  //=============================================================================
  // CONSTRUCTOR for one re-usable 'VBObox0' object that holds all data and fcns
  // needed to render vertices from one Vertex Buffer Object (VBO) using one 
  // separate shader program (a vertex-shader & fragment-shader pair) and one
  // set of 'uniform' variables.
  
  // Constructor goal: 
  // Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
  // written into code) in all other VBObox functions. Keeping all these (initial)
  // values here, in this one coonstrutor function, ensures we can change them 
  // easily WITHOUT disrupting any other code, ever!
    
    this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
    'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
    //
   
    'uniform vec3 Lpos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position                         //		   w==0.0 for distant light from x,y,z direction 
    'uniform vec3 Lambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
    'uniform vec3 Ldiff;\n' +			// Id ==  diffuse light source strength (r,g,b)
    'uniform vec3 Lspec;\n' +			// Is == specular light source strength (r,g,b)
    'uniform vec3 u_eyePos; \n' +
    'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
    '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
    '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
    '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
    '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
    '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
    '		};\n' +
    'uniform MatlT u_MatlSet;\n' +		// Array of all materials.
    'uniform mat4 u_ModelMat0;\n' +
    'uniform mat4 u_NormalMatrix0;\n' +
    'uniform mat4 u_cam;\n' +
    'attribute vec4 a_Pos0;\n' +
    'attribute vec3 a_Normal0;\n' +
    'varying vec3 v_Colr0;\n' +
    'uniform int LightM;\n' +
    //
    'void main() {\n' +
    '  if (LightM == 1) {\n' +
    '  vec4 vertP = u_ModelMat0 * a_Pos0;\n' +
    '  vec3 normal = normalize(vec3(u_NormalMatrix0 * vec4(a_Normal0, 1.0)));\n' +
    '  vec3 lightDirection = normalize(Lpos - vec3(vertP));\n' +
    '  vec3 eyeDirection = normalize(u_eyePos - vec3(vertP)); \n' +
    '  gl_Position = u_cam * a_Pos0;\n' +
    '  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
    '  vec3 diffuse = u_MatlSet.diff * Ldiff * nDotL;\n' +
    '  vec3 ambient = Lambi * u_MatlSet.ambi;\n' +
    '  float e64 = 0.0;\n' +
    '  if (nDotL != 0.0) { \n' +
    '  vec3 R = reflect(-lightDirection, normal);\n' +
    '  vec3 V = normalize(eyeDirection);\n' +
    '  float DRV = dot(R, V);\n' +
    '  float specA = max(DRV, 0.0);\n' + 
    '  e64 = pow(specA, float(u_MatlSet.shiny));\n' +
    '}\n' + 
    '	 vec3 speculr = u_MatlSet.spec * Lspec * e64;\n' +
    '	 v_Colr0 = diffuse + ambient + speculr + u_MatlSet.emit;\n' +
    '}\n' +
    ' else {\n' +
    '  vec4 vertP = u_ModelMat0 * a_Pos0;\n' +
    '  vec3 normal = normalize(vec3(u_NormalMatrix0 * vec4(a_Normal0, 1.0)));\n' +
    '  vec3 lightDirection = normalize(Lpos - vec3(vertP));\n' +
    '  vec3 eyeDirection = normalize(u_eyePos - vec3(vertP)); \n' +
    '  gl_Position = u_cam * a_Pos0;\n' +
    '  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
    '  vec3 diffuse = u_MatlSet.diff * Ldiff * nDotL;\n' +
    '  vec3 ambient = Lambi * u_MatlSet.ambi;\n' +
    '  float e64 = 0.0;\n' +
   
    '  vec3 H = normalize(lightDirection + eyeDirection); \n' +
    '  float DNH = max(dot(H, normal), 0.0);\n' +
    '  float specA = max(DNH, 0.0);\n' + 
    '  e64 = pow(specA, float(u_MatlSet.shiny));\n' +
    
    '	 vec3 speculr = u_MatlSet.spec * Lspec * e64;\n' +
    '	 v_Colr0 = diffuse + ambient + speculr + u_MatlSet.emit;\n' +
    '}\n' +
    ' }\n';
    
    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
    'precision mediump float;\n' +
    'varying vec3 v_Colr0;\n' +
    'void main() {\n' +
    '  gl_FragColor = vec4(v_Colr0, 1.0);\n' + 
    '}\n';
  
    makeSphere()
    makeT()
    makeCube()
    this.vboContents = new Float32Array(sphVerts.length + colorShapes.length + cube.length)
    this.vboContents.set(sphVerts, 0)
    this.spheNum = sphVerts.length / 7;
    this.TStart = sphVerts.length;
    this.vboContents.set(colorShapes, sphVerts.length)
    this.custart = sphVerts.length + colorShapes.length;
    this.vboContents.set(cube, sphVerts.length + colorShapes.length)
   console.log(cube.length)
    
    this.vboVerts = this.vboContents.length / 7;					
    // # of vertices held in 'vboContents' array
   
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
                                  // bytes req'd by 1 vboContents array element;
                                  // (why? used to compute stride and offset 
                                  // in bytes for vertexAttribPointer() calls)
    this.vboBytes = this.vboContents.length * this.FSIZE;               
                                  // total number of bytes stored in vboContents
                                  // (#  of floats in vboContents array) * 
                                  // (# of bytes/float).
     
    this.vboStride = this.vboBytes / this.vboVerts; 
                                  // (== # of bytes to store one complete vertex).
                                  // From any attrib in a given vertex in the VBO, 
                                  // move forward by 'vboStride' bytes to arrive 
                                  // at the same attrib for the next vertex. 
  
                //----------------------Attribute sizes
    this.vboFcount_a_Pos0 =  4;    // # of floats in the VBO needed to store the
                                  // attribute named a_Pos0. (4: x,y,z,w values)
    this.vboFcount_a_Colr0 = 3;   // # of floats for this attrib (r,g,b values) 
  
  
  
    console.assert((this.vboFcount_a_Pos0 +     // check the size of each and
                    this.vboFcount_a_Colr0) *   // every attribute in our VBO
                    this.FSIZE == this.vboStride, // for agreeement with'stride'
                    "Uh oh! VBObox0.vboStride disagrees with attribute-size values!");
  
                //----------------------Attribute offsets  
    this.vboOffset_a_Pos0 = 0;    // # of bytes from START of vbo to the START
                                  // of 1st a_Pos0 attrib value in vboContents[]
    this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;    
                                  // (4 floats * bytes/float) 
                                  // # of bytes from START of vbo to the START
                                  // of 1st a_Colr0 attrib value in vboContents[]
                //-----------------------GPU memory locations:
    this.vboLoc;									// GPU Location for Vertex Buffer Object, 
                                  // returned by gl.createBuffer() function call
    this.shaderLoc;								// GPU Location for compiled Shader-program  
                                  // set by compile/link of VERT_SRC and FRAG_SRC.
                            //------Attribute locations in our shaders:
    this.a_PosLoc;								// GPU location for 'a_Pos0' attribute
    this.a_ColrLoc;								// GPU location for 'a_Colr0' attribute
    this.a_NorLoc;
    this.u_LightPosition;
    this.u_LightColor;
    this.u_AmbientLight;
    this.L_PosLoc;								// GPU location for 'a_Pos0' attribute
    this.L_AmbiLoc;								// GPU location for 'a_Colr0' attribute
    this.L_DiffLoc;
    this.L_SpecLoc;
    this.LightModeLoc;
    this.eyeposLoc;
    this.g_camLoc;
    this.matl0 = new Material(1);
    this.matl1 = new Material(6);
    this.matl2 = new Material(7);
    this.matl3 = new Material(2);
    this.matl4 = new Material(3);
  
                //---------------------- Uniform locations &values in our shaders
    this.ModelMat = new Matrix4();	// Transforms CVV axes to model axes.
    this.NormalMat = new Matrix4();
    this.camMat = new Matrix4();
    this.eyeVec = new Float32Array(3);
    this.u_ModelMatLoc;							// GPU location for u_ModelMat uniform
    this.u_NormalMatLoc;
  }
  
  VBObox1.prototype.init = function() {
  //=============================================================================
  // Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
  // kept in this VBObox. (This function usually called only once, within main()).
  // Specifically:
  // a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
  //  executable 'program' stored and ready to use inside the GPU.  
  // b) create a new VBO object in GPU memory and fill it by transferring in all
  //  the vertex data held in our Float32array member 'VBOcontents'. 
  // c) Find & save the GPU location of all our shaders' attribute-variables and 
  //  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
  // -------------------
  // CAREFUL!  before you can draw pictures using this VBObox contents, 
  //  you must call this VBObox object's switchToMe() function too!
  //--------------------
  // a) Compile,link,upload shaders-----------------------------------------------
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
      console.log(this.constructor.name + 
                  '.init() failed to create executable Shaders on the GPU. Bye!');
      return;
    }
  // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
  //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}
  
    gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())
  
  // b) Create VBO on GPU, fill it------------------------------------------------
    this.vboLoc = gl.createBuffer();	
    if (!this.vboLoc) {
      console.log(this.constructor.name + 
                  '.init() failed to create VBO in GPU. Bye!'); 
      return;
    }
    // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
    //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
    // (positions, colors, normals, etc), or 
    //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
    // that each select one vertex from a vertex array stored in another VBO.
    gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
                    this.vboLoc);				  // the ID# the GPU uses for this buffer.
  
    // Fill the GPU's newly-created VBO object with the vertex data we stored in
    //  our 'vboContents' member (JavaScript Float32Array object).
    //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
    //    use gl.bufferSubData() to modify VBO contents without changing VBO size)
    gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
                      this.vboContents, 		// JavaScript Float32Array
                     gl.STATIC_DRAW);			// Usage hint.
    //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
    //	(see OpenGL ES specification for more info).  Your choices are:
    //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents rarely or never change.
    //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents may change often as our program runs.
    //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
    // 			times and then discarded; for rapidly supplied & consumed VBOs.
  
    // c1) Find All Attributes:---------------------------------------------------
    //  Find & save the GPU location of all our shaders' attribute-variables and 
    //  uniform-variables (for switchToMe(), adjust(), draw(), reload(),etc.)
    this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos0');
    if(this.a_PosLoc < 0) {
      console.log(this.constructor.name + 
                  '.init() Failed to get GPU location of attribute a_Pos0');
      return -1;	// error exit.
    }

    this.a_NorLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal0');
    if(this.a_NorLoc < 0) {
      console.log(this.constructor.name + 
                  '.init() failed to get the GPU location of attribute a_Normal');
      return -1;	// error exit.
    }

    
    
    // c2) Find All Uniforms:-----------------------------------------------------
    //Get GPU storage location for each uniform var used in our shader programs: 
    this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat0');
    if (!this.u_ModelMatLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_ModelMat1 uniform');
      return;
    }  

    this.u_NormalMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix0');
    if (!this.u_NormalMatLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_ModelMat1 uniform');
      return;
    }  
    this.g_camLoc = gl.getUniformLocation(this.shaderLoc, 'u_cam');
    if (!this.g_camLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_cam uniform');
      return;
    }  
    this.eyeposLoc = gl.getUniformLocation(this.shaderLoc, 'u_eyePos');
    if (!this.eyeposLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_eyepos uniform');
     // return;
    }  
    this.LightModeLoc = gl.getUniformLocation(this.shaderLoc, 'LightM');
    if (!this.LightModeLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for LightM uniform');
      return;
    }  
    
    this.matl0.uLoc_Ke = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet.emit');
    this.matl0.uLoc_Ka = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet.ambi');
    this.matl0.uLoc_Kd = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet.diff');
    this.matl0.uLoc_Ks = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet.spec');
    this.matl0.uLoc_Kshiny = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet.shiny');
    if(!this.matl0.uLoc_Ke || !this.matl0.uLoc_Ka || !this.matl0.uLoc_Kd 
      || !this.matl0.uLoc_Ks || !this.matl0.uLoc_Kshiny
) {
console.log('Failed to get GPUs Reflectance storage locations');
return;
}
    this.L_PosLoc = gl.getUniformLocation(this.shaderLoc, 'Lpos');
    this.L_AmbiLoc = gl.getUniformLocation(this.shaderLoc, 'Lambi');
    this.L_DiffLoc = gl.getUniformLocation(this.shaderLoc, 'Ldiff');
    this.L_SpecLoc = gl.getUniformLocation(this.shaderLoc, 'Lspec');
    if(!this.L_PosLoc || !this.L_AmbiLoc || !this.L_DiffLoc 
      || !this.L_SpecLoc
) {
console.log('Failed to get Light storage locations');
return;
}
  }
  
  VBObox1.prototype.switchToMe = function() {
  //==============================================================================
  // Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
  //
  // We only do this AFTER we called the init() function, which does the one-time-
  // only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
  // even then, you are STILL not ready to draw our VBObox's contents onscreen!
  // We must also first complete these steps:
  //  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
  //  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
  //  c) tell the GPU to connect the shader program's attributes to that VBO.
  
  // a) select our shader program:
    gl.useProgram(this.shaderLoc);	
  //		Each call to useProgram() selects a shader program from the GPU memory,
  // but that's all -- it does nothing else!  Any previously used shader program's 
  // connections to attributes and uniforms are now invalid, and thus we must now
  // establish new connections between our shader program's attributes and the VBO
  // we wish to use.  
    
  // b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
  //  instead connect to our own already-created-&-filled VBO.  This new VBO can 
  //    supply values to use as attributes in our newly-selected shader program:
    gl.bindBuffer(gl.ARRAY_BUFFER,	        // GLenum 'target' for this GPU buffer 
                      this.vboLoc);			    // the ID# the GPU uses for our VBO.
  
  // c) connect our newly-bound VBO to supply attribute variable values for each
  // vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
  // this sets up data paths from VBO to our shader units:
    // 	Here's how to use the almost-identical OpenGL version of this function:
    //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
    gl.vertexAttribPointer(
      this.a_PosLoc,//index == ID# for the attribute var in your GLSL shader pgm;
      this.vboFcount_a_Pos0,// # of floats used by this attribute: 1,2,3 or 4?
      gl.FLOAT,			// type == what data type did we use for those numbers?
      false,				// isNormalized == are these fixed-point values that we need
                    //									normalize before use? true or false
      this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
                    // stored attrib for this vertex to the same stored attrib
                    //  for the next vertex in our VBO.  This is usually the 
                    // number of bytes used to store one complete vertex.  If set 
                    // to zero, the GPU gets attribute values sequentially from 
                    // VBO, starting at 'Offset'.	
                    // (Our vertex size in bytes: 4 floats for pos + 3 for color)
      this.vboOffset_a_Pos0);						
                    // Offset == how many bytes from START of buffer to the first
                    // value we will actually use?  (We start with position).
     // gl.bindBuffer(gl.ARRAY_BUFFER, null);

      gl.vertexAttribPointer(
      this.a_NorLoc,//index == ID# for the attribute var in your GLSL shader pgm;
      this.vboFcount_a_Pos0,// # of floats used by this attribute: 1,2,3 or 4?
      gl.FLOAT,			// type == what data type did we use for those numbers?
      false,				// isNormalized == are these fixed-point values that we need
                    //									normalize before use? true or false
      this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
                    // stored attrib for this vertex to the same stored attrib
                    //  for the next vertex in our VBO.  This is usually the 
                    // number of bytes used to store one complete vertex.  If set 
                    // to zero, the GPU gets attribute values sequentially from 
                    // VBO, starting at 'Offset'.	
                    // (Our vertex size in bytes: 4 floats for pos + 3 for color)
      this.vboOffset_a_Pos0);	
      gl.vertexAttribPointer(this.a_NorLoc, this.vboFcount_a_Colr0, 
        gl.FLOAT, false, 
        this.vboStride, this.vboOffset_a_Colr0);
                  
  // --Enable this assignment of each of these attributes to its' VBO source:
    gl.enableVertexAttribArray(this.a_PosLoc);
  
    gl.enableVertexAttribArray(this.a_NorLoc);
  }
  
  VBObox1.prototype.isReady = function() {
  //==============================================================================
  // Returns 'true' if our WebGL rendering context ('gl') is ready to render using
  // this objects VBO and shader program; else return false.
  // see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter
  
  var isOK = true;
  
    if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
      console.log(this.constructor.name + 
                  '.isReady() false: shader program at this.shaderLoc not in use!');
      isOK = false;
    }
    if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name + 
                '.isReady() false: vbo at this.vboLoc not in use!');
      isOK = false;
    }
    return isOK;
  }
  
  VBObox1.prototype.adjust = function() {
  //==============================================================================
  // Update the GPU to newer, current values we now store for 'uniform' vars on 
  // the GPU; and (if needed) update each attribute's stride and offset in VBO.
  
    // check: was WebGL context set to use our VBO & shader program?
    if(this.isReady()==false) {
          console.log('ERROR! before' + this.constructor.name + 
                '.adjust() call you needed to call this.switchToMe()!!');
    }  

    // Adjust values for our uniforms,
    gl.uniform1i(this.LightModeLoc, lm);
    gl.uniform3f(this.L_PosLoc, L_PosLocR, L_PosLocG, L_PosLocB);
    gl.uniform3f(this.L_AmbiLoc, L_AmbiLocR, L_AmbiLocG, L_AmbiLocB);
    gl.uniform3f(this.L_DiffLoc, L_DiffLocR, L_DiffLocG, L_DiffLocB);
    gl.uniform3f(this.L_SpecLoc, L_SpecLocR, L_SpecLocG, L_SpecLocB);
  
    gl.uniform3fv(this.matl0.uLoc_Ke, this.matl0.K_emit.slice(0,3));				// Ke emissive
	  gl.uniform3fv(this.matl0.uLoc_Ka, this.matl0.K_ambi.slice(0,3));				// Ka ambient
    gl.uniform3fv(this.matl0.uLoc_Kd, this.matl0.K_diff.slice(0,3));				// Kd	diffuse
	  gl.uniform3fv(this.matl0.uLoc_Ks, this.matl0.K_spec.slice(0,3));				// Ks specular
	  gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl0.K_shiny, 10));     // Kshiny 
    this.eyeVec.set([eyex,eyey,eyez]) 
   // console.log(this.eyeVec)
    gl.uniform3fv(this.eyeposLoc, this.eyeVec);// use it to set our uniform
    
    this.ModelMat.setIdentity();
  // THIS DOESN'T WORK!!  this.ModelMatrix = g_worldMat;
	// use our global, shared camera.
  // READY to draw in 'world' coord axes.
    pushMatrix(this.ModelMat);
   
    this.ModelMat.translate(0, 0, 0);							// then translate them.
    this.ModelMat.scale(0.7, 0.7, 0.7)
    this.ModelMat.rotate(g_angleNow0, 0, 0, 1);	  // rotate drawing axes,

    this.camMat.set(g_cam)
    this.camMat.multiply(this.ModelMat);
    gl.uniformMatrix4fv(this.g_camLoc,	// GPU location of the uniform
      false, 				// use matrix transpose instead?
      this.camMat.elements);	// send data from Javascript.
    
    this.NormalMat.setInverseOf(this.ModelMat);
    this.NormalMat.transpose();
    //  Transfer new uniforms' values to the GPU:-------------
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
    gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
                        false, 				// use matrix transpose instead?
                        this.ModelMat.elements);	// send data from Javascript.
    

    gl.uniformMatrix4fv(this.u_NormalMatLoc,	// GPU location of the uniform
                        false, 				// use matrix transpose instead?
                        this.NormalMat.elements);	// send data from Javascript.
    // Adjust the attributes' stride and offset (if necessary)
    // (use gl.vertexAttribPointer() calls and gl.enableVertexAttribArray() calls)
  }
  
  VBObox1.prototype.draw = function() {
  //=============================================================================
  // Render current VBObox contents.
  
    // check: was WebGL context set to use our VBO & shader program?
    if(this.isReady()==false) {
          console.log('ERROR! before' + this.constructor.name + 
                '.draw() call you needed to call this.switchToMe()!!');
    }  
    // ----------------------------Draw the contents of the currently-bound VBO:
    gl.drawArrays(gl.TRIANGLE_STRIP, 	    // select the drawing primitive to draw,
                    // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                    //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
                    0, 								// location of 1st vertex to draw;
                    this.spheNum);		// number of vertices to draw on-screen.
    this.ModelMat = popMatrix();
pushMatrix(this.ModelMat);
this.ModelMat.translate(-0.5, 1.5, 0);
this.ModelMat.scale(0.4, 0.4, 0.4);
this.camMat.set(g_cam)
this.camMat.multiply(this.ModelMat);
gl.uniformMatrix4fv(this.g_camLoc,	// GPU location of the uniform
  false, 				// use matrix transpose instead?
  this.camMat.elements);	// send data from Javascript.
this.NormalMat.setInverseOf(this.ModelMat);
this.NormalMat.transpose();
gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
  false, 				// use matrix transpose instead?
  this.ModelMat.elements);	// send data from Javascript.


gl.uniformMatrix4fv(this.u_NormalMatLoc,	// GPU location of the uniform
  false, 				// use matrix transpose instead?
  this.NormalMat.elements);	// send data from Javascript.

  gl.uniform3fv(this.matl0.uLoc_Ke, this.matl1.K_emit.slice(0,3));				// Ke emissive
  gl.uniform3fv(this.matl0.uLoc_Ka, this.matl1.K_ambi.slice(0,3));				// Ka ambient
  gl.uniform3fv(this.matl0.uLoc_Kd, this.matl1.K_diff.slice(0,3));				// Kd	diffuse
  gl.uniform3fv(this.matl0.uLoc_Ks, this.matl1.K_spec.slice(0,3));				// Ks specular
  gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl1.K_shiny, 10));     // Kshiny 
gl.drawArrays(gl.TRIANGLE_STRIP, 	    // select the drawing primitive to draw,
	// choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
	//          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
	0, 								// location of 1st vertex to draw;
	this.spheNum);		// number of vertices to draw on-screen.

	this.ModelMat.rotate(g_angle04, 0, 1, 0)
	this.ModelMat.translate(0, 0, 1.65);
	this.ModelMat.scale(0.7, 0.7, 0.7);
  this.camMat.set(g_cam)
  this.camMat.multiply(this.ModelMat);
  gl.uniformMatrix4fv(this.g_camLoc,	// GPU location of the uniform
    false, 				// use matrix transpose instead?
    this.camMat.elements);	// send data from Javascript.
	//console.log(g_angle04)
	this.NormalMat.setInverseOf(this.ModelMat);
	this.NormalMat.transpose();
	gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
	  false, 				// use matrix transpose instead?
	  this.ModelMat.elements);	// send data from Javascript.


	gl.uniformMatrix4fv(this.u_NormalMatLoc,	// GPU location of the uniform
	  false, 				// use matrix transpose instead?
	  this.NormalMat.elements);	// send data from Javascript.

	  gl.uniform3fv(this.matl0.uLoc_Ke, this.matl1.K_emit.slice(0,3));				// Ke emissive
	  gl.uniform3fv(this.matl0.uLoc_Ka, this.matl1.K_ambi.slice(0,3));				// Ka ambient
	  gl.uniform3fv(this.matl0.uLoc_Kd, this.matl1.K_diff.slice(0,3));				// Kd	diffuse
	  gl.uniform3fv(this.matl0.uLoc_Ks, this.matl1.K_spec.slice(0,3));				// Ks specular
	  gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl1.K_shiny, 10));     // Kshiny 
	gl.drawArrays(gl.TRIANGLE_STRIP, 	    // select the drawing primitive to draw,
		// choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
		//          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
		0, 								// location of 1st vertex to draw;
		this.spheNum);		// number of vertices to draw on-screen.

		this.ModelMat.rotate(1.5 * g_angle04, 0, 1, 0)
		this.ModelMat.translate(0, 0, 1.65);
		this.ModelMat.scale(0.7, 0.7, 0.7);
    this.camMat.set(g_cam)
    this.camMat.multiply(this.ModelMat);
    gl.uniformMatrix4fv(this.g_camLoc,	// GPU location of the uniform
      false, 				// use matrix transpose instead?
      this.camMat.elements);	// send data from Javascript.
	//    console.log(g_angle04)
		this.NormalMat.setInverseOf(this.ModelMat);
		this.NormalMat.transpose();
		gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
		  false, 				// use matrix transpose instead?
		  this.ModelMat.elements);	// send data from Javascript.
	
	
		gl.uniformMatrix4fv(this.u_NormalMatLoc,	// GPU location of the uniform
		  false, 				// use matrix transpose instead?
		  this.NormalMat.elements);	// send data from Javascript.
	
		  gl.uniform3fv(this.matl0.uLoc_Ke, this.matl1.K_emit.slice(0,3));				// Ke emissive
		  gl.uniform3fv(this.matl0.uLoc_Ka, this.matl1.K_ambi.slice(0,3));				// Ka ambient
		  gl.uniform3fv(this.matl0.uLoc_Kd, this.matl1.K_diff.slice(0,3));				// Kd	diffuse
		  gl.uniform3fv(this.matl0.uLoc_Ks, this.matl1.K_spec.slice(0,3));				// Ks specular
		  gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl1.K_shiny, 10));     // Kshiny 
		gl.drawArrays(gl.TRIANGLE_STRIP, 	    // select the drawing primitive to draw,
			// choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
			//          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
			0, 								// location of 1st vertex to draw;
			this.spheNum);		// number of vertices to draw on-screen.
   
      this.ModelMat = popMatrix();
      pushMatrix(this.ModelMat);
      this.ModelMat.rotate(g_angle04, 0, 0, 1)
    this.ModelMat.translate(-2, -1, 0);
	this.ModelMat.scale(0.7, 0.7, 0.7);
  this.camMat.set(g_cam)
  this.camMat.multiply(this.ModelMat);
  gl.uniformMatrix4fv(this.g_camLoc,	// GPU location of the uniform
    false, 				// use matrix transpose instead?
    this.camMat.elements);	// send data from Javascript.
	//console.log(g_angle04)
	this.NormalMat.setInverseOf(this.ModelMat);
	this.NormalMat.transpose();
	gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
	  false, 				// use matrix transpose instead?
	  this.ModelMat.elements);	// send data from Javascript.


	gl.uniformMatrix4fv(this.u_NormalMatLoc,	// GPU location of the uniform
	  false, 				// use matrix transpose instead?
	  this.NormalMat.elements);	// send data from Javascript.

    gl.uniform3fv(this.matl0.uLoc_Ke, this.matl2.K_emit.slice(0,3));				// Ke emissive
    gl.uniform3fv(this.matl0.uLoc_Ka, this.matl2.K_ambi.slice(0,3));				// Ka ambient
    gl.uniform3fv(this.matl0.uLoc_Kd, this.matl2.K_diff.slice(0,3));				// Kd	diffuse
    gl.uniform3fv(this.matl0.uLoc_Ks, this.matl2.K_spec.slice(0,3));				// Ks specular
    gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl2.K_shiny, 10));     // Kshiny 
    gl.drawArrays(gl.TRIANGLE_STRIP, 	    // select the drawing primitive to draw,
			// choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
			//          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
			this.TStart/floatsPerVertex, 								// location of 1st vertex to draw;
			12);		// number of vertices to draw on-screen.



      this.ModelMat.rotate(g_angle04, 0, 0, 1)
    this.ModelMat.translate(0, 0, 1.5);
    this.ModelMat.rotate(g_angle04, 1, 1, 1)
	this.ModelMat.scale(0.7, 0.7, 0.7);
  this.camMat.set(g_cam)
  this.camMat.multiply(this.ModelMat);
  gl.uniformMatrix4fv(this.g_camLoc,	// GPU location of the uniform
    false, 				// use matrix transpose instead?
    this.camMat.elements);	// send data from Javascript.
	//console.log(g_angle04)
	this.NormalMat.setInverseOf(this.ModelMat);
	this.NormalMat.transpose();
	gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
	  false, 				// use matrix transpose instead?
	  this.ModelMat.elements);	// send data from Javascript.


	gl.uniformMatrix4fv(this.u_NormalMatLoc,	// GPU location of the uniform
	  false, 				// use matrix transpose instead?
	  this.NormalMat.elements);	// send data from Javascript.

    gl.uniform3fv(this.matl0.uLoc_Ke, this.matl3.K_emit.slice(0,3));				// Ke emissive
    gl.uniform3fv(this.matl0.uLoc_Ka, this.matl3.K_ambi.slice(0,3));				// Ka ambient
    gl.uniform3fv(this.matl0.uLoc_Kd, this.matl3.K_diff.slice(0,3));				// Kd	diffuse
    gl.uniform3fv(this.matl0.uLoc_Ks, this.matl3.K_spec.slice(0,3));				// Ks specular
    gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl3.K_shiny, 10));     // Kshiny 
    gl.drawArrays(gl.TRIANGLE_STRIP, 	    // select the drawing primitive to draw,
			// choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
			//          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
			this.TStart/floatsPerVertex, 								// location of 1st vertex to draw;
			12);		// number of vertices to draw on-screen.

  
      this.ModelMat.rotate(g_angle04, 0, 0, 1)
    this.ModelMat.translate(0, 0, 1.8);
    this.ModelMat.rotate(g_angle04, 1, 1, 1)
	this.ModelMat.scale(0.4, 0.4, 0.4);
  this.camMat.set(g_cam)
  this.camMat.multiply(this.ModelMat);
  gl.uniformMatrix4fv(this.g_camLoc,	// GPU location of the uniform
    false, 				// use matrix transpose instead?
    this.camMat.elements);	// send data from Javascript.
	//console.log(g_angle04)
	this.NormalMat.setInverseOf(this.ModelMat);
	this.NormalMat.transpose();
	gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
	  false, 				// use matrix transpose instead?
	  this.ModelMat.elements);	// send data from Javascript.


	gl.uniformMatrix4fv(this.u_NormalMatLoc,	// GPU location of the uniform
	  false, 				// use matrix transpose instead?
	  this.NormalMat.elements);	// send data from Javascript.

    gl.uniform3fv(this.matl0.uLoc_Ke, this.matl0.K_emit.slice(0,3));				// Ke emissive
    gl.uniform3fv(this.matl0.uLoc_Ka, this.matl0.K_ambi.slice(0,3));				// Ka ambient
    gl.uniform3fv(this.matl0.uLoc_Kd, this.matl0.K_diff.slice(0,3));				// Kd	diffuse
    gl.uniform3fv(this.matl0.uLoc_Ks, this.matl0.K_spec.slice(0,3));				// Ks specular
    gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl0.K_shiny, 10));     // Kshiny 
		gl.drawArrays(gl.TRIANGLE_STRIP, 	    // select the drawing primitive to draw,
			// choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
			//          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
			0, 								// location of 1st vertex to draw;
			this.spheNum);		// number of vertices to draw on-screen.


      this.ModelMat = popMatrix();
      pushMatrix(this.ModelMat);

   this.ModelMat.translate(2, -3, 2);
    
	this.ModelMat.scale(0.5, 0.5, 0.5);
  this.ModelMat.rotate(g_angleNow0, 1, 1, 0);	  // rotate drawing axes,
  this.camMat.set(g_cam)
  this.camMat.multiply(this.ModelMat);
  gl.uniformMatrix4fv(this.g_camLoc,	// GPU location of the uniform
    false, 				// use matrix transpose instead?
    this.camMat.elements);	// send data from Javascript.
	//console.log(g_angle04)
	this.NormalMat.setInverseOf(this.ModelMat);
	this.NormalMat.transpose();
	gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
	  false, 				// use matrix transpose instead?
	  this.ModelMat.elements);	// send data from Javascript.


	gl.uniformMatrix4fv(this.u_NormalMatLoc,	// GPU location of the uniform
	  false, 				// use matrix transpose instead?
	  this.NormalMat.elements);	// send data from Javascript.

    gl.uniform3fv(this.matl0.uLoc_Ke, this.matl4.K_emit.slice(0,3));				// Ke emissive
    gl.uniform3fv(this.matl0.uLoc_Ka, this.matl4.K_ambi.slice(0,3));				// Ka ambient
    gl.uniform3fv(this.matl0.uLoc_Kd, this.matl4.K_diff.slice(0,3));				// Kd	diffuse
    gl.uniform3fv(this.matl0.uLoc_Ks, this.matl4.K_spec.slice(0,3));				// Ks specular
    gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl4.K_shiny, 10));     // Kshiny 
    gl.drawArrays(gl.TRIANGLE_STRIP, 	    // select the drawing primitive to draw,
			// choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
			//          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
			this.custart/floatsPerVertex, 								// location of 1st vertex to draw;
			cube.length/7);		// number of vertices to draw on-screen.



      this.ModelMat.translate(0, 0, 1.5);
      this.ModelMat.translate(  g_shift03,0,0)
      this.ModelMat.scale(0.5, 0.5, 0.5);
     // this.ModelMat.rotate(g_angleNow0, 1, 1, 0);	  // rotate drawing axes,
      this.camMat.set(g_cam)
      this.camMat.multiply(this.ModelMat);
      gl.uniformMatrix4fv(this.g_camLoc,	// GPU location of the uniform
        false, 				// use matrix transpose instead?
        this.camMat.elements);	// send data from Javascript.
      //console.log(g_angle04)
      this.NormalMat.setInverseOf(this.ModelMat);
      this.NormalMat.transpose();
      gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
        false, 				// use matrix transpose instead?
        this.ModelMat.elements);	// send data from Javascript.
    
    
      gl.uniformMatrix4fv(this.u_NormalMatLoc,	// GPU location of the uniform
        false, 				// use matrix transpose instead?
        this.NormalMat.elements);	// send data from Javascript.
    
        gl.uniform3fv(this.matl0.uLoc_Ke, this.matl3.K_emit.slice(0,3));				// Ke emissive
        gl.uniform3fv(this.matl0.uLoc_Ka, this.matl3.K_ambi.slice(0,3));				// Ka ambient
        gl.uniform3fv(this.matl0.uLoc_Kd, this.matl3.K_diff.slice(0,3));				// Kd	diffuse
        gl.uniform3fv(this.matl0.uLoc_Ks, this.matl3.K_spec.slice(0,3));				// Ks specular
        gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl3.K_shiny, 10));     // Kshiny 
        gl.drawArrays(gl.TRIANGLE_STRIP, 	    // select the drawing primitive to draw,
          // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
          //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
          this.custart/floatsPerVertex, 								// location of 1st vertex to draw;
          cube.length/7);		// number of vertices to draw on-screen.

      
         
          this.ModelMat.translate(0, 0, 2.28);
          this.ModelMat.rotate(180, 0, 1, 0)
          this.ModelMat.rotate(g_angle04, 1, 1, 1)
      
        this.camMat.set(g_cam)
        this.camMat.multiply(this.ModelMat);
        gl.uniformMatrix4fv(this.g_camLoc,	// GPU location of the uniform
          false, 				// use matrix transpose instead?
          this.camMat.elements);	// send data from Javascript.
        //console.log(g_angle04)
        this.NormalMat.setInverseOf(this.ModelMat);
        this.NormalMat.transpose();
        gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
          false, 				// use matrix transpose instead?
          this.ModelMat.elements);	// send data from Javascript.
      
      
        gl.uniformMatrix4fv(this.u_NormalMatLoc,	// GPU location of the uniform
          false, 				// use matrix transpose instead?
          this.NormalMat.elements);	// send data from Javascript.
      
          gl.uniform3fv(this.matl0.uLoc_Ke, this.matl1.K_emit.slice(0,3));				// Ke emissive
          gl.uniform3fv(this.matl0.uLoc_Ka, this.matl1.K_ambi.slice(0,3));				// Ka ambient
          gl.uniform3fv(this.matl0.uLoc_Kd, this.matl1.K_diff.slice(0,3));				// Kd	diffuse
          gl.uniform3fv(this.matl0.uLoc_Ks, this.matl1.K_spec.slice(0,3));				// Ks specular
          gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl1.K_shiny, 10));     // Kshiny 
          gl.drawArrays(gl.TRIANGLE_STRIP, 	    // select the drawing primitive to draw,
            // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
            //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
            this.TStart/floatsPerVertex, 								// location of 1st vertex to draw;
            12);		// number of vertices to draw on-screen.
  
  

  }
  
  VBObox1.prototype.reload = function() {
  //=============================================================================
  // Over-write current values in the GPU inside our already-created VBO: use 
  // gl.bufferSubData() call to re-transfer some or all of our Float32Array 
  // contents to our VBO without changing any GPU memory allocations.
  
   gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                    0,                  // byte offset to where data replacement
                                        // begins in the VBO.
                      this.vboContents);   // the JS source-data array used to fill VBO
  
  }

/*
VBObox1.prototype.empty = function() {
//=============================================================================
// Remove/release all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  However, make sure this step is reversible by a call to 
// 'restoreMe()': be sure to retain all our Float32Array data, all values for 
// uniforms, all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}

VBObox1.prototype.restore = function() {
//=============================================================================
// Replace/restore all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  Use our retained Float32Array data, all values for  uniforms, 
// all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}
*/

//=============================================================================
//=============================================================================
function VBObox2() {
  //=============================================================================
  //=============================================================================
  // CONSTRUCTOR for one re-usable 'VBObox0' object that holds all data and fcns
  // needed to render vertices from one Vertex Buffer Object (VBO) using one 
  // separate shader program (a vertex-shader & fragment-shader pair) and one
  // set of 'uniform' variables.
  
  // Constructor goal: 
  // Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
  // written into code) in all other VBObox functions. Keeping all these (initial)
  // values here, in this one coonstrutor function, ensures we can change them 
  // easily WITHOUT disrupting any other code, ever!
    
    this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
    'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
    'uniform mat4 u_ModelMat0;\n' +
    'uniform mat4 u_NormalMatrix0;\n' +
    'uniform mat4 u_cam1;\n' +
    'uniform vec3 u_eyePos1;\n' +
    'attribute vec4 a_Pos0;\n' +
    'attribute vec3 a_Normal0;\n' +
    'varying vec4 a_Pos1;\n' +				
    'varying vec3 a_Normal1;\n' +	
  
    'varying vec3 u_eyePos; \n' +
    //
    'void main() {\n' +
    '  a_Normal1 = normalize(vec3(u_NormalMatrix0 * vec4(a_Normal0, 1.0)));\n' +
    '  a_Pos1 = u_ModelMat0 * a_Pos0;\n' +
    '  gl_Position = u_cam1 * a_Pos0;\n' +
    '  u_eyePos = u_eyePos1;\n' +
    ' }\n';
  
    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
    'precision mediump float;\n' +
    //
    'uniform vec3 Lpos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position                         //		   w==0.0 for distant light from x,y,z direction 
    'uniform vec3 Lambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
    'uniform vec3 Ldiff;\n' +			// Id ==  diffuse light source strength (r,g,b)
    'uniform vec3 Lspec;\n' +			// Is == specular light source strength (r,g,b)
    'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
    '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
    '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
    '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
    '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
    '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
    '		};\n' +
    'uniform MatlT u_MatlSet;\n' +		// Array of all materials.
    'varying vec4 a_Pos1;\n' +				
    'varying vec3 a_Normal1;\n' +
 
    'varying vec3 u_eyePos; \n' +
    'uniform int LightM;\n' +

    'void main() {\n' +
    '  if (LightM == 1) {\n' +
    '  vec4 vertP = a_Pos1;\n' +
    '  vec3 normal = normalize(a_Normal1);\n' +
    '  vec3 lightDirection = normalize(Lpos - vec3(vertP));\n' +
    '  vec3 eyeDirection = normalize(u_eyePos - vec3(vertP)); \n' +
    '  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
    '  vec3 diffuse = u_MatlSet.diff * Ldiff * nDotL;\n' +
    '  vec3 ambient = Lambi * u_MatlSet.ambi;\n' +
    '  float e64 = 0.0;\n' +
    '  if (nDotL != 0.0) { \n' +
    '  vec3 R = reflect(-lightDirection, normal);\n' +
    '  vec3 V = normalize(eyeDirection);\n' +
    '  float DRV = dot(R, V);\n' +
    '  float specA = max(DRV, 0.0);\n' + 
    '  e64 = pow(specA, float(u_MatlSet.shiny));\n' +
    '}\n' + 
    '	 vec3 speculr = u_MatlSet.spec * Lspec * e64;\n' +
    '	 gl_FragColor = vec4(diffuse + ambient + speculr + u_MatlSet.emit, 1.0);\n' +
    '}\n' +
    ' else {\n' +
    '  vec4 vertP = a_Pos1;\n' +
    '  vec3 normal = normalize(a_Normal1);\n' +
    '  vec3 lightDirection = normalize(Lpos - vec3(vertP));\n' +
    '  vec3 eyeDirection = normalize(u_eyePos - vec3(vertP)); \n' +
    '  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
    '  vec3 diffuse = u_MatlSet.diff * Ldiff * nDotL;\n' +
    '  vec3 ambient = Lambi * u_MatlSet.ambi;\n' +
    '  float e64 = 0.0;\n' +

    '  vec3 H = normalize(lightDirection + eyeDirection); \n' +
    '  float DNH = max(dot(H, normal), 0.0);\n' +
    '  float specA = max(DNH, 0.0);\n' + 
    '  e64 = pow(specA, float(u_MatlSet.shiny));\n' +

    '	 vec3 speculr = u_MatlSet.spec * Lspec * e64;\n' +
    '  gl_FragColor = vec4(diffuse + ambient + speculr + u_MatlSet.emit, 1.0);\n' + 
    '}\n' +
    ' }\n';
  
    makeSphere()
    makeT()
    makeCube()
    this.vboContents = new Float32Array(sphVerts.length + colorShapes.length + cube.length)
    this.vboContents.set(sphVerts, 0)
    this.spheNum = sphVerts.length / 7;
    this.TStart = sphVerts.length;
    this.vboContents.set(colorShapes, sphVerts.length)
    this.custart = sphVerts.length + colorShapes.length;
    this.vboContents.set(cube, sphVerts.length + colorShapes.length)
   console.log(cube.length)
    
    this.vboVerts = this.vboContents.length / 7;					
    // # of vertices held in 'vboContents' array					// # of vertices held in 'vboContents' array
   
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
                                  // bytes req'd by 1 vboContents array element;
                                  // (why? used to compute stride and offset 
                                  // in bytes for vertexAttribPointer() calls)
    this.vboBytes = this.vboContents.length * this.FSIZE;               
                                  // total number of bytes stored in vboContents
                                  // (#  of floats in vboContents array) * 
                                  // (# of bytes/float).
     
    this.vboStride = this.vboBytes / this.vboVerts; 
                                  // (== # of bytes to store one complete vertex).
                                  // From any attrib in a given vertex in the VBO, 
                                  // move forward by 'vboStride' bytes to arrive 
                                  // at the same attrib for the next vertex. 
  
                //----------------------Attribute sizes
    this.vboFcount_a_Pos0 =  4;    // # of floats in the VBO needed to store the
                                  // attribute named a_Pos0. (4: x,y,z,w values)
    this.vboFcount_a_Colr0 = 3;   // # of floats for this attrib (r,g,b values) 
  
  
  
    console.assert((this.vboFcount_a_Pos0 +     // check the size of each and
                    this.vboFcount_a_Colr0) *   // every attribute in our VBO
                    this.FSIZE == this.vboStride, // for agreeement with'stride'
                    "Uh oh! VBObox0.vboStride disagrees with attribute-size values!");
  
                //----------------------Attribute offsets  
    this.vboOffset_a_Pos0 = 0;    // # of bytes from START of vbo to the START
                                  // of 1st a_Pos0 attrib value in vboContents[]
    this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;    
                                  // (4 floats * bytes/float) 
                                  // # of bytes from START of vbo to the START
                                  // of 1st a_Colr0 attrib value in vboContents[]
                //-----------------------GPU memory locations:
    this.vboLoc;									// GPU Location for Vertex Buffer Object, 
                                  // returned by gl.createBuffer() function call
    this.shaderLoc;								// GPU Location for compiled Shader-program  
                                  // set by compile/link of VERT_SRC and FRAG_SRC.
                            //------Attribute locations in our shaders:
    this.a_PosLoc;								// GPU location for 'a_Pos0' attribute
    this.a_ColrLoc;								// GPU location for 'a_Colr0' attribute
    this.a_NorLoc;
    this.u_LightPosition;
    this.u_LightColor;
    this.u_AmbientLight;
    this.L_PosLoc;								// GPU location for 'a_Pos0' attribute
    this.L_AmbiLoc;								// GPU location for 'a_Colr0' attribute
    this.L_DiffLoc;
    this.L_SpecLoc;
    this.LightModeLoc;
    this.eyeposLoc;
    this.g_camLoc;
    this.matl0 = new Material(1);
    this.matl1 = new Material(6);
    this.matl2 = new Material(7);
    this.matl3 = new Material(2);
    this.matl4 = new Material(3);
    
                //---------------------- Uniform locations &values in our shaders
    this.ModelMat = new Matrix4();	// Transforms CVV axes to model axes.
    this.NormalMat = new Matrix4();
    this.camMat = new Matrix4();
    this.eyeVec = new Float32Array(3);
    this.u_ModelMatLoc;							// GPU location for u_ModelMat uniform
    this.u_NormalMatLoc;
  }
  
  VBObox2.prototype.init = function() {
    //=============================================================================
    // Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
    // kept in this VBObox. (This function usually called only once, within main()).
    // Specifically:
    // a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
    //  executable 'program' stored and ready to use inside the GPU.  
    // b) create a new VBO object in GPU memory and fill it by transferring in all
    //  the vertex data held in our Float32array member 'VBOcontents'. 
    // c) Find & save the GPU location of all our shaders' attribute-variables and 
    //  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
    // -------------------
    // CAREFUL!  before you can draw pictures using this VBObox contents, 
    //  you must call this VBObox object's switchToMe() function too!
    //--------------------
    // a) Compile,link,upload shaders-----------------------------------------------
      this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
      if (!this.shaderLoc) {
        console.log(this.constructor.name + 
                    '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
      }
    // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
    //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}
    
      gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())
    
    // b) Create VBO on GPU, fill it------------------------------------------------
      this.vboLoc = gl.createBuffer();	
      if (!this.vboLoc) {
        console.log(this.constructor.name + 
                    '.init() failed to create VBO in GPU. Bye!'); 
        return;
      }
      // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
      //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
      // (positions, colors, normals, etc), or 
      //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
      // that each select one vertex from a vertex array stored in another VBO.
      gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
                      this.vboLoc);				  // the ID# the GPU uses for this buffer.
    
      // Fill the GPU's newly-created VBO object with the vertex data we stored in
      //  our 'vboContents' member (JavaScript Float32Array object).
      //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
      //    use gl.bufferSubData() to modify VBO contents without changing VBO size)
      gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
                        this.vboContents, 		// JavaScript Float32Array
                       gl.STATIC_DRAW);			// Usage hint.
      //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
      //	(see OpenGL ES specification for more info).  Your choices are:
      //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
      //				contents rarely or never change.
      //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
      //				contents may change often as our program runs.
      //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
      // 			times and then discarded; for rapidly supplied & consumed VBOs.
    
      // c1) Find All Attributes:---------------------------------------------------
      //  Find & save the GPU location of all our shaders' attribute-variables and 
      //  uniform-variables (for switchToMe(), adjust(), draw(), reload(),etc.)
      this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos0');
      if(this.a_PosLoc < 0) {
        console.log(this.constructor.name + 
                    '.init() Failed to get GPU location of attribute a_Pos0');
        return -1;	// error exit.
      }
  
      this.a_NorLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal0');
      if(this.a_NorLoc < 0) {
        console.log(this.constructor.name + 
                    '.init() failed to get the GPU location of attribute a_Normal');
        return -1;	// error exit.
      }
  
      
      
      // c2) Find All Uniforms:-----------------------------------------------------
      //Get GPU storage location for each uniform var used in our shader programs: 
      this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat0');
      if (!this.u_ModelMatLoc) { 
        console.log(this.constructor.name + 
                    '.init() failed to get GPU location for u_ModelMat1 uniform');
        return;
      }  
  
      this.u_NormalMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix0');
      if (!this.u_NormalMatLoc) { 
        console.log(this.constructor.name + 
                    '.init() failed to get GPU location for u_ModelMat1 uniform');
        return;
      }  
      this.g_camLoc = gl.getUniformLocation(this.shaderLoc, 'u_cam1');
      if (!this.g_camLoc) { 
        console.log(this.constructor.name + 
                    '.init() failed to get GPU location for u_cam uniform');
        return;
      }  
      this.eyeposLoc = gl.getUniformLocation(this.shaderLoc, 'u_eyePos1');
      if (!this.eyeposLoc) { 
        console.log(this.constructor.name + 
                    '.init() failed to get GPU location for u_eyepos uniform');
       // return;
      }  
      this.LightModeLoc = gl.getUniformLocation(this.shaderLoc, 'LightM');
      if (!this.LightModeLoc) { 
        console.log(this.constructor.name + 
                    '.init() failed to get GPU location for LightM uniform');
        return;
      }  
      
      this.matl0.uLoc_Ke = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet.emit');
      this.matl0.uLoc_Ka = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet.ambi');
      this.matl0.uLoc_Kd = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet.diff');
      this.matl0.uLoc_Ks = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet.spec');
      this.matl0.uLoc_Kshiny = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet.shiny');
      if(!this.matl0.uLoc_Ke || !this.matl0.uLoc_Ka || !this.matl0.uLoc_Kd 
        || !this.matl0.uLoc_Ks || !this.matl0.uLoc_Kshiny
  ) {
  console.log('Failed to get GPUs Reflectance storage locations');
  return;
  }
      this.L_PosLoc = gl.getUniformLocation(this.shaderLoc, 'Lpos');
      this.L_AmbiLoc = gl.getUniformLocation(this.shaderLoc, 'Lambi');
      this.L_DiffLoc = gl.getUniformLocation(this.shaderLoc, 'Ldiff');
      this.L_SpecLoc = gl.getUniformLocation(this.shaderLoc, 'Lspec');
      if(!this.L_PosLoc || !this.L_AmbiLoc || !this.L_DiffLoc 
        || !this.L_SpecLoc
  ) {
  console.log('Failed to get Light storage locations');
  return;
  }
    }
    
    VBObox2.prototype.switchToMe = function() {
    //==============================================================================
    // Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
    //
    // We only do this AFTER we called the init() function, which does the one-time-
    // only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
    // even then, you are STILL not ready to draw our VBObox's contents onscreen!
    // We must also first complete these steps:
    //  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
    //  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
    //  c) tell the GPU to connect the shader program's attributes to that VBO.
    
    // a) select our shader program:
      gl.useProgram(this.shaderLoc);	
    //		Each call to useProgram() selects a shader program from the GPU memory,
    // but that's all -- it does nothing else!  Any previously used shader program's 
    // connections to attributes and uniforms are now invalid, and thus we must now
    // establish new connections between our shader program's attributes and the VBO
    // we wish to use.  
      
    // b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
    //  instead connect to our own already-created-&-filled VBO.  This new VBO can 
    //    supply values to use as attributes in our newly-selected shader program:
      gl.bindBuffer(gl.ARRAY_BUFFER,	        // GLenum 'target' for this GPU buffer 
                        this.vboLoc);			    // the ID# the GPU uses for our VBO.
    
    // c) connect our newly-bound VBO to supply attribute variable values for each
    // vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
    // this sets up data paths from VBO to our shader units:
      // 	Here's how to use the almost-identical OpenGL version of this function:
      //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
      gl.vertexAttribPointer(
        this.a_PosLoc,//index == ID# for the attribute var in your GLSL shader pgm;
        this.vboFcount_a_Pos0,// # of floats used by this attribute: 1,2,3 or 4?
        gl.FLOAT,			// type == what data type did we use for those numbers?
        false,				// isNormalized == are these fixed-point values that we need
                      //									normalize before use? true or false
        this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
                      // stored attrib for this vertex to the same stored attrib
                      //  for the next vertex in our VBO.  This is usually the 
                      // number of bytes used to store one complete vertex.  If set 
                      // to zero, the GPU gets attribute values sequentially from 
                      // VBO, starting at 'Offset'.	
                      // (Our vertex size in bytes: 4 floats for pos + 3 for color)
        this.vboOffset_a_Pos0);						
                      // Offset == how many bytes from START of buffer to the first
                      // value we will actually use?  (We start with position).
       // gl.bindBuffer(gl.ARRAY_BUFFER, null);
  
        gl.vertexAttribPointer(
        this.a_NorLoc,//index == ID# for the attribute var in your GLSL shader pgm;
        this.vboFcount_a_Pos0,// # of floats used by this attribute: 1,2,3 or 4?
        gl.FLOAT,			// type == what data type did we use for those numbers?
        false,				// isNormalized == are these fixed-point values that we need
                      //									normalize before use? true or false
        this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
                      // stored attrib for this vertex to the same stored attrib
                      //  for the next vertex in our VBO.  This is usually the 
                      // number of bytes used to store one complete vertex.  If set 
                      // to zero, the GPU gets attribute values sequentially from 
                      // VBO, starting at 'Offset'.	
                      // (Our vertex size in bytes: 4 floats for pos + 3 for color)
        this.vboOffset_a_Pos0);	
        gl.vertexAttribPointer(this.a_NorLoc, this.vboFcount_a_Colr0, 
          gl.FLOAT, false, 
          this.vboStride, this.vboOffset_a_Colr0);
                    
    // --Enable this assignment of each of these attributes to its' VBO source:
      gl.enableVertexAttribArray(this.a_PosLoc);
    
      gl.enableVertexAttribArray(this.a_NorLoc);
    }
    
    VBObox2.prototype.isReady = function() {
    //==============================================================================
    // Returns 'true' if our WebGL rendering context ('gl') is ready to render using
    // this objects VBO and shader program; else return false.
    // see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter
    
    var isOK = true;
    
      if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
        console.log(this.constructor.name + 
                    '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
      }
      if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
          console.log(this.constructor.name + 
                  '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
      }
      return isOK;
    }
    
    VBObox2.prototype.adjust = function() {
    //==============================================================================
    // Update the GPU to newer, current values we now store for 'uniform' vars on 
    // the GPU; and (if needed) update each attribute's stride and offset in VBO.
    
      // check: was WebGL context set to use our VBO & shader program?
      if(this.isReady()==false) {
            console.log('ERROR! before' + this.constructor.name + 
                  '.adjust() call you needed to call this.switchToMe()!!');
      }  
  
      // Adjust values for our uniforms,
      gl.uniform1i(this.LightModeLoc, lm);
      gl.uniform3f(this.L_PosLoc, L_PosLocR, L_PosLocG, L_PosLocB);
      gl.uniform3f(this.L_AmbiLoc, L_AmbiLocR, L_AmbiLocG, L_AmbiLocB);
      gl.uniform3f(this.L_DiffLoc, L_DiffLocR, L_DiffLocG, L_DiffLocB);
      gl.uniform3f(this.L_SpecLoc, L_SpecLocR, L_SpecLocG, L_SpecLocB);
    
      gl.uniform3fv(this.matl0.uLoc_Ke, this.matl0.K_emit.slice(0,3));				// Ke emissive
      gl.uniform3fv(this.matl0.uLoc_Ka, this.matl0.K_ambi.slice(0,3));				// Ka ambient
      gl.uniform3fv(this.matl0.uLoc_Kd, this.matl0.K_diff.slice(0,3));				// Kd	diffuse
      gl.uniform3fv(this.matl0.uLoc_Ks, this.matl0.K_spec.slice(0,3));				// Ks specular
      gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl0.K_shiny, 10));     // Kshiny 
      this.eyeVec.set([eyex,eyey,eyez]) 
     // console.log(this.eyeVec)
      gl.uniform3fv(this.eyeposLoc, this.eyeVec);// use it to set our uniform
      
      this.ModelMat.setIdentity();
    // THIS DOESN'T WORK!!  this.ModelMatrix = g_worldMat;
    // use our global, shared camera.
    // READY to draw in 'world' coord axes.
      pushMatrix(this.ModelMat);
     
      this.ModelMat.translate(0, 0, 0);							// then translate them.
      this.ModelMat.scale(0.7, 0.7, 0.7)
      this.ModelMat.rotate(g_angleNow0, 0, 0, 1);	  // rotate drawing axes,
  
      this.camMat.set(g_cam)
      this.camMat.multiply(this.ModelMat);
      gl.uniformMatrix4fv(this.g_camLoc,	// GPU location of the uniform
        false, 				// use matrix transpose instead?
        this.camMat.elements);	// send data from Javascript.
      
      this.NormalMat.setInverseOf(this.ModelMat);
      this.NormalMat.transpose();
      //  Transfer new uniforms' values to the GPU:-------------
      // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
      gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
                          false, 				// use matrix transpose instead?
                          this.ModelMat.elements);	// send data from Javascript.
      
  
      gl.uniformMatrix4fv(this.u_NormalMatLoc,	// GPU location of the uniform
                          false, 				// use matrix transpose instead?
                          this.NormalMat.elements);	// send data from Javascript.
      // Adjust the attributes' stride and offset (if necessary)
      // (use gl.vertexAttribPointer() calls and gl.enableVertexAttribArray() calls)
    }
    
    VBObox2.prototype.draw = function() {
    //=============================================================================
    // Render current VBObox contents.
    
      // check: was WebGL context set to use our VBO & shader program?
      if(this.isReady()==false) {
            console.log('ERROR! before' + this.constructor.name + 
                  '.draw() call you needed to call this.switchToMe()!!');
      }  
      // ----------------------------Draw the contents of the currently-bound VBO:
      gl.drawArrays(gl.TRIANGLE_STRIP, 	    // select the drawing primitive to draw,
                      // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                      //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
                      0, 								// location of 1st vertex to draw;
                      this.spheNum);		// number of vertices to draw on-screen.
      this.ModelMat = popMatrix();
  pushMatrix(this.ModelMat);
  this.ModelMat.translate(-0.5, 1.5, 0);
  this.ModelMat.scale(0.4, 0.4, 0.4);
  this.camMat.set(g_cam)
  this.camMat.multiply(this.ModelMat);
  gl.uniformMatrix4fv(this.g_camLoc,	// GPU location of the uniform
    false, 				// use matrix transpose instead?
    this.camMat.elements);	// send data from Javascript.
  this.NormalMat.setInverseOf(this.ModelMat);
  this.NormalMat.transpose();
  gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
    false, 				// use matrix transpose instead?
    this.ModelMat.elements);	// send data from Javascript.
  
  
  gl.uniformMatrix4fv(this.u_NormalMatLoc,	// GPU location of the uniform
    false, 				// use matrix transpose instead?
    this.NormalMat.elements);	// send data from Javascript.
  
    gl.uniform3fv(this.matl0.uLoc_Ke, this.matl1.K_emit.slice(0,3));				// Ke emissive
    gl.uniform3fv(this.matl0.uLoc_Ka, this.matl1.K_ambi.slice(0,3));				// Ka ambient
    gl.uniform3fv(this.matl0.uLoc_Kd, this.matl1.K_diff.slice(0,3));				// Kd	diffuse
    gl.uniform3fv(this.matl0.uLoc_Ks, this.matl1.K_spec.slice(0,3));				// Ks specular
    gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl1.K_shiny, 10));     // Kshiny 
  gl.drawArrays(gl.TRIANGLE_STRIP, 	    // select the drawing primitive to draw,
    // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
    //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
    0, 								// location of 1st vertex to draw;
    this.spheNum);		// number of vertices to draw on-screen.
  
    this.ModelMat.rotate(g_angle04, 0, 1, 0)
    this.ModelMat.translate(0, 0, 1.65);
    this.ModelMat.scale(0.7, 0.7, 0.7);
    this.camMat.set(g_cam)
    this.camMat.multiply(this.ModelMat);
    gl.uniformMatrix4fv(this.g_camLoc,	// GPU location of the uniform
      false, 				// use matrix transpose instead?
      this.camMat.elements);	// send data from Javascript.
    //console.log(g_angle04)
    this.NormalMat.setInverseOf(this.ModelMat);
    this.NormalMat.transpose();
    gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
      false, 				// use matrix transpose instead?
      this.ModelMat.elements);	// send data from Javascript.
  
  
    gl.uniformMatrix4fv(this.u_NormalMatLoc,	// GPU location of the uniform
      false, 				// use matrix transpose instead?
      this.NormalMat.elements);	// send data from Javascript.
  
      gl.uniform3fv(this.matl0.uLoc_Ke, this.matl1.K_emit.slice(0,3));				// Ke emissive
      gl.uniform3fv(this.matl0.uLoc_Ka, this.matl1.K_ambi.slice(0,3));				// Ka ambient
      gl.uniform3fv(this.matl0.uLoc_Kd, this.matl1.K_diff.slice(0,3));				// Kd	diffuse
      gl.uniform3fv(this.matl0.uLoc_Ks, this.matl1.K_spec.slice(0,3));				// Ks specular
      gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl1.K_shiny, 10));     // Kshiny 
    gl.drawArrays(gl.TRIANGLE_STRIP, 	    // select the drawing primitive to draw,
      // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
      //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
      0, 								// location of 1st vertex to draw;
      this.spheNum);		// number of vertices to draw on-screen.
  
      this.ModelMat.rotate(1.5 * g_angle04, 0, 1, 0)
      this.ModelMat.translate(0, 0, 1.65);
      this.ModelMat.scale(0.7, 0.7, 0.7);
      this.camMat.set(g_cam)
      this.camMat.multiply(this.ModelMat);
      gl.uniformMatrix4fv(this.g_camLoc,	// GPU location of the uniform
        false, 				// use matrix transpose instead?
        this.camMat.elements);	// send data from Javascript.
    //    console.log(g_angle04)
      this.NormalMat.setInverseOf(this.ModelMat);
      this.NormalMat.transpose();
      gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
        false, 				// use matrix transpose instead?
        this.ModelMat.elements);	// send data from Javascript.
    
    
      gl.uniformMatrix4fv(this.u_NormalMatLoc,	// GPU location of the uniform
        false, 				// use matrix transpose instead?
        this.NormalMat.elements);	// send data from Javascript.
    
        gl.uniform3fv(this.matl0.uLoc_Ke, this.matl1.K_emit.slice(0,3));				// Ke emissive
        gl.uniform3fv(this.matl0.uLoc_Ka, this.matl1.K_ambi.slice(0,3));				// Ka ambient
        gl.uniform3fv(this.matl0.uLoc_Kd, this.matl1.K_diff.slice(0,3));				// Kd	diffuse
        gl.uniform3fv(this.matl0.uLoc_Ks, this.matl1.K_spec.slice(0,3));				// Ks specular
        gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl1.K_shiny, 10));     // Kshiny 
      gl.drawArrays(gl.TRIANGLE_STRIP, 	    // select the drawing primitive to draw,
        // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
        //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
        0, 								// location of 1st vertex to draw;
        this.spheNum);		// number of vertices to draw on-screen.
     
        this.ModelMat = popMatrix();
        pushMatrix(this.ModelMat);
        this.ModelMat.rotate(g_angle04, 0, 0, 1)
      this.ModelMat.translate(-2, -1, 0);
    this.ModelMat.scale(0.7, 0.7, 0.7);
    this.camMat.set(g_cam)
    this.camMat.multiply(this.ModelMat);
    gl.uniformMatrix4fv(this.g_camLoc,	// GPU location of the uniform
      false, 				// use matrix transpose instead?
      this.camMat.elements);	// send data from Javascript.
    //console.log(g_angle04)
    this.NormalMat.setInverseOf(this.ModelMat);
    this.NormalMat.transpose();
    gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
      false, 				// use matrix transpose instead?
      this.ModelMat.elements);	// send data from Javascript.
  
  
    gl.uniformMatrix4fv(this.u_NormalMatLoc,	// GPU location of the uniform
      false, 				// use matrix transpose instead?
      this.NormalMat.elements);	// send data from Javascript.
  
      gl.uniform3fv(this.matl0.uLoc_Ke, this.matl2.K_emit.slice(0,3));				// Ke emissive
      gl.uniform3fv(this.matl0.uLoc_Ka, this.matl2.K_ambi.slice(0,3));				// Ka ambient
      gl.uniform3fv(this.matl0.uLoc_Kd, this.matl2.K_diff.slice(0,3));				// Kd	diffuse
      gl.uniform3fv(this.matl0.uLoc_Ks, this.matl2.K_spec.slice(0,3));				// Ks specular
      gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl2.K_shiny, 10));     // Kshiny 
      gl.drawArrays(gl.TRIANGLE_STRIP, 	    // select the drawing primitive to draw,
        // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
        //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
        this.TStart/floatsPerVertex, 								// location of 1st vertex to draw;
        12);		// number of vertices to draw on-screen.
  
  
  
        this.ModelMat.rotate(g_angle04, 0, 0, 1)
      this.ModelMat.translate(0, 0, 1.5);
      this.ModelMat.rotate(g_angle04, 1, 1, 1)
    this.ModelMat.scale(0.7, 0.7, 0.7);
    this.camMat.set(g_cam)
    this.camMat.multiply(this.ModelMat);
    gl.uniformMatrix4fv(this.g_camLoc,	// GPU location of the uniform
      false, 				// use matrix transpose instead?
      this.camMat.elements);	// send data from Javascript.
    //console.log(g_angle04)
    this.NormalMat.setInverseOf(this.ModelMat);
    this.NormalMat.transpose();
    gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
      false, 				// use matrix transpose instead?
      this.ModelMat.elements);	// send data from Javascript.
  
  
    gl.uniformMatrix4fv(this.u_NormalMatLoc,	// GPU location of the uniform
      false, 				// use matrix transpose instead?
      this.NormalMat.elements);	// send data from Javascript.
  
      gl.uniform3fv(this.matl0.uLoc_Ke, this.matl3.K_emit.slice(0,3));				// Ke emissive
      gl.uniform3fv(this.matl0.uLoc_Ka, this.matl3.K_ambi.slice(0,3));				// Ka ambient
      gl.uniform3fv(this.matl0.uLoc_Kd, this.matl3.K_diff.slice(0,3));				// Kd	diffuse
      gl.uniform3fv(this.matl0.uLoc_Ks, this.matl3.K_spec.slice(0,3));				// Ks specular
      gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl3.K_shiny, 10));     // Kshiny 
      gl.drawArrays(gl.TRIANGLE_STRIP, 	    // select the drawing primitive to draw,
        // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
        //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
        this.TStart/floatsPerVertex, 								// location of 1st vertex to draw;
        12);		// number of vertices to draw on-screen.
  
    
        this.ModelMat.rotate(g_angle04, 0, 0, 1)
      this.ModelMat.translate(0, 0, 1.8);
      this.ModelMat.rotate(g_angle04, 1, 1, 1)
    this.ModelMat.scale(0.4, 0.4, 0.4);
    this.camMat.set(g_cam)
    this.camMat.multiply(this.ModelMat);
    gl.uniformMatrix4fv(this.g_camLoc,	// GPU location of the uniform
      false, 				// use matrix transpose instead?
      this.camMat.elements);	// send data from Javascript.
    //console.log(g_angle04)
    this.NormalMat.setInverseOf(this.ModelMat);
    this.NormalMat.transpose();
    gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
      false, 				// use matrix transpose instead?
      this.ModelMat.elements);	// send data from Javascript.
  
  
    gl.uniformMatrix4fv(this.u_NormalMatLoc,	// GPU location of the uniform
      false, 				// use matrix transpose instead?
      this.NormalMat.elements);	// send data from Javascript.
  
      gl.uniform3fv(this.matl0.uLoc_Ke, this.matl0.K_emit.slice(0,3));				// Ke emissive
      gl.uniform3fv(this.matl0.uLoc_Ka, this.matl0.K_ambi.slice(0,3));				// Ka ambient
      gl.uniform3fv(this.matl0.uLoc_Kd, this.matl0.K_diff.slice(0,3));				// Kd	diffuse
      gl.uniform3fv(this.matl0.uLoc_Ks, this.matl0.K_spec.slice(0,3));				// Ks specular
      gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl0.K_shiny, 10));     // Kshiny 
      gl.drawArrays(gl.TRIANGLE_STRIP, 	    // select the drawing primitive to draw,
        // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
        //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
        0, 								// location of 1st vertex to draw;
        this.spheNum);		// number of vertices to draw on-screen.
  
  
        this.ModelMat = popMatrix();
        pushMatrix(this.ModelMat);
  
     this.ModelMat.translate(2, -3, 2);
      
    this.ModelMat.scale(0.5, 0.5, 0.5);
    this.ModelMat.rotate(g_angleNow0, 1, 1, 0);	  // rotate drawing axes,
    this.camMat.set(g_cam)
    this.camMat.multiply(this.ModelMat);
    gl.uniformMatrix4fv(this.g_camLoc,	// GPU location of the uniform
      false, 				// use matrix transpose instead?
      this.camMat.elements);	// send data from Javascript.
    //console.log(g_angle04)
    this.NormalMat.setInverseOf(this.ModelMat);
    this.NormalMat.transpose();
    gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
      false, 				// use matrix transpose instead?
      this.ModelMat.elements);	// send data from Javascript.
  
  
    gl.uniformMatrix4fv(this.u_NormalMatLoc,	// GPU location of the uniform
      false, 				// use matrix transpose instead?
      this.NormalMat.elements);	// send data from Javascript.
  
      gl.uniform3fv(this.matl0.uLoc_Ke, this.matl4.K_emit.slice(0,3));				// Ke emissive
      gl.uniform3fv(this.matl0.uLoc_Ka, this.matl4.K_ambi.slice(0,3));				// Ka ambient
      gl.uniform3fv(this.matl0.uLoc_Kd, this.matl4.K_diff.slice(0,3));				// Kd	diffuse
      gl.uniform3fv(this.matl0.uLoc_Ks, this.matl4.K_spec.slice(0,3));				// Ks specular
      gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl4.K_shiny, 10));     // Kshiny 
      gl.drawArrays(gl.TRIANGLE_STRIP, 	    // select the drawing primitive to draw,
        // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
        //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
        this.custart/floatsPerVertex, 								// location of 1st vertex to draw;
        cube.length/7);		// number of vertices to draw on-screen.
  
  
  
        this.ModelMat.translate(0, 0, 1.5);
        this.ModelMat.translate(  g_shift03,0,0)
        this.ModelMat.scale(0.5, 0.5, 0.5);
       // this.ModelMat.rotate(g_angleNow0, 1, 1, 0);	  // rotate drawing axes,
        this.camMat.set(g_cam)
        this.camMat.multiply(this.ModelMat);
        gl.uniformMatrix4fv(this.g_camLoc,	// GPU location of the uniform
          false, 				// use matrix transpose instead?
          this.camMat.elements);	// send data from Javascript.
        //console.log(g_angle04)
        this.NormalMat.setInverseOf(this.ModelMat);
        this.NormalMat.transpose();
        gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
          false, 				// use matrix transpose instead?
          this.ModelMat.elements);	// send data from Javascript.
      
      
        gl.uniformMatrix4fv(this.u_NormalMatLoc,	// GPU location of the uniform
          false, 				// use matrix transpose instead?
          this.NormalMat.elements);	// send data from Javascript.
      
          gl.uniform3fv(this.matl0.uLoc_Ke, this.matl3.K_emit.slice(0,3));				// Ke emissive
          gl.uniform3fv(this.matl0.uLoc_Ka, this.matl3.K_ambi.slice(0,3));				// Ka ambient
          gl.uniform3fv(this.matl0.uLoc_Kd, this.matl3.K_diff.slice(0,3));				// Kd	diffuse
          gl.uniform3fv(this.matl0.uLoc_Ks, this.matl3.K_spec.slice(0,3));				// Ks specular
          gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl3.K_shiny, 10));     // Kshiny 
          gl.drawArrays(gl.TRIANGLE_STRIP, 	    // select the drawing primitive to draw,
            // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
            //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
            this.custart/floatsPerVertex, 								// location of 1st vertex to draw;
            cube.length/7);		// number of vertices to draw on-screen.
  
        
           
            this.ModelMat.translate(0, 0, 2.28);
            this.ModelMat.rotate(180, 0, 1, 0)
            this.ModelMat.rotate(g_angle04, 1, 1, 1)
        
          this.camMat.set(g_cam)
          this.camMat.multiply(this.ModelMat);
          gl.uniformMatrix4fv(this.g_camLoc,	// GPU location of the uniform
            false, 				// use matrix transpose instead?
            this.camMat.elements);	// send data from Javascript.
          //console.log(g_angle04)
          this.NormalMat.setInverseOf(this.ModelMat);
          this.NormalMat.transpose();
          gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
            false, 				// use matrix transpose instead?
            this.ModelMat.elements);	// send data from Javascript.
        
        
          gl.uniformMatrix4fv(this.u_NormalMatLoc,	// GPU location of the uniform
            false, 				// use matrix transpose instead?
            this.NormalMat.elements);	// send data from Javascript.
        
            gl.uniform3fv(this.matl0.uLoc_Ke, this.matl1.K_emit.slice(0,3));				// Ke emissive
            gl.uniform3fv(this.matl0.uLoc_Ka, this.matl1.K_ambi.slice(0,3));				// Ka ambient
            gl.uniform3fv(this.matl0.uLoc_Kd, this.matl1.K_diff.slice(0,3));				// Kd	diffuse
            gl.uniform3fv(this.matl0.uLoc_Ks, this.matl1.K_spec.slice(0,3));				// Ks specular
            gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl1.K_shiny, 10));     // Kshiny 
            gl.drawArrays(gl.TRIANGLE_STRIP, 	    // select the drawing primitive to draw,
              // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
              //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
              this.TStart/floatsPerVertex, 								// location of 1st vertex to draw;
              12);		// number of vertices to draw on-screen.
    
    
  
    }
  
  
  VBObox2.prototype.reload = function() {
  //=============================================================================
  // Over-write current values in the GPU inside our already-created VBO: use 
  // gl.bufferSubData() call to re-transfer some or all of our Float32Array 
  // contents to our VBO without changing any GPU memory allocations.
  
   gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                    0,                  // byte offset to where data replacement
                                        // begins in the VBO.
                      this.vboContents);   // the JS source-data array used to fill VBO
  
  }
/*
VBObox2.prototype.empty = function() {
//=============================================================================
// Remove/release all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  However, make sure this step is reversible by a call to 
// 'restoreMe()': be sure to retain all our Float32Array data, all values for 
// uniforms, all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}

VBObox2.prototype.restore = function() {
//=============================================================================
// Replace/restore all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  Use our retained Float32Array data, all values for  uniforms, 
// all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}
*/

//=============================================================================
//=============================================================================
//=============================================================================
