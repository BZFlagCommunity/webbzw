import {serve} from "https://deno.land/std@0.80.0/http/server.ts";

import {renderToString} from "https://deno.land/x/dejs@0.9.3/mod.ts";
import ws from "https://deno.land/x/deno_ws@0.1.4/mod.ts";

const build = async (): Promise<string> => {
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

  return await renderToString(await Deno.readTextFile("./src/index.ejs"), {
    css: await Deno.readTextFile("./src/style.css"),
    js: jsSource
  });

  console.log("compiled");
}

if(Deno.args[0] === "serve"){
  const WS_PORT = 8001;
  const RELOAD_COMMAND = "reload";

  const server = serve({port: 8000});
  console.log("dev server running on http://localhost:8000/");

  const wss = new ws.Server(undefined, WS_PORT);
  wss.on("connection", () => {
    console.log("new ws connection");
  });

  setTimeout(async () => {
    for await(const event of Deno.watchFs("src", {recursive: true})){
      wss.clients.forEach((client) => client.send(RELOAD_COMMAND));
    }
  });

  for await(const req of server){
    req.respond({
      body: await build()+`<script>var ssgs=new WebSocket("ws://localhost:${WS_PORT}");ssgs.onmessage=function(event){if(event.data==="${RELOAD_COMMAND}"){window.location.reload()}}</script>`
    });
  }
}else{
  await Deno.writeTextFile("build/index.html", await build());
}
