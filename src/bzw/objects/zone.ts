import {IMesh} from "../types.ts";
import {Box} from "./box.ts";

/** World object */
export class Zone extends Box{
  HEADER = "zone";

  color: [number, number, number, number] = [1, 1, 0, .5];

  buildMesh(mesh: IMesh): void{
    super.buildMesh(mesh);
  }

  parseLine(line: string): void{
    if(line.split(" ")[0] === "color"){
      return;
    }

    super.parseLine(line);
  }
}
