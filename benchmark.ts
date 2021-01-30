import {bench, runBenchmarks} from "https://deno.land/std@0.84.0/testing/bench.ts";

import {highlightHtml} from "./src/highlight/core.ts";

const source = await fetch("https://pastebin.com/raw/VrAN22c0").then((res) => res.text());

bench({
  name: "hightlight xtreme paintball",
  runs: 100,
  func(b): void{
    b.start();

    highlightHtml(source);

    b.stop();
  },
});

runBenchmarks();
