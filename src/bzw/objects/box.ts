import {BoxLike} from "../types.ts";

/** Box object */
export class Box extends BoxLike{
  HEADER = "box";

  // FIXME this is added to box-like children, but this should not be the case. Instead crate a generic `BoxLike` class to extend from instead
  drivethrough: boolean = false;
  shootthrough: boolean = false;

  parseLine(line: string): void{
    super.parseLine(line);

    const parts = line.split(" ");

    if(parts[0] === "drivethrough"){
      this.drivethrough = true;
    }else if(parts[0] === "shootthrough"){
      this.shootthrough = true;
    }
  }
}
