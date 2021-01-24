import {MapObject, IMesh, parseNum} from "../types.ts";

import {Define} from "./define.ts";

/** Group object */
export class Group extends MapObject{
  name: string = "";
  size: [number, number, number] = [1, 1, 1];

  define?: Define;

  constructor(line?: string){
    super(line);

    if(!line){
      return;
    }

    this.name = line.split(" ")[1];
  }

  buildMesh(mesh: IMesh): void{
    if(!this.define || this.define.name !== this.name){
      return;
    }

    for(const originalChild of this.define.children.slice()){
      const child = Object.create(originalChild);

      child.position = [child.position[0] * this.size[0], child.position[1] * this.size[1], child.position[2] * this.size[2]];
      child.size = [child.size[0] * this.size[0], child.size[1] * this.size[1], child.size[2] * this.size[2]]
      child.buildMesh(mesh);
      this.vertexCount += child.vertexCount;
    }

    super.applyRotPosShift(mesh);
  }

  parseLine(line: string): void{
    super.parseLine(line);

    const parts = line.split(" ");

    if(parts[0] === "scale"){
      this.size = [parseNum(parts[1], 1), parseNum(parts[2], 1), parseNum(parts[3], 1)];
    }
  }
}
