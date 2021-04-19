import {BoxLike} from "../types.ts";

/** World object */
export class Zone extends BoxLike{
  HEADER = "zone";

  color: [number, number, number, number] = [1, 1, 0, .5];

  parseLine(line: string): void{
    if(line.split(" ")[0] === "color"){
      return;
    }

    super.parseLine(line);
  }
}
