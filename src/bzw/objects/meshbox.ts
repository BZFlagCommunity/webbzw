import {Box} from "./box.ts";

/** Mesh Box object */
export class MeshBox extends Box{
  HEADER = "meshbox";

  phydrv: string = "";

  parseLine(line: string): void{
    super.parseLine(line);

    const parts = line.split(" ");

    if(parts[0] === "phydrv"){
      this.phydrv = parts.slice(1).join(" ");
    }
  }
}
