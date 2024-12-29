

function deg2rad(angle) {
    return angle * Math.PI / 180;
}

function Vertex(p, t)
{
    this.p = p;
    this.t = t;
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
    this.iTexCoordsBuffer = gl.createBuffer();
    this.iIndexBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function(vertices, normals, indices, texcoords, tangents) {
		console.log("Vertices: " + vertices.length);
		console.log("Normals: " + normals.length);
		console.log("Tangents: " + tangents.length);
		console.log("Indices: " + indices.length);
		console.log("Texcoords: " + texcoords.length);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);
		gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shProgram.iAttribVertex);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.iTexCoordsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texcoords, gl.STATIC_DRAW);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STREAM_DRAW);

		let normalBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STREAM_DRAW);
		gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shProgram.iAttribNormal);

		let tangentBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, tangentBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, tangents, gl.STREAM_DRAW);
		gl.vertexAttribPointer(shProgram.iAttribTangent, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shProgram.iAttribTangent);
		
		this.count = indices.length;
	};

    this.Draw = function() {

		gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.idTextureDiffuse);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.idTextureSpecular);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTexCoordsBuffer);
        gl.vertexAttribPointer(shProgram.iAttribTexCoords, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTexCoords);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);

        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }
}

function updateSurface() {
    let data = {};
    CreateSurfaceData(data);
    surface.BufferData(data.verticesF32, data.normalsF32, data.indicesU16, data.texcoordsF32, data.tangentsF32);
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
    let texcoords = [];
    let normals = [];
    let indices = [];

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
			texcoords.push(1 - u, 1 - v);

            let nx = x;
            let ny = 0.1;
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

            indices.push(v0, v1, v2);
            indices.push(v1, v3, v2);
        }
    }
	
	const tangents = calculateTangents(vertices, normals, texcoords, indices);

    data.verticesF32 = new Float32Array(vertices);
    data.texcoordsF32 = new Float32Array(texcoords);
    data.normalsF32 = new Float32Array(normals);
    data.tangentsF32 = new Float32Array(tangents);
	data.indicesU16 = new Uint16Array(indices);
}

function calculateTangents(vertices, normals, texcoords, indices) {
    const tangents = new Array(vertices.length / 3).fill(0).map(() => [0, 0, 0]);

    for (let i = 0; i < indices.length; i += 3) {
        const i0 = indices[i];
        const i1 = indices[i + 1];
        const i2 = indices[i + 2];

        const p0 = vertices.slice(i0 * 3, i0 * 3 + 3);
        const p1 = vertices.slice(i1 * 3, i1 * 3 + 3);
        const p2 = vertices.slice(i2 * 3, i2 * 3 + 3);

        const uv0 = texcoords.slice(i0 * 2, i0 * 2 + 2);
        const uv1 = texcoords.slice(i1 * 2, i1 * 2 + 2);
        const uv2 = texcoords.slice(i2 * 2, i2 * 2 + 2);

        const edge1 = p1.map((v, j) => v - p0[j]);
        const edge2 = p2.map((v, j) => v - p0[j]);

        const deltaUV1 = uv1.map((v, j) => v - uv0[j]);
        const deltaUV2 = uv2.map((v, j) => v - uv0[j]);

        const f = 1.0 / (deltaUV1[0] * deltaUV2[1] - deltaUV1[1] * deltaUV2[0]);
        const tangent = [
            f * (deltaUV2[1] * edge1[0] - deltaUV1[1] * edge2[0]),
            f * (deltaUV2[1] * edge1[1] - deltaUV1[1] * edge2[1]),
            f * (deltaUV2[1] * edge1[2] - deltaUV1[1] * edge2[2]),
        ];

        [i0, i1, i2].forEach((index) => {
            tangents[index] = tangents[index].map((v, j) => v + tangent[j]);
        });
    }

    return tangents.flat().map((v, i) => v / Math.sqrt(tangents[Math.floor(i / 3)].reduce((acc, val) => acc + val ** 2, 0)));
}