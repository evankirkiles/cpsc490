/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler deploy src/index.ts --name my-worker` to deploy your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { Env, fetchAndCache, LocalizeLinks } from "./shared";

export default {
  fetch: async (...args) => {
    const response = await fetchAndCache(...args);
    return new HTMLRewriter()
      .on("a,img", new LocalizeLinks())
      .transform(response);
  },
} satisfies ExportedHandler<Env>;
