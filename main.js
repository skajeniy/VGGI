'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let testing = true;

function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if ( ! gl ) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
		console.log(e.message);
        return;
    }
    try {
		spaceball = new TrackballRotator(canvas, draw, 0);
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    draw();
}

function draw() { 
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // VIEW
    let projection = m4.perspective(Math.PI/8, 1, 8, 12);  
    let modelView = spaceball.getViewMatrix();
    let rotateToPointZero = m4.axisRotation([0.707,0.707,0], 0.7);
    let translateToPointZero = m4.translation(0,0,-10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView );
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0 );
	
	let modelViewProjection = m4.multiply(projection, matAccum1 );
	gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
	gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, matAccum1 );

	// NORMALS
	let normalMatrix = m4.identity();
	m4.multiply(modelView, matAccum1, normalMatrix);
	m4.inverse(normalMatrix, normalMatrix);    
	m4.transpose(normalMatrix, normalMatrix);
	gl.uniformMatrix4fv(shProgram.iNormalMatrix, false, normalMatrix);


    //COLOR AND TEXTURE
    gl.uniform4fv(shProgram.iColor, [1,0,0.5,1] );

    gl.uniform1i(shProgram.iTMU0, 0);
    gl.uniform1i(shProgram.iTMU1, 1);
    gl.uniform1i(shProgram.iTMU1, 2);

    surface.Draw();
}

/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram( gl, vertexShaderSource, fragmentShaderSource );

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();
	
	//BASE
    shProgram.iAttribVertex              	= gl.getAttribLocation(prog, "vertex");
    shProgram.iModelViewProjectionMatrix 	= gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iColor                     	= gl.getUniformLocation(prog, "color");
	
	//TEXTURE
	shProgram.iAttribTexCoords 				= gl.getAttribLocation(prog, "tex");
	shProgram.iTMU0                      	= gl.getUniformLocation(prog, "iTMU0");
    shProgram.iTMU1                      	= gl.getUniformLocation(prog, "iTMU1");
    shProgram.iTMU2                      	= gl.getUniformLocation(prog, "iTMU2");

	//LIGHT AND NORMALS
	shProgram.iAttribNormal 			 	= gl.getAttribLocation(prog, "normal");
	shProgram.iAttribTangent 			 	= gl.getAttribLocation(prog, "tangent");
	shProgram.iUniformLightPosition 	 	= gl.getUniformLocation(prog, "lightPosition");
	shProgram.iUniformAmbientLight 			= gl.getUniformLocation(prog, "ambientLight");
	
	//LIGHT
	gl.uniform3fv(shProgram.iUniformLightPosition, [5.0, 5.0, 5.0]);
	gl.uniform3fv(shProgram.iUniformAmbientLight, [0.2, 0.2, 0.2]);
	gl.uniform3fv(shProgram.iUniformViewPosition, [0.0, 0.0, 0.0]);
	
	shProgram.iUniformViewPosition = gl.getUniformLocation(prog, "viewPosition");
	shProgram.iNormalMatrix = gl.getUniformLocation(prog, "NormalMatrix");
	shProgram.iModelViewMatrix = gl.getUniformLocation(prog, "ModelViewMatrix");

    let data = {};
    
    CreateSurfaceData(data);

    surface = new Model('Surface');
    surface.BufferData(data.verticesF32, data.normalsF32, data.indicesU16, data.texcoordsF32, data.tangentsF32);

    // surface.idTextureDiffuse  = LoadTexture("https://i.imgflip.com/84w3tc.jpg?a481440");
    // surface.idTextureSpecular = LoadTexture("https://i.imgflip.com/84w3tc.jpg?a481440");
    //surface.idTextureDiffuse  = LoadTexture("https://media.tenor.com/z4WPS1HjaU0AAAAe/fgsfds-osaka.png");
    // surface.idTextureSpecular = LoadTexture("https://media.tenor.com/z4WPS1HjaU0AAAAe/fgsfds-osaka.png");
    //surface.idTextureDiffuse  = LoadTexture("https://github.com/skajeniy/VGGI/blob/PA3/osaka_diffuse.png");
    //surface.idTextureSpecular  = LoadTexture("https://github.com/skajeniy/VGGI/blob/PA3/osaka_normal.png");
	
	// to run properly use Win+R chrome --disable-web-security --user-data-dir="C:/ChromeDev"
	surface.idTextureDiffuse  = LoadTexture("osaka_diffuse.png");
    surface.idTextureSpecular  = LoadTexture("osaka_specular.png");
    surface.idTextureNormal  = LoadTexture("osaka_normal.png");

    gl.enable(gl.DEPTH_TEST);
}

function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader( gl.VERTEX_SHADER );
    gl.shaderSource(vsh,vShader);
    gl.compileShader(vsh);
    if ( ! gl.getShaderParameter(vsh, gl.COMPILE_STATUS) ) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
     }
    let fsh = gl.createShader( gl.FRAGMENT_SHADER );
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if ( ! gl.getShaderParameter(fsh, gl.COMPILE_STATUS) ) {
       throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog,vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if ( ! gl.getProgramParameter( prog, gl.LINK_STATUS) ) {
       throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}

function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;


    this.iAttribVertex = -1;
	this.iAttribTexCoords = -1;
    this.iColor = -1;
    this.iModelViewProjectionMatrix = -1;
	
	this.iModelViewMatrix = -1;
    this.iTMU0 = gl.getUniformLocation(program, "iTMU0");
	this.iTMU1 = gl.getUniformLocation(program, "iTMU1");
	this.iTMU2 = gl.getUniformLocation(program, "iTMU2");

    this.Use = function() {
        gl.useProgram(this.prog);
    }
}