import dns from "dns";

// Pre-cached IPv6 for Supabase project gqhaqiuqraggumqohvvv (local dev fallback only)
let cachedIps: string[] = ["2406:da14:1772:ea00:33d8:dae9:3ce8:1d9"];

const originalLookup = dns.lookup.bind(dns);

(dns as any).lookup = function (hostname: string, options: any, callback: any) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }

  // Do NOT intercept connection pooler or production Render environment
  if (
    process.env.RENDER ||
    process.env.NODE_ENV === "production" ||
    (hostname && hostname.includes("pooler.supabase.com"))
  ) {
    return originalLookup(hostname, options, callback);
  }

  if (hostname && hostname.includes("supabase.co")) {
    const returnIps = (ips: string[]) => {
      if (options && options.all) {
        callback(null, ips.map((addr) => ({ address: addr, family: 6 })));
      } else {
        callback(null, ips[0], 6);
      }
    };

    if (cachedIps.length > 0) {
      process.nextTick(() => returnIps(cachedIps));
      return;
    }

    const resolver = new dns.promises.Resolver();
    resolver.setServers(["8.8.8.8", "1.1.1.1"]);
    resolver.resolve6(hostname)
      .then((addresses) => {
        if (addresses && addresses.length > 0) {
          cachedIps = addresses;
          returnIps(addresses);
        } else {
          originalLookup(hostname, options, callback);
        }
      })
      .catch(() => originalLookup(hostname, options, callback));
    return;
  }

  return originalLookup(hostname, options, callback);
};
