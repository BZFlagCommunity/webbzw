import {IMesh} from "../types.ts";
import {Box} from "./box.ts";

/** World object */
export class Zone extends Box{
  HEADER = "zone";

  buildMesh(mesh: IMesh): void{
    this.color = [1, 1, 0, .5];
    super.buildMesh(mesh);
  }
}
