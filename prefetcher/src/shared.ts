export interface Env {
  D1: D1Database;
}

export const subrequests = {
  total: 0,
  increment(count: number = 1) {
    this.total += count;
  },
};

export async function fetchAndCache(
  request: Request,
  env: Env,
  ctx: ExecutionContext
) {
  const cache = caches.default;
  // Construct the cache key from the cache URL
  const cacheUrl = new URL(request.url);
  const cacheKey = new Request(cacheUrl.toString());
  // Check whether the value is already available in the cache
  subrequests.increment();
  let response = await cache.match(cacheKey);
  if (!response) {
    // If not in cache, get the resource from the origin and populate cache
    subrequests.increment();
    response = (await fetch(cacheKey)) as unknown as Response;
    if (response.status === 200) {
      subrequests.increment();
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
    }
    console.log(`Cache miss for: ${cacheUrl}`, subrequests.total);
  } else {
    console.log(`Cache hit for: ${request.url}`, subrequests.total);
  }
  return response;
}

/**
 * This class removes the absolute URLs that are present in the site.
 */
export class LocalizeLinks {
  static ATTR_MAP: Record<string, string> = { a: "href", img: "src" };

  /**
   * Attempts to prefetch relative elements found in ATTR_MAP.
   * @param url
   * @returns
   */
  element(element: Element) {
    const targetAttr = LocalizeLinks.ATTR_MAP[element.tagName];
    if (!targetAttr) return;
    const target = element.getAttribute(targetAttr);
    if (target)
      element.setAttribute(
        targetAttr,
        target.replace("http://info.cern.ch", "")
      );
  }
}
