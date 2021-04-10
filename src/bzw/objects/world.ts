import {MapObject, IMesh, parseNum} from "../types.ts";

// TODO: make this read from `options`
const WALL_HEIGHT = 6.15; // 3 * _tankHeight (2.05)
const OUTER_WALLS = false; // TODO make this a view option

/** World object */
export class World extends MapObject{
  HEADER = "world";
  vertexCount = 60;

  size: number = 400;
  flagHeight: number = 10;
  noWalls: boolean = false;
  freeCtfSpawns: boolean = false;

  buildMesh(mesh: IMesh): void{
    const {size} = this;

    mesh.vertices.push( size, 0,  size);
    mesh.vertices.push( size, 0, -size);
    mesh.vertices.push(-size, 0, -size);
    mesh.vertices.push(-size, 0,  size);
    this.pushIndices(mesh);
    this.pushColors(mesh, 4, .3, .75, .3);

    if(!this.noWalls){
      // front inner
      mesh.vertices.push(-size, WALL_HEIGHT, -size);
      mesh.vertices.push(-size, 0          , -size);
      mesh.vertices.push( size, 0          , -size);
      mesh.vertices.push( size, WALL_HEIGHT, -size);
      this.pushIndices(mesh);
      this.pushColors(mesh, 4, .5, .5, .5);

      // back inner
      mesh.vertices.push( size, 0          , size);
      mesh.vertices.push(-size, 0          , size);
      mesh.vertices.push(-size, WALL_HEIGHT, size);
      mesh.vertices.push( size, WALL_HEIGHT, size);
      this.pushIndices(mesh);
      this.pushColors(mesh, 4, .5, .5, .5);

      // left inner
      mesh.vertices.push(-size, WALL_HEIGHT,  size);
      mesh.vertices.push(-size, 0          ,  size);
      mesh.vertices.push(-size, 0          , -size);
      mesh.vertices.push(-size, WALL_HEIGHT, -size);
      this.pushIndices(mesh);
      this.pushColors(mesh, 4, .5, .5, .5);

      // right inner
      mesh.vertices.push(size, 0          , -size);
      mesh.vertices.push(size, 0          ,  size);
      mesh.vertices.push(size, WALL_HEIGHT,  size);
      mesh.vertices.push(size, WALL_HEIGHT, -size);
      this.pushIndices(mesh);
      this.pushColors(mesh, 4, .5, .5, .5);

      if(OUTER_WALLS){
        // front outer
        mesh.vertices.push( size, 0          , -size);
        mesh.vertices.push(-size, 0          , -size);
        mesh.vertices.push(-size, WALL_HEIGHT, -size);
        mesh.vertices.push( size, WALL_HEIGHT, -size);
        this.pushIndices(mesh);
        this.pushColors(mesh, 4, .5, .5, .5);

        // back outer
        mesh.vertices.push(-size, WALL_HEIGHT, size);
        mesh.vertices.push(-size, 0          , size);
        mesh.vertices.push( size, 0          , size);
        mesh.vertices.push( size, WALL_HEIGHT, size);
        this.pushIndices(mesh);
        this.pushColors(mesh, 4, .5, .5, .5);

        // left outer
        mesh.vertices.push(-size, 0          , -size);
        mesh.vertices.push(-size, 0          ,  size);
        mesh.vertices.push(-size, WALL_HEIGHT,  size);
        mesh.vertices.push(-size, WALL_HEIGHT, -size);
        this.pushIndices(mesh);
        this.pushColors(mesh, 4, .5, .5, .5);

        // right outer
        mesh.vertices.push(size, WALL_HEIGHT,  size);
        mesh.vertices.push(size, 0          ,  size);
        mesh.vertices.push(size, 0          , -size);
        mesh.vertices.push(size, WALL_HEIGHT, -size);
        this.pushIndices(mesh);
        this.pushColors(mesh, 4, .5, .5, .5);
      }
    }
  }

  parseLine(line: string): void{
    super.parseLine(line);

    const parts = line.split(" ");

    if(parts[0] === "size"){
      this.size = parseNum(parts[1]) || 400;
    }else if(parts[0] === "flagHeight"){
      this.flagHeight = parseNum(parts[1]) || 10;
    }else if(parts[0] === "noWalls"){
      this.noWalls = true;
    }else if(parts[0] === "freeCtfSpawns"){
      this.freeCtfSpawns = true;
    }
  }
}
