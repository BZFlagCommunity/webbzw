import {MapObject, parseNum} from "../types.ts";

/** Physics object */
export class Physics extends MapObject{
  HEADER = "physics";

  slide: number = 0;
  linear: [number, number, number] = [0, 0, 0];

  buildMesh(): void{
  }

  parseLine(line: string): void{
    super.parseLine(line);

    const parts = line.split(" ");

    if(parts[0] === "slide"){
      this.slide = parseNum(parts[1]) || 0;
    }else if(parts[0] === "linear"){
      this.linear = [parseNum(parts[1], 0), parseNum(parts[2], 0), parseNum(parts[3], 0)];
    }
  }
}
