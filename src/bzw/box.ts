import {MapObject, IMesh} from "./types.ts";

export class Box extends MapObject{
  VERTEX_COUNT = 72;

  buildMesh(mesh: IMesh): void{
    if(!this.color){
      this.color = [.61, .26, .12, 1];
    }

    const {scale, color} = this;

    // top
    mesh.vertices.push(-scale[0], scale[2], -scale[1]);
    mesh.vertices.push(-scale[0], scale[2],  scale[1]);
    mesh.vertices.push( scale[0], scale[2],  scale[1]);
    mesh.vertices.push( scale[0], scale[2], -scale[1]);
    this.pushIndices(mesh);

    // bottom
    mesh.vertices.push( scale[0], 0, -scale[1]);
    mesh.vertices.push( scale[0], 0,  scale[1]);
    mesh.vertices.push(-scale[0], 0,  scale[1]);
    mesh.vertices.push(-scale[0], 0, -scale[1]);
    this.pushIndices(mesh);

    // back
    mesh.vertices.push( scale[0], 0       , -scale[1]);
    mesh.vertices.push(-scale[0], 0       , -scale[1]);
    mesh.vertices.push(-scale[0], scale[2], -scale[1]);
    mesh.vertices.push( scale[0], scale[2], -scale[1]);
    this.pushIndices(mesh);

    // front
    mesh.vertices.push( scale[0], scale[2], scale[1]);
    mesh.vertices.push(-scale[0], scale[2], scale[1]);
    mesh.vertices.push(-scale[0], 0       , scale[1]);
    mesh.vertices.push( scale[0], 0       , scale[1]);
    this.pushIndices(mesh);

    // left
    mesh.vertices.push(-scale[0], 0       , -scale[1]);
    mesh.vertices.push(-scale[0], 0       ,  scale[1]);
    mesh.vertices.push(-scale[0], scale[2],  scale[1]);
    mesh.vertices.push(-scale[0], scale[2], -scale[1]);
    this.pushIndices(mesh);

    // right
    mesh.vertices.push(scale[0], scale[2], -scale[1]);
    mesh.vertices.push(scale[0], scale[2],  scale[1]);
    mesh.vertices.push(scale[0], 0       ,  scale[1]);
    mesh.vertices.push(scale[0], 0       , -scale[1]);
    this.pushIndices(mesh);

    this.applyRotPosShift(mesh);

    this.pushColors(mesh, 4, color[0], color[1], color[2], color[3]);
    this.pushColors(mesh, 4, color[0] * .7, color[1] * .7, color[2] * .7, color[3]);
    this.pushColors(mesh, 8, color[0] * .9, color[1] * .9, color[2] * .9, color[3]);
    this.pushColors(mesh, 8, color[0] * .8, color[1] * .8, color[2] * .8, color[3]);
  }
}
