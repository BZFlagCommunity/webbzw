import {MapObject, IMesh} from "./types.ts";

export class World extends MapObject{
  VERTEX_COUNT = 12;

  buildMesh(mesh: IMesh): void{
    this.color = [.3, .75, .3, 1];

    const {scale, color} = this;

    mesh.vertices.push( scale[0], 0,  scale[1]);
    mesh.vertices.push( scale[0], 0, -scale[1]);
    mesh.vertices.push(-scale[0], 0, -scale[1]);
    mesh.vertices.push(-scale[0], 0,  scale[1]);
    this.pushIndices(mesh);

    this.pushColors(mesh, 4, color[0], color[1], color[2]);
  }
}
