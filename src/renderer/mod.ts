import {VERTEX_SHADER, FRAGMENT_SHADER, createShader} from "./gl.ts";

import * as math from "../math.ts";
import {getCoord} from "../utils.ts";
import {IMesh} from "../bzw/types.ts";
import * as dom from "../dom/mod.ts";

const MAX_ZOOM = -5;
const MOUSE_SPEED = 75;
const NEAR_PLANE = 1;
const AXIS_LINE_LENGTH = 20;

export class Renderer{
  worldSize = 400;
  axisPosition: [number, number, number] = [0, 0, 0];

  private gl?: WebGL2RenderingContext;
  private vbo: WebGLBuffer | null = null;
  private cbo: WebGLBuffer | null = null;
  private ebo: WebGLBuffer | null = null;
  private elementCount = 0;

  constructor(canvas?: HTMLCanvasElement){
    if(!canvas){
      return;
    }

    this.gl = canvas.getContext("webgl2") as WebGL2RenderingContext

    if(!this.gl){
      alert("WebGL 2.0 not available");
      return;
    }

    const viewMatrix = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,-this.worldSize,1];

    let drag = false;
    let oldX = 0, oldY = 0;
    let dX = 0, dY = 0;
    let THETA = 0, PHI = 40, oldTime = 0;

    new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }).observe(canvas);

    const mouseDown = (e: Event) => {
      e.preventDefault();

      drag = true;
      oldX = getCoord(e, "X");
      oldY = getCoord(e, "Y");
    };

    const mouseUp = () => {
      drag = false;
    };

    const mouseMove = (e: Event) => {
      e.preventDefault();

      if(!drag){
        return;
      }

      const x = getCoord(e, "X");
      const y = getCoord(e, "Y");

      dX = (x - oldX) * MOUSE_SPEED * Math.PI / canvas.width;
      dY = (y - oldY) * MOUSE_SPEED * Math.PI / canvas.height;
      THETA += dX;
      PHI += dY;
      oldX = x
      oldY = y;

      if(PHI > 90){
        PHI = 90;
      }else if(PHI < 0){
        PHI = 0;
      }
    };

    canvas.addEventListener("mousedown", mouseDown, false);
    canvas.addEventListener("mouseup", mouseUp, false);
    canvas.addEventListener("mouseout", mouseUp, false);
    canvas.addEventListener("mousemove", mouseMove, false);
    // mobile
    canvas.addEventListener("touchstart", mouseDown, {passive: false});
    canvas.addEventListener("touchend", mouseUp, false);
    canvas.addEventListener("touchmove", mouseMove, {passive: false});

    canvas.addEventListener("wheel", (e: WheelEvent): void => {
      const delta = e.deltaY;
      viewMatrix[14] += delta / Math.abs(delta) * (viewMatrix[14] / 10);
      viewMatrix[14] = viewMatrix[14] > MAX_ZOOM ? MAX_ZOOM : viewMatrix[14] < -this.worldSize * 3 ? -this.worldSize * 3 : viewMatrix[14];
    }, {passive: true});

    const shader = createShader(this.gl, VERTEX_SHADER, FRAGMENT_SHADER);
    if(!shader){
      alert("Error creating shader");
      return;
    }
    this.gl.useProgram(shader);

    const vMatrix = this.gl.getUniformLocation(shader, "view");
    const mMatrix = this.gl.getUniformLocation(shader, "model");

    const axisVertices = [
      // x
      0, 0, 0,
      1, 0, 0,
      // y
      0, 0, 0,
      0, 1, 0,
      // z
      0, 0,  0,
      0, 0, -1,
    ];
    const axisColors = [
      // x
      1, 0, 0, 1, 1, 0, 0, 1,
      // y
      0, 1, 0, 1, 0, 1, 0, 1,
      // z
      0, 0, 1, 1, 0, 0, 1, 1
    ];

    const axisVao = this.gl.createVertexArray();
    this.gl.bindVertexArray(axisVao);

    const axisVbo = this.gl.createBuffer() as WebGLBuffer;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, axisVbo);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(axisVertices), this.gl.STATIC_DRAW);

    const axisCbo = this.gl.createBuffer() as WebGLBuffer;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, axisCbo);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(axisColors), this.gl.STATIC_DRAW);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, axisVbo);
    this.gl.enableVertexAttribArray(0);
    this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, axisCbo);
    this.gl.enableVertexAttribArray(1);
    this.gl.vertexAttribPointer(1, 4, this.gl.FLOAT, false, 0, 0);

    this.gl.bindVertexArray(null);
    this.gl.deleteBuffer(axisVbo);
    this.gl.deleteBuffer(axisCbo);

    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.clearColor(0, 0, 0, 0);

    const render = (time: number) => {
      if(!this.gl){
        return;
      }

      if(oldTime === 0){
        oldTime = time;
      }
      const dt = time - oldTime;
      oldTime = time;

      if(!drag && dom.settings.autoRotate.checked){
        THETA += .015 * dt;
      }

      const modelMatrix = math.multiplyArrayOfMatrices([
        math.rotateXMatrix(-PHI),
        math.rotateYMatrix(-THETA),
      ]);

      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
      this.gl.viewport(0, 0, canvas.width, canvas.height);
      this.gl.uniformMatrix4fv(this.gl.getUniformLocation(shader, "proj"), false, math.getProjection(60, canvas.width/canvas.height, NEAR_PLANE, this.worldSize * 5));

      this.gl.uniformMatrix4fv(vMatrix, false, viewMatrix);
      this.gl.uniformMatrix4fv(mMatrix, false, modelMatrix);

      this.gl.drawElements(this.gl.TRIANGLES, this.elementCount, this.gl.UNSIGNED_SHORT, 0);

      if(dom.settings.showAxis.checked){
        this.gl.uniformMatrix4fv(mMatrix, false, math.multiplyArrayOfMatrices([
          modelMatrix,
          [AXIS_LINE_LENGTH,0,0,0, 0,AXIS_LINE_LENGTH,0,0, 0,0,AXIS_LINE_LENGTH,0, this.axisPosition[0],this.axisPosition[2],-this.axisPosition[1],1]
        ]));

        this.gl.disable(this.gl.DEPTH_TEST);

        this.gl.bindVertexArray(axisVao);
        this.gl.drawArrays(this.gl.LINES, 0, 6);
        this.gl.bindVertexArray(null);

        this.gl.enable(this.gl.DEPTH_TEST);
      }

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  }

  updateMesh(mesh: IMesh){
    if(!this.gl){
      return;
    }

    this.elementCount = mesh.indices.length;

    this.gl.deleteBuffer(this.vbo);
    this.gl.deleteBuffer(this.cbo);
    this.gl.deleteBuffer(this.ebo);

    this.vbo = this.gl.createBuffer() as WebGLBuffer;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(mesh.vertices), this.gl.STATIC_DRAW);

    this.cbo = this.gl.createBuffer() as WebGLBuffer;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cbo);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(mesh.colors), this.gl.STATIC_DRAW);

    this.ebo = this.gl.createBuffer() as WebGLBuffer;
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.ebo);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), this.gl.STATIC_DRAW);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
    this.gl.enableVertexAttribArray(0);
    this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, 12, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cbo);
    this.gl.enableVertexAttribArray(1);
    this.gl.vertexAttribPointer(1, 4, this.gl.FLOAT, false, 16, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
  }
}
