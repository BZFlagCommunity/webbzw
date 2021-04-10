import {MapObject} from "./types.ts";
import * as objects from "./objects/mod.ts";

/** Parsed map */
export interface IMap{
  worldSize: number;
  objects: MapObject[];
}

/** Turn map into bzw source */
export function mapToBZW(map: IMap): string{
  return map.objects.map((object: MapObject) => object.toString()).join("\n\n");
}

/** Remove trailing comments and extra whitespace from line */
export function cleanLine(line: string): string{
  // remove trailing comment if there is one
  if(line.includes("#")){
    line = line.substring(0, line.indexOf("#"));
  }

  // remove extra whitespace
  line = line.trim().replace(/ +(?= )/g, "");

  return line;
}

/** Parse world source */
export function parse(source: string): IMap{
  const map: IMap = {
    worldSize: 400,
    objects: []
  };

  let current = "";

  for(let line of source.split("\n")){
    line = cleanLine(line);

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
    }else if(line.startsWith("physics")){
      current = "physics";
      map.objects.push(new objects.Physics(line));
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
        case "physics":
          map.objects[map.objects.length - 1].parseLine(line);

          if(current === "world" && line.startsWith("size")){
            map.worldSize = (map.objects[map.objects.length - 1] as objects.World).size;
          }
          break;
        default:
          break;
      }
    }
  }

  for(const object of map.objects){
    if(object instanceof objects.Group){
      (object as objects.Group).define = map.objects.find((otherObject) => otherObject instanceof objects.Define && (otherObject as objects.Define).id === (object as objects.Group).id) as objects.Define;
    }
  }

  return map;
}
