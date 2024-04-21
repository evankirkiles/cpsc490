#!/usr/bin/env ts-node

const fs = require("node:fs");
const { spawn } = require("node:child_process");

type Action = { type: "fetch"; dest: string; src?: string };

const BASE_URL = "http://localhost:8787";

const ACTIONS: Action[] = [
  { type: "fetch", dest: "/" },
  { type: "fetch", dest: "/hypertext/WWW/TheProject.html", src: "/" },
  { type: "fetch", dest: "/hypertext/WWW/WhatIs.html", src: "/hypertext/WWW/TheProject.html" },
  { type: "fetch", dest: "/hypertext/WWW/Summary.html", src: "/hypertext/WWW/TheProject.html" },
  { type: "fetch", dest: "/hypertext/WWW/Policy.html", src: "/hypertext/WWW/TheProject.html" },
  { type: "fetch", dest: "/hypertext/WWW/News/9211.html", src: "/hypertext/WWW/TheProject.html" },
  { type: "fetch", dest: "/hypertext/WWW/News/9211.html", src: "/hypertext/WWW/TheProject.html" },
  { type: "fetch", dest: "/hypertext/README.html", src: "/" },
];

async function main() {
  // Start the dev server in the background
  const SERVER_DELAY = 2000;
  let server: any | undefined = undefined;
  // async function restartServer() {
  //   if (server) server.kill("SIGINT");
  //   await new Promise((resolve) => setTimeout(resolve, SERVER_DELAY));
  //   server = spawn(`pnpm`, ["dev:analytic"]);
  //   server.stdout.on("data", function (data: any) {
  //     console.log("stdout: " + data.toString());
  //   });
  //   await new Promise((resolve) => setTimeout(resolve, SERVER_DELAY));
  // }

  // How long to wait between requests
  const DELAY_MS = 1000;

  // Begin dev server
  const headers = ["i", "src", "dest", "elapsed_ms", "cached"] as const;
  const HEADER_NAMES = ["i", "Referer", "URL", "Time (ms)", "Cached?"];
  const results: { [key in (typeof headers)[number]]: any }[] = [];
  // await restartServer();
  let i = 0;
  for (const iter of [0, 1, 2]) {
    // On the third (and final) iteration, clear the cache.
    if (iter === 2) {
      console.log("Please shut down the server and restart it within 6 seconds to clear its cache.");
      await new Promise((resolve) => setTimeout(resolve, SERVER_DELAY * 3));
    }
    for (const action of ACTIONS) {
      const start = process.hrtime();
      const req = new Request(new URL(action.dest, BASE_URL).toString());
      if (action.src) req.headers.set("Referer", new URL(action.src, BASE_URL).toString());
      const resp = await fetch(req);
      const elapsed_ms = Math.trunc(process.hrtime(start)[1] / 1000) / 1000;
      const cached = resp.headers.get("cf-cache-status") === "HIT";
      i += 1;
      results.push({
        i,
        dest: action.dest,
        src: action.src,
        elapsed_ms: elapsed_ms.toFixed(1),
        cached: cached ? "✓" : "",
      });
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }
  console.table(results);

  // Write the results to a file
  const csv = [headers.join(",")];
  for (const result of results) {
    csv.push(headers.map((h) => result[h]).join(","));
  }
  // Get some final metrics
  csv.push(`,,,${results.reduce((acc, r) => acc + parseFloat(r.elapsed_ms), 0) / results.length},${(results.filter((r) => r.cached).length / results.length) * 100}%`);
  fs.writeFileSync("test/results/analytic.csv", csv.join("\n"));

  // C
  process.exit(0);
}

main();
