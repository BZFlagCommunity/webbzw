import {BasicMapObject, IMesh} from "../types.ts";

const DEFAULT_COLOR: [number, number, number, number] = [.1, .3, 1, 1];

/** Pyramid object */
export class Pyramid extends BasicMapObject{
  HEADER = "pyramid";
  vertexCount = 48;

  drivethrough: boolean = false;
  shootthrough: boolean = false;

  buildMesh(mesh: IMesh): void{
    let {size, color} = this;

    if(!color){
      color = DEFAULT_COLOR;
    }

    // bottom
    mesh.vertices.push( size[0], 0, -size[1]);
    mesh.vertices.push( size[0], 0,  size[1]);
    mesh.vertices.push(-size[0], 0,  size[1]);
    mesh.vertices.push(-size[0], 0, -size[1]);
    this.pushIndices(mesh);

    // front
    mesh.vertices.push( size[0], 0,       size[1]);
    mesh.vertices.push( 0,       size[2], 0);
    mesh.vertices.push(-size[0], 0,       size[1]);
    this.pushIndices2(mesh);

    // back
    mesh.vertices.push(-size[0], 0,        -size[1]);
    mesh.vertices.push( 0,       size[2],  0);
    mesh.vertices.push( size[0], 0,        -size[1]);
    this.pushIndices2(mesh);

    // left
    mesh.vertices.push(-size[0], 0,        size[1]);
    mesh.vertices.push( 0,       size[2],  0);
    mesh.vertices.push(-size[0], 0,       -size[1]);
    this.pushIndices2(mesh);

    // right
    mesh.vertices.push(size[0], 0,        -size[1]);
    mesh.vertices.push(0,       size[2],  0);
    mesh.vertices.push(size[0], 0,        size[1]);
    this.pushIndices2(mesh);

    this.applyRotPosShift(mesh);

    this.pushColors(mesh, 16, color[0], color[1], color[2], color[3]);
  }

  // FIXME: this should be part of `pushIndices` with a dynamic number
  /** Add indices 2 */
  private pushIndices2(mesh: IMesh): void{
    mesh.indices.push(mesh.indicesCount);
    mesh.indices.push(mesh.indicesCount + 1);
    mesh.indices.push(mesh.indicesCount + 2);
    mesh.indicesCount += 3;
  }

  parseLine(line: string): void{
    super.parseLine(line);

    const parts = line.split(" ");

    if(parts[0] === "drivethrough"){
      this.drivethrough = true;
    }else if(parts[0] === "shootthrough"){
      this.shootthrough = true;
    }
  }
}
