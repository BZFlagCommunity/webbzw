import {MapObject, IMesh} from "./types.ts";

const WALL_HEIGHT = 6.15; // 3 * _tankHeight (2.05)

/** World object */
export class World extends MapObject{
  VERTEX_COUNT = 60;

  color = [.3, .75, .3, 1];

  size: number = 400;
  noWalls: boolean = false;

  buildMesh(mesh: IMesh): void{
    const {size, color} = this;

    mesh.vertices.push( size, 0,  size);
    mesh.vertices.push( size, 0, -size);
    mesh.vertices.push(-size, 0, -size);
    mesh.vertices.push(-size, 0,  size);
    this.pushIndices(mesh);
    this.pushColors(mesh, 4, color[0], color[1], color[2]);

    if(!this.noWalls){
      // front
      mesh.vertices.push(-size, WALL_HEIGHT, -size);
      mesh.vertices.push(-size, 0          , -size);
      mesh.vertices.push( size, 0          , -size);
      mesh.vertices.push( size, WALL_HEIGHT, -size);
      this.pushIndices(mesh);
      this.pushColors(mesh, 4, .5, .5, .5);

      // back
      mesh.vertices.push( size, 0          , size);
      mesh.vertices.push(-size, 0          , size);
      mesh.vertices.push(-size, WALL_HEIGHT, size);
      mesh.vertices.push( size, WALL_HEIGHT, size);
      this.pushIndices(mesh);
      this.pushColors(mesh, 4, .5, .5, .5);

      // left
      mesh.vertices.push(-size, WALL_HEIGHT,  size);
      mesh.vertices.push(-size, 0          ,  size);
      mesh.vertices.push(-size, 0          , -size);
      mesh.vertices.push(-size, WALL_HEIGHT, -size);
      this.pushIndices(mesh);
      this.pushColors(mesh, 4, .5, .5, .5);

      // right
      mesh.vertices.push(size, 0          , -size);
      mesh.vertices.push(size, 0          ,  size);
      mesh.vertices.push(size, WALL_HEIGHT,  size);
      mesh.vertices.push(size, WALL_HEIGHT, -size);
      this.pushIndices(mesh);
      this.pushColors(mesh, 4, .5, .5, .5);
    }
  }

  parseLine(line: string): void{
    super.parseLine(line);

    const parts = line.split(" ");

    if(parts[0] === "size"){
      this.size = parseFloat(parts[1]) || 400;
    }else if(parts[0] === "noWalls"){
      this.noWalls = true;
    }
  }
}
