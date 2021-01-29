import {MapObject} from "../types.ts";

import {Box} from "./box.ts";
import {MeshBox} from "./meshbox.ts";
import {Pyramid} from "./pyramid.ts";
import {MeshPyramid} from "./meshpyr.ts";
import {Base} from "./base.ts";

/** Define object */
export class Define extends MapObject{
  HEADER = "define";

  id: string = "";
  children: MapObject[] = [];

  private current: string = "";

  constructor(line?: string){
    super(line);

    if(!line){
      return;
    }

    this.id = line.split(" ")[1];
  }

  buildMesh(): void{
  }

  toString(): string{
    let ret = super.toString().split("\n");
    ret[0] += ` ${this.id}`;
    ret = ret.filter((line: string) => !line.endsWith(`id ${this.id}`) && !line.endsWith("children"));

    return ret.join("\n") + "def";
  }

  parseLine(line: string): void{
    // we don't call super becase we don't use any of the normal properties

    if(line === "end"){
      this.current = "";
    }else if(line === "box"){
      this.current = line;
      this.children.push(new Box(line));
    }else if(line === "meshbox"){
      this.current = line;
      this.children.push(new MeshBox(line));
    }else if(line === "pyramid"){
      this.current = line;
      this.children.push(new Pyramid(line));
    }else if(line === "meshpyr"){
      this.current = line;
      this.children.push(new MeshPyramid(line));
    }else if(line === "base"){
      this.current = line;
      this.children.push(new Base(line));
    }else if(this.children.length > 0){
      this.children[this.children.length - 1].parseLine(line);
    }
  }
}
