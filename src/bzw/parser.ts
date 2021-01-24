import {MapObject} from "./types.ts";
import * as objects from "./objects/mod.ts";

/** Parsed map */
export interface IMap{
  worldSize: number;
  objects: MapObject[];
}

/** Parse world source */
export function parse(source: string): IMap{
  const map: IMap = {
    worldSize: 400,
    objects: []
  };

  let current = "";

  for(let line of source.split("\n")){
    // remove trailing comment if there is one
    if(line.includes("#")){
      line = line.substring(0, line.indexOf("#"));
    }

    // remove extra whitespace
    line = line.trim().replace(/ +(?= )/g, "");

    if(line[0] === "#"){
      continue;
    }

    if(current === "define"){
      if(line === "enddef"){
        current = "";
        continue;
      }

      map.objects[map.objects.length - 1].parseLine(line);
      continue;
    }

    if(line === "end"){
      current = "";
    }else if(line === "world"){
      current = line;
      map.objects.push(new objects.World(line));
    }else if(line === "box"){
      current = line;
      map.objects.push(new objects.Box(line));
    }else if(line === "meshbox"){
      current = line;
      map.objects.push(new objects.MeshBox(line));
    }else if(line === "pyramid"){
      current = line;
      map.objects.push(new objects.Pyramid(line));
    }else if(line === "meshpyr"){
      current = line;
      map.objects.push(new objects.MeshPyramid(line));
    }else if(line === "base"){
      current = line;
      map.objects.push(new objects.Base(line));
    }else if(line === "zone"){
      current = line;
      map.objects.push(new objects.Zone(line));
    }else if(line.startsWith("define")){
      current = "define";
      map.objects.push(new objects.Define(line));
    }else if(line.startsWith("group")){
      current = "group";
      map.objects.push(new objects.Group(line));
    }else{
      switch(current){
        case "world":
        case "box":
        case "meshbox":
        case "pyramid":
        case "meshpyr":
        case "base":
        case "zone":
        case "define":
        case "group":
          map.objects[map.objects.length - 1].parseLine(line);

          if(current === "world" && line.startsWith("size")){
            map.worldSize = map.objects[map.objects.length - 1].size[0];
          }
          break;
        default:
          break;
      }
    }
  }

  return map;
}
