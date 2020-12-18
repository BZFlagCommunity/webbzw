import {highlightHtml} from "./src/highlight/core.ts";

const COUNT = 10000;

const start = performance.now();

for(let i = 0; i < COUNT; i++){
  highlightHtml(`# sample world

world
  size 200
end

box
  position 0 0 0
  size 30 30 15
  rotation 45
end

pyramid
  position 50 50 0
  size 5 5 50
end

pyramid
  position -50 50 0
  size 5 5 50
end

pyramid
  position 50 -50 0
  size 5 5 50
end

pyramid
  position -50 -50 0
  size 5 5 50
end

base
  position -170 0 0
  size 30 30 .5
  color 1
end

base
  position 170 0 0
  size 30 30 .5
  color 2
end`);
}

console.log(`${COUNT} highlight html in ${performance.now() - start}ms`);
