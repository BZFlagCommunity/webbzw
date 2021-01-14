import {MapObject, IMesh} from "../types.ts";

/** (Team) Base object */
export class Base extends MapObject{
  VERTEX_COUNT = 72;

  buildMesh(mesh: IMesh): void{
    if(!this.color){
      this.color = [1, 1, 1, 1];
    }

    const {size, color} = this;

    // top
    mesh.vertices.push(-size[0], size[2], -size[1]);
    mesh.vertices.push(-size[0], size[2],  size[1]);
    mesh.vertices.push( size[0], size[2],  size[1]);
    mesh.vertices.push( size[0], size[2], -size[1]);
    this.pushIndices(mesh);

    // bottom
    mesh.vertices.push( size[0], 0, -size[1]);
    mesh.vertices.push( size[0], 0,  size[1]);
    mesh.vertices.push(-size[0], 0,  size[1]);
    mesh.vertices.push(-size[0], 0, -size[1]);
    this.pushIndices(mesh);

    // back
    mesh.vertices.push( size[0], 0       , -size[1]);
    mesh.vertices.push(-size[0], 0       , -size[1]);
    mesh.vertices.push(-size[0], size[2], -size[1]);
    mesh.vertices.push( size[0], size[2], -size[1]);
    this.pushIndices(mesh);

    // front
    mesh.vertices.push( size[0], size[2], size[1]);
    mesh.vertices.push(-size[0], size[2], size[1]);
    mesh.vertices.push(-size[0], 0       , size[1]);
    mesh.vertices.push( size[0], 0       , size[1]);
    this.pushIndices(mesh);

    // left
    mesh.vertices.push(-size[0], 0       , -size[1]);
    mesh.vertices.push(-size[0], 0       ,  size[1]);
    mesh.vertices.push(-size[0], size[2],  size[1]);
    mesh.vertices.push(-size[0], size[2], -size[1]);
    this.pushIndices(mesh);

    // right
    mesh.vertices.push(size[0], size[2], -size[1]);
    mesh.vertices.push(size[0], size[2],  size[1]);
    mesh.vertices.push(size[0], 0       ,  size[1]);
    mesh.vertices.push(size[0], 0       , -size[1]);
    this.pushIndices(mesh);

    this.applyRotPosShift(mesh);

    let baseColor = [1, 1, 0];
    switch(color[0]){
      case 1:
        baseColor = [1, 0, 0];
        break;
      case 2:
        baseColor = [0, 1, 0];
        break;
      case 3:
        baseColor = [0, 0, 1];
        break;
      case 4:
        baseColor = [.8, 0, 1];
        break;
    }

    this.pushColors(mesh, 4, baseColor[0], baseColor[1], baseColor[2], color[3]);
    this.pushColors(mesh, 4, baseColor[0] * .7, baseColor[1] * .7, baseColor[2] * .7, color[3]);
    this.pushColors(mesh, 8, baseColor[0] * .9, baseColor[1] * .9, baseColor[2] * .9, color[3]);
    this.pushColors(mesh, 8, baseColor[0] * .8, baseColor[1] * .8, baseColor[2] * .8, color[3]);
  }
}
