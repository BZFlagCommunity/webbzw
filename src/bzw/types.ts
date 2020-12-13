import {rotY} from "../math.ts";

export interface IMesh{
  vertices: number[];
  indices: number[];
  colors: number[];
  indicesCount: number;
}

export abstract class MapObject{
  position: number[] = [0, 0, 0];
  shift: number[] = [0, 0 , 0];
  scale: number[] = [0, 0, 0];
  rotation: number = 0;
  color?: number[];

  readonly VERTEX_COUNT: number = 0;

  abstract buildMesh(mesh: IMesh): void;

  parseLine(line: string): void{
    const parts = line.split(" ");

    if(parts[0] === "size"){
      this.scale = [parseFloat(parts[1]) || .5, parseFloat(parts[2]) || .5, parseFloat(parts[3]) || 1];
      if(parseFloat(parts[3]) === 0){
        this.scale[2] = .01;
      }
    }else if(parts[0] === "position"){
      this.position = [parseFloat(parts[1]) || 0, parseFloat(parts[2]) || 0, parseFloat(parts[3]) || 0];
    }else if(parts[0] === "shift"){
      this.shift = [parseFloat(parts[1]) || 0, parseFloat(parts[2]) || 0, parseFloat(parts[3]) || 0];
    }else if(parts[0] === "rotation"){
      this.rotation = parseFloat(parts[1]) || 0;
    }else if(parts[0] === "color"){
      this.color = [parseFloat(parts[1]) || 1, parseFloat(parts[2]) || 1, parseFloat(parts[3]) || 1, parseFloat(parts[4]) || 1];
    }
  }

  protected pushIndices(mesh: IMesh): void{
    mesh.indices.push(mesh.indicesCount);
    mesh.indices.push(mesh.indicesCount + 1);
    mesh.indices.push(mesh.indicesCount + 2);
    mesh.indices.push(mesh.indicesCount + 2);
    mesh.indices.push(mesh.indicesCount + 3);
    mesh.indices.push(mesh.indicesCount);
    mesh.indicesCount += 4;
  }

  protected pushIndices2(mesh: IMesh): void{
    mesh.indices.push(mesh.indicesCount);
    mesh.indices.push(mesh.indicesCount + 1);
    mesh.indices.push(mesh.indicesCount + 2);
    mesh.indicesCount += 3;
  }

  protected pushColors(mesh: IMesh, count = 1, r = 0, g = 0, b = 0, a = 1): void{
    for(let i = 0; i < count; i++){
      mesh.colors.push(r, g, b, a);
    }
  }

  protected applyRotPosShift(mesh: IMesh): void{
    if(this.VERTEX_COUNT === 0){
      console.error("this should not happen");
      return;
    }

    const _rotation = this.rotation * Math.PI / 180;

    // apply rotation
    for(let i = mesh.vertices.length - this.VERTEX_COUNT; i < mesh.vertices.length; i += 3){
      const rot = rotY([mesh.vertices[i], mesh.vertices[i + 1], mesh.vertices[i + 2]], _rotation);
      mesh.vertices[i] = rot[0];
      mesh.vertices[i + 1] = rot[1];
      mesh.vertices[i + 2] = rot[2];
    }

    // apply position + shift
    for(let i = mesh.vertices.length - this.VERTEX_COUNT; i < mesh.vertices.length; i += 3){
      mesh.vertices[i] -= this.position[0] + this.shift[0];
    }
    for(let i = mesh.vertices.length - (this.VERTEX_COUNT - 1); i < mesh.vertices.length; i += 3){
      mesh.vertices[i] += this.position[2] + this.shift[2];
    }
    for(let i = mesh.vertices.length - (this.VERTEX_COUNT - 2); i < mesh.vertices.length; i += 3){
      mesh.vertices[i] += this.position[1] + this.shift[1];
    }
  };
}
