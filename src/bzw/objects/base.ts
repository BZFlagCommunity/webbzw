import {IMesh} from "../types.ts";
import {Box} from "./box.ts";

/** (Team) Base object */
export class Base extends Box{
  HEADER = "base";

  buildMesh(mesh: IMesh): void{
    if(!this.color){
      this.color = [1, 1, 1, 1];
    }

    let baseColor: [number, number, number] = [1, 1, 0];
    switch(this.color[0]){
      case 1:
        baseColor = [1, 0, 0];
        break;
      case 2:
        baseColor = [0, 1, 0];
        break;
      case 3:
        baseColor = [0, 0, 1];
        break;
      case 4:
        baseColor = [.8, 0, 1];
        break;
    }

    this.color = [...baseColor, this.color[3]];

    super.buildMesh(mesh);
  }
}
