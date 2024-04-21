import { Env, fetchAndCache, LocalizeLinks } from "./shared";

class PrefetchLinks {
  request: Request;
  env: Env;
  ctx: ExecutionContext;

  static ATTR_MAP: Record<string, string> = { a: "href", img: "src" };

  nRequests = 6;

  constructor(request: Request, env: Env, ctx: ExecutionContext) {
    this.request = request;
    this.env = env;
    this.ctx = ctx;
  }

  /**
   * Attempts to prefetch resources from elements matching ATTR_MAP, which
   * defines the target prefetching attributes for element type.
   */
  element(element: Element) {
    if (this.nRequests <= 0) return;
    const targetAttr = PrefetchLinks.ATTR_MAP[element.tagName];
    if (!targetAttr) return;
    const target = element.getAttribute(targetAttr);
    if (!target) return;
    const targetURL = new URL(target, this.request.url);
    if (targetURL.hostname !== new URL(this.request.url).hostname) return;
    this.nRequests -= 1;
    this.ctx.waitUntil(
      fetchAndCache(new Request(targetURL), this.env, this.ctx)
    );
  }
}

export default {
  fetch: async (request, env, ctx) => {
    const response = await fetchAndCache(request, env, ctx);
    return new HTMLRewriter()
      .on("a,img", new LocalizeLinks())
      .on("a,img", new PrefetchLinks(request, env, ctx))
      .transform(response);
  },
} satisfies ExportedHandler<Env>;
