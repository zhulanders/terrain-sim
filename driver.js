const IlliniBlue = new Float32Array([0.075, 0.16, 0.292, 1])
const IlliniOrange = new Float32Array([1, 0.373, 0.02, 1])
const IdentityMatrix = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1])
function compileShader(vs_source, fs_source) {
    const vs = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vs, vs_source)
    gl.compileShader(vs)
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(vs))
        throw Error("Vertex shader compilation failed")
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fs, fs_source)
    gl.compileShader(fs)
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(fs))
        throw Error("Fragment shader compilation failed")
    }

    const program = gl.createProgram()
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program))
        throw Error("Linking failed")
    }
    
    const uniforms = {}
    for(let i=0; i<gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS); i+=1) {
        let info = gl.getActiveUniform(program, i)
        uniforms[info.name] = gl.getUniformLocation(program, info.name)
    }
    program.uniforms = uniforms

    return program
}

/**
 * Sends per-vertex data to the GPU and connects it to a VS input
 * 
 * @param data    a 2D array of per-vertex data (e.g. [[x,y,z,w],[x,y,z,w],...])
 * @param loc     the layout location of the vertex shader's `in` attribute
 * @param mode    (optional) gl.STATIC_DRAW, gl.DYNAMIC_DRAW, etc
 * 
 * @returns the ID of the buffer in GPU memory; useful for changing data later
 */
