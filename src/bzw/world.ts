import {MapObject, IMesh} from "./types.ts";

const WALL_HEIGHT = 6.15; // 3 * _tankHeight (2.05)

/** World object */
export class World extends MapObject{
  VERTEX_COUNT = 60;

  size = [400, 400, 0];
  color = [.3, .75, .3, 1];

  noWalls: boolean = false;

  buildMesh(mesh: IMesh): void{
    const {size, color} = this;

    mesh.vertices.push( size[0], 0,  size[1]);
    mesh.vertices.push( size[0], 0, -size[1]);
    mesh.vertices.push(-size[0], 0, -size[1]);
    mesh.vertices.push(-size[0], 0,  size[1]);
    this.pushIndices(mesh);
    this.pushColors(mesh, 4, color[0], color[1], color[2]);

    if(!this.noWalls){
      // front
      mesh.vertices.push(-size[0], WALL_HEIGHT, -size[1]);
      mesh.vertices.push(-size[0], 0          , -size[1]);
      mesh.vertices.push( size[0], 0          , -size[1]);
      mesh.vertices.push( size[0], WALL_HEIGHT, -size[1]);
      this.pushIndices(mesh);
      this.pushColors(mesh, 4, .5, .5, .5);

      // back
      mesh.vertices.push( size[0], 0          , size[1]);
      mesh.vertices.push(-size[0], 0          , size[1]);
      mesh.vertices.push(-size[0], WALL_HEIGHT, size[1]);
      mesh.vertices.push( size[0], WALL_HEIGHT, size[1]);
      this.pushIndices(mesh);
      this.pushColors(mesh, 4, .5, .5, .5);

      // left
      mesh.vertices.push(-size[0], WALL_HEIGHT,  size[1]);
      mesh.vertices.push(-size[0], 0          ,  size[1]);
      mesh.vertices.push(-size[0], 0          , -size[1]);
      mesh.vertices.push(-size[0], WALL_HEIGHT, -size[1]);
      this.pushIndices(mesh);
      this.pushColors(mesh, 4, .5, .5, .5);

      // right
      mesh.vertices.push(size[0], 0          , -size[1]);
      mesh.vertices.push(size[0], 0          ,  size[1]);
      mesh.vertices.push(size[0], WALL_HEIGHT,  size[1]);
      mesh.vertices.push(size[0], WALL_HEIGHT, -size[1]);
      this.pushIndices(mesh);
      this.pushColors(mesh, 4, .5, .5, .5);
    }
  }

  parseLine(line: string): void{
    super.parseLine(line);

    const parts = line.split(" ");

    if(parts[0] === "size"){
      this.size = [parseFloat(parts[1]) || 400, parseFloat(parts[1]) || 400, 0];
    }else if(parts[0] === "noWalls"){
      this.noWalls = true;
    }
  }
}
