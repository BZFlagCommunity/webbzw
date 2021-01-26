import {BasicMapObject, IMesh, parseNum} from "../types.ts";

import {Define} from "./define.ts";

/** Group object */
export class Group extends BasicMapObject{
  HEADER = "group";

  id: string = "";
  scale: [number, number, number] = [1, 1, 1];

  define?: Define;

  constructor(line?: string){
    super(line);

    if(!line){
      return;
    }

    this.id = line.split(" ")[1];
  }

  buildMesh(mesh: IMesh): void{
    if(!this.define || this.define.id !== this.id){
      return;
    }

    for(const originalChild of this.define.children.slice()){
      const child = Object.create(originalChild);

      child.position = [child.position[0] * this.size[0], child.position[1] * this.size[1], child.position[2] * this.size[2]];
      child.size = [child.size[0] * this.scale[0], child.size[1] * this.scale[1], child.size[2] * this.scale[2]]
      child.buildMesh(mesh);
      this.vertexCount += child.vertexCount;
    }

    super.applyRotPosShift(mesh);
  }

  parseLine(line: string): void{
    super.parseLine(line);

    const parts = line.split(" ");

    if(parts[0] === "scale"){
      this.scale = [parseNum(parts[1], 1), parseNum(parts[2], 1), parseNum(parts[3], 1)];
    }
  }
}
