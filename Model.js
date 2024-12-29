

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


function Vertex(p)
{
    this.p = p;
    this.normal = [];
    this.triangles = [];
}

function Triangle(v0, v1, v2)
{
    this.v0 = v0;
    this.v1 = v1;
    this.v2 = v2;
    this.normal = [];
    this.tangent = [];
}

function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iIndexBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function(vertices, normals, indices) {
		// console.log("Vertices: " + vertices);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);
		gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shProgram.iAttribVertex);

		let normalBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STREAM_DRAW);
		gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shProgram.iAttribNormal);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STREAM_DRAW);

		this.count = indices.length;
	};

    this.Draw = function() {
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }
}

function updateSurface() {
    let data = {};
    CreateSurfaceData(data);
    surface.BufferData(data.verticesF32, data.normalsF32, data.indicesU16);
    draw();
}

let granularityU = parseInt(document.getElementById("granularityU").value);
let granularityV = parseInt(document.getElementById("granularityV").value);

document.getElementById("granularityU").addEventListener("input", function () {
    granularityU = parseInt(this.value);
	console.log("U: " + granularityU + "; V: " + granularityV);
    updateSurface();
});

document.getElementById("granularityV").addEventListener("input", function () {
    granularityV = parseInt(this.value);
	console.log("U: " + granularityU + "; V: " + granularityV);
    updateSurface();
});


function CreateSurfaceData(data) {
    let vertices = [];
    let normals = [];
    let indices = [];

    let compNormals = true;

    for (let j = 0; j <= granularityV; j++) {
        let v = j / granularityV; 
        let y = v * 2 - 1;
        let r = Math.pow(1 - Math.abs(y), 2);

        for (let i = 0; i <= granularityU; i++) {
            let u = i / granularityU;
            let theta = u * 2 * Math.PI;

            let x = r * Math.cos(theta);
            let z = r * Math.sin(theta);

            vertices.push(x, y, z);

            let nx = x;
            let ny = 1.0;
            let nz = z;

            let length = Math.sqrt(nx * nx + ny * ny + nz * nz);
            normals.push(nx / length, ny / length, nz / length);
        }
    }

    for (let j = 0; j < granularityV; j++) {
        for (let i = 0; i < granularityU; i++) {
            let v0 = j * (granularityU + 1) + i;
            let v1 = v0 + 1;
            let v2 = v0 + (granularityU + 1);
            let v3 = v2 + 1;

            indices.push(v0, v1, v2, v1, v3, v2);
        }
    }

	//flattening 
    data.verticesF32 = new Float32Array(vertices);
    data.normalsF32 = new Float32Array(normals);
    data.indicesU16 = new Uint16Array(indices);
}

function ComputeNormal(v0, v1, v2) {
    let u = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
    let v = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];

    let normal = [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0],
    ];

    let length = Math.sqrt(normal[0] ** 2 + normal[1] ** 2 + normal[2] ** 2);
    return normal.map((n) => n / length);
}
