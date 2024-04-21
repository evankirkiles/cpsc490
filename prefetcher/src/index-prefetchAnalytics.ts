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

const PREFETCH_LIMIT = 5;

async function prefetch(
  env: Env,
  ctx: ExecutionContext,
  src: string,
  referrer?: string | null
) {
  const [toPrefetch] = await env.D1.batch<{ dest: string; freq: number }>([
    env.D1.prepare(
      `SELECT dest, freq FROM prefetch WHERE src = ?1 \
       ORDER BY freq DESC LIMIT ?2`
    ).bind(src, PREFETCH_LIMIT),
    ...(referrer
      ? [
          env.D1.prepare(
            "INSERT INTO prefetch (src, dest, freq) VALUES (?1, ?2, 1) \
             ON CONFLICT(src, dest) DO UPDATE SET freq = freq + 1"
          ).bind(referrer, src),
        ]
      : []),
  ]);
  await Promise.all(
    toPrefetch.results?.map(({ dest }) =>
      fetchAndCache(new Request(dest), env, ctx)
    )
  );
}

export default {
  fetch: async (request, env, ctx) => {
    const response = await fetchAndCache(request, env, ctx);
    const referrer = request.headers.get("Referer");
    ctx.waitUntil(prefetch(env, ctx, request.url, referrer));
    return new HTMLRewriter()
      .on("a,img", new LocalizeLinks())
      .transform(response);
  },
} satisfies ExportedHandler<Env>;