function supplyDataBuffer(data, loc, mode) {
    if (mode === undefined) mode = gl.STATIC_DRAW
    
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    const f32 = new Float32Array(data.flat())
    gl.bufferData(gl.ARRAY_BUFFER, f32, mode)
    
    gl.vertexAttribPointer(loc, data[0].length, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(loc)
    
    return buf;
}

/**
 * Creates a Vertex Array Object and puts into it all of the data in the given
 * JSON structure, which should have the following form:
 * 
 * ````
 * {"triangles": a list of of indices of vertices
 * ,"attributes":
 *  [ a list of 1-, 2-, 3-, or 4-vectors, one per vertex to go in location 0
 *  , a list of 1-, 2-, 3-, or 4-vectors, one per vertex to go in location 1
 *  , ...
 *  ]
 * }
 * ````
 * 
 * @returns an object with four keys:
 *  - mode = the 1st argument for gl.drawElements
 *  - count = the 2nd argument for gl.drawElements
 *  - type = the 3rd argument for gl.drawElements
 *  - vao = the vertex array object for use with gl.bindVertexArray
 */
function setupGeomery(geom) {
    var triangleArray = gl.createVertexArray()
    gl.bindVertexArray(triangleArray)

    for(let i=0; i<geom.attributes.length; i+=1) {
        let data = geom.attributes[i]
        supplyDataBuffer(data, i)
    }

    var indices = new Uint16Array(geom.triangles.flat())
    var indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

    return {
        mode: gl.TRIANGLES,
        count: indices.length,
        type: gl.UNSIGNED_SHORT,
        vao: triangleArray
    }
}


/** Draw one frame */
function draw(seconds) {
    if (window.grid == null){
        return
    }
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.useProgram(program)
    gl.bindVertexArray(geom.vao)   
    gl.uniform3fv(program.uniforms.color, [.75,.5,.25])
    let m = m4scale(1,1,1)
    //set the view matrix with enough z to see everything
    let right = normalize(cross(forward,[0,0,1]))
    let leftrotation = m4rotZ(1/50)
    let rightrotation = m4rotZ(-1/50)
    let c = Math.cos(.01)
    let s = Math.sin(.01)
    rx = right[0]
    ry = right[1]
    rz = right[2]
    let upmatrix = [rx*rx*(1-c) + c, rx*ry*(1-c) - rz * s, rx*rz*(1-c)+ ry*s, 0
    ,rx*ry*(1-c)+rz*s, ry*ry*(1-c) + c, ry*rz*(1-c) - rx*s, 0,rx*rz*(1-c) - ry*s, ry*rz*(1-c) + rx*s, rz*rz*(1-c) + c, 0,0,0,0,1]
    c = Math.cos(-.01)
    s = Math.sin(-.01)
    let downmatrix = [rx*rx*(1-c) + c, rx*ry*(1-c) - rz * s, rx*rz*(1-c)+ ry*s, 0
        ,rx*ry*(1-c)+rz*s, ry*ry*(1-c) + c, ry*rz*(1-c) - rx*s, 0,rx*rz*(1-c) - ry*s, ry*rz*(1-c) + rx*s, rz*rz*(1-c) + c, 0,0,0,0,1]
    if (keysBeingPressed['ArrowUp']){
        forward.push(1);
        console.log(forward)
        console.log(upmatrix)
        forward = m4mul(m4transpose(upmatrix), forward)
        forward.pop();
    }
    if (keysBeingPressed['ArrowDown']){
        forward.push(1);
        console.log(forward)
        console.log(downmatrix)
        forward = m4mul(m4transpose(downmatrix), forward)
        forward.pop();
    }
    if (keysBeingPressed['ArrowLeft']){
        forward.push(1);
        forward = m4mul(leftrotation, forward)
        forward.pop();    
    }
    if (keysBeingPressed['ArrowRight']){
        forward.push(1);
        forward = m4mul(rightrotation, forward)
        forward.pop();  
    }
    if (keysBeingPressed['w']){
        camera = add(camera, mul(forward,.01))
    }
    if (keysBeingPressed['s']){
        camera = add(camera, mul(forward,-.01))
    }
    if (keysBeingPressed['a']){
        camera = add(camera, mul(right, -.01))
    }
    if (keysBeingPressed['d']){
        camera = add(camera, mul(right, .01))
    } 
    gl.uniform3fv(program.uniforms.eye, camera)
    let v = m4view(camera, add(camera,forward), [0,0,1])
    if(isFog == true){
        gl.uniform1f(program.uniforms.fog, window.fog)
    }
    else{
        gl.uniform1f(program.uniforms.fog, 0.0)
    }
    gl.uniformMatrix4fv(program.uniforms.mv, false, m4mul(v,m))
    gl.uniformMatrix4fv(program.uniforms.p, false, p)
    gl.uniform3fv(program.uniforms.light, normalize([1,1,1]))
    gl.drawElements(geom.mode, geom.count, geom.type, 0)
}

/** Compute any time-varying or animated aspects of the scene */
function tick(milliseconds) {
    let seconds = milliseconds / 1000;

    draw(seconds)
    requestAnimationFrame(tick)
}

/** Resizes the canvas to completely fill the screen */
function fillScreen() {
    let canvas = document.querySelector('canvas')
    document.body.style.margin = '0'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
    canvas.style.width = ''
    canvas.style.height = ''
    gl.viewport(0,0, canvas.width, canvas.height)
    // TO DO: compute a new projection matrix based on the width/height aspect ratio
    window.p = m4perspNegZ(0.1, 10, 1.5, canvas.width, canvas.height)
}   
/*Setup the screen when page loads*/
window.addEventListener('load', async (event) => {
        window.gl = document.querySelector('canvas').getContext('webgl2',
            // optional configuration object: see https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext
            {antialias: false, depth:true, preserveDrawingBuffer:true}
        )
        let vs = await fetch('ex04-vertex.glsl').then(res => res.text())
        let fs = await fetch('ex04-fragment.glsl').then(res => res.text())
        window.program = compileShader(vs,fs)
        gl.enable(gl.DEPTH_TEST)
        fillScreen()
        window.addEventListener('resize', fillScreen)

        /*This portion of code runs when we click the regenerate terrain button */
              window.camera = [1,1,0.5]
              window.forward = normalize(mul(window.camera, -1))
        
        document.querySelector('#submit').addEventListener('click', event => {
            const gridsize = Number(document.querySelector('#gridsize').value) || 2
            const faults = Number(document.querySelector('#faults').value) || 0
            const weathering = Number(document.querySelector('#weathering').value)
            // TO DO: generate a new gridsize-by-gridsize grid here, then apply faults to it
            window.terrain =
            {"triangles":
            []
                ,"attributes":
            [ // position
                [],
              //normals
                []
            ]
            }   
            // create empty square grid
            if (gridsize >= 2 && gridsize <= 255){
                window.grid = [];
                for (let i = 0; i < gridsize; i++){
                   window.grid.push([]);
                    for (let j = 0; j < gridsize; j++){
                        window.grid[i].push(0);
                    }
                }
            }
            let delta = 1;
            //iterate through faults
            for (let fault = 0; fault < faults; fault++){
        
                const point = [Math.floor(Math.random()*gridsize),Math.floor(Math.random()*gridsize)]
                const angle = Math.random() * 2 * Math.PI;
                const normal = [Math.cos(angle), Math.sin(angle), 0]
                for (let i = 0; i < gridsize; i++){
                    for (let j = 0; j < gridsize; j++){
                        const b1 = i - point[0];
                        const b2 = j - point[1];
                        const distance =  Math.sqrt(Math.pow(b1,2) + Math.pow(b2,2))
                        const dot = b1 * normal[0] + b2 * normal[1]
                        if (dot < 0){
                            window.grid[i][j] -= delta; //if negative subtract
                        }
                        else{
                            window.grid[i][j] += delta; //if positive add
                        }
                    }
                }
            }
            //normalize heights
            let min = 256
                let max = -256
                for (let i = 0; i < gridsize; i++){
                    for (let j = 0; j < gridsize; j++){
                        if (window.grid[i][j] < min){
                            min = window.grid[i][j]
                        }
                        if (window.grid[i][j] > max){
                            max = window.grid[i][j]
                        }
                    }
                }
                if (min != max){
                for (let i = 0; i < gridsize; i++){
                    for (let j = 0; j < gridsize; j++){
                        window.grid[i][j] = 0.5*((window.grid[i][j] - 0.5*(min + max))/(max-min))
                    }
                    
                }
                }
            for (let i = 0; i < gridsize; i++){
                for (let j = 0; j < gridsize; j++){
                    terrain.attributes[0].push([(j/gridsize)-0.5, (i/gridsize - 0.5), window.grid[i][j]]) // push our vertexes into geometry
                }
                
            }
            for (let i = 0; i < gridsize - 1; i++){
                for (let j = 0; j < gridsize - 1; j++){
                    const index = i * gridsize + j;
                    terrain.triangles.push([index, index + 1, index + gridsize])
                    terrain.triangles.push([index+1, index + gridsize, index + gridsize + 1]) //push the two triangles that make up each square
                }
                
            }
            window.newgrid = [];
            for (let i = 0; i < gridsize; i++){
                window.newgrid.push([]);
                for (let j = 0; j < gridsize; j++){
                    window.newgrid[i].push(0);
                }
            }
            for(let w = 0; w < weathering; w++){

            
            for (let i = 0; i < gridsize; i++){
                for (let j = 0; j < gridsize; j++){
                    const index = i * gridsize + j;

                    let v = terrain.attributes[0][index];
                    //if neighbors dont exist default the z-coordinates
                    let w = [v[0] - 1/gridsize, v[1], v[2]]
                    let n = [v[0] , v[1] - 1/gridsize, v[2]]
                    let s = [v[0] , v[1] + 1/gridsize, v[2]]
                    let e = [v[0] + 1/gridsize, v[1], v[2]]
                    //find neighbors
                    if (j != 0){
                        w = terrain.attributes[0][index - 1];
                    }
                    if (j < gridsize - 1 ){
                        e = terrain.attributes[0][index + 1];
                    }if (i != 0){
                        n = terrain.attributes[0][index - gridsize];
                    }if (i < gridsize - 1){
                        s = terrain.attributes[0][index + gridsize];
                    }
                    m = (w[2] + n[2]  + e[2] + s[2])/4
                    window.newgrid[i][j] = (terrain.attributes[0][index][2] + m)/2
                    

                }
                
            }
            for (let i = 0; i < gridsize; i++){
                for (let j = 0; j < gridsize; j++){
                    const index = i * gridsize + j;
                    terrain.attributes[0][index] = [terrain.attributes[0][index][0],terrain.attributes[0][index][1],window.newgrid[i][j]]
                }
                
            }
         }
            for (let i = 0; i < gridsize; i++){
                for (let j = 0; j < gridsize; j++){
                    const index = i * gridsize + j;

                    let v = terrain.attributes[0][index];
                    //if neighbors dont exist default the z-coordinates
                    let w = [v[0] - 1/gridsize, v[1], v[2]]
                    let n = [v[0] , v[1] - 1/gridsize, v[2]]
                    let s = [v[0] , v[1] + 1/gridsize, v[2]]
                    let e = [v[0] + 1/gridsize, v[1], v[2]]
                    //find neighbors
                    if (j != 0){
                        w = terrain.attributes[0][index - 1];
                    }
                    if (j < gridsize - 1 ){
                        e = terrain.attributes[0][index + 1];
                    }if (i != 0){
                        n = terrain.attributes[0][index - gridsize];
                    }if (i < gridsize - 1){
                        s = terrain.attributes[0][index + gridsize];
                    }
                    //calculate grid-based normals
                    normal = normalize(cross(sub(w,e),sub(n,s)))
                    terrain.attributes[1].push(normal);
                    
                     

                }
                
            }
            //pass geometry to draw
            window.geom = setupGeomery(terrain);
            window.keysBeingPressed = {}
        window.fog = 1.0;
        window.isFog = true;
        window.addEventListener('keydown', event => {
            keysBeingPressed[event.key] = true
            if (event.key == 'g'){
                window.fog *= 0.8
            }
            if (event.key == 'h'){
                window.fog *= 1.25
            }
            if (event.key == 'f'){
                window.isFog = !window.isFog;
            }
        })
        window.addEventListener('keyup', event => keysBeingPressed[event.key] = false)
        window.camera = [1,1,0.5]
        window.forward = normalize(mul(window.camera, -1))
        window.current = 0;
        
        
        })
        
        
        
        requestAnimationFrame(tick)
        
    })
