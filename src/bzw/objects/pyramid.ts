import {MapObject, IMesh} from "../types.ts";

/** Pyramid object */
export class Pyramid extends MapObject{
  VERTEX_COUNT = 48;

  buildMesh(mesh: IMesh): void{
    if(!this.color){
      this.color = [.1, .3, 1, 1];
    }

    const {size, color} = this;

    // bottom
    mesh.vertices.push( size[0], 0, -size[1]);
    mesh.vertices.push( size[0], 0,  size[1]);
    mesh.vertices.push(-size[0], 0,  size[1]);
    mesh.vertices.push(-size[0], 0, -size[1]);
    this.pushIndices(mesh);

    // front
    mesh.vertices.push( size[0], 0       , size[1]);
    mesh.vertices.push( 0       , size[2], 0);
    mesh.vertices.push(-size[0], 0       , size[1]);
    this.pushIndices2(mesh);

    // back
    mesh.vertices.push(-size[0], 0       , -size[1]);
    mesh.vertices.push( 0       , size[2],  0);
    mesh.vertices.push( size[0], 0       , -size[1]);
    this.pushIndices2(mesh);

    // left
    mesh.vertices.push(-size[0], 0       , size[1]);
    mesh.vertices.push( 0       , size[2], 0);
    mesh.vertices.push(-size[0], 0       , -size[1]);
    this.pushIndices2(mesh);

    // right
    mesh.vertices.push(size[0], 0       , -size[1]);
    mesh.vertices.push(0       , size[2], 0);
    mesh.vertices.push(size[0], 0       , size[1]);
    this.pushIndices2(mesh);

    this.applyRotPosShift(mesh);

    this.pushColors(mesh, 4, color[0] * .8, color[1] * .8, color[2] * .8, color[3]);
    this.pushColors(mesh, 6, color[0] * .9, color[1] * .9, color[2] * .9, color[3]);
    this.pushColors(mesh, 6, color[0], color[1], color[2], color[3]);
  }
}
