import {renderToString} from "https://deno.land/x/dejs@0.9.3/mod.ts";

const [diagnostics, jsSource] = await Deno.bundle("src/app.ts", undefined, {
  baseUrl: "./src",
  target: "es5",
  module: "es2015",
  lib: ["es2016", "dom", "es5"]
});

if(diagnostics){
  console.log(diagnostics);
}

try{
  await Deno.lstat("build");
}catch(err){
  if(err instanceof Deno.errors.NotFound){
    await Deno.mkdir("build");
  }else{
    throw err;
  }
}

await Deno.writeTextFile("build/index.html", await renderToString(await Deno.readTextFile("./src/index.ejs"), {
  css: await Deno.readTextFile("./src/style.css"),
  js: jsSource
}));

console.log("compiled");
