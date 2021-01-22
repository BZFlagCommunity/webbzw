import {bench, runBenchmarks} from "https://deno.land/std@0.84.0/testing/bench.ts";

import {highlightHtml} from "./src/highlight/core.ts";

const source = await fetch("https://raw.githubusercontent.com/The-Noah/tank-wars/master/map.bzw").then((res) => res.text());

bench({
  name: "hightlight sample world",
  runs: 1000,
  func(b): void{
    b.start();

    highlightHtml(source);

    b.stop();
  },
});

runBenchmarks();
