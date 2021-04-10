import {Pyramid} from "./pyramid.ts";

/** Mesh Pyramid object */
export class MeshPyramid extends Pyramid{
  HEADER = "meshpyr";

  phydrv: string = "";

  parseLine(line: string): void{
    super.parseLine(line);

    const parts = line.split(" ");

    if(parts[0] === "phydrv"){
      this.phydrv = parts.slice(1).join(" ");
    }
  }
}
