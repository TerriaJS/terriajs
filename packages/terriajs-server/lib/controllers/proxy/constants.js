const DURATION_REGEX = /^(\d+|\d+\.\d+)(ms|s|m|h|d|w|y)$/;
const PROTOCOL_REGEX = /^\w+:\//;
const DO_NOT_PROXY_REGEX =
  /^(?:Host|X-Forwarded-Host|Proxy-Connection|Connection|Keep-Alive|Transfer-Encoding|TE|Trailer|Proxy-Authorization|Proxy-Authenticate|Upgrade|Expires|pragma|Strict-Transport-Security|Cookie|Set-Cookie)$/i;
const AUTH_STATUS_CODES = [401, 403, 407, 511];
const MAX_REDIRECTS = 5;

/** Age to override cache instructions with for proxied files */
const DEFAULT_MAX_AGE_SECONDS = 2 * 7 * 24 * 60 * 60; // two weeks
const DEFAULT_HEADERS_TIMEOUT_MS = 30_000; // 30 seconds
const DEFAULT_CONNECT_TIMEOUT_MS = 10_000; // 10 seconds
const DEFAULT_MAX_SIZE = 102400;
const DEFAULT_RESPONSE_SIZE_LIMIT = 100 * 1024 * 1024; // 100MB

const DURATION_UNITS = {
  ms: 1.0 / 1000,
  s: 1.0,
  m: 60.0,
  h: 60.0 * 60.0,
  d: 24.0 * 60.0 * 60.0,
  w: 7.0 * 24.0 * 60.0 * 60.0,
  y: 365 * 24.0 * 60.0 * 60.0
};

// If you change this, also change the same list in serverconfig.json.example.
// Those pages are helpful: https://en.wikipedia.org/wiki/Reserved_IP_addresses
// https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry.xhtml
// https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry.xhtml
const DEFAULT_BLACKLIST = [
  // loopback
  "127.0.0.0/8",
  "::1/128",
  // link-local
  "169.254.0.0/16",
  "fe80::/10",
  // private networks (RFC 1918)
  "10.0.0.0/8",
  "172.16.0.0/12",
  "192.168.0.0/16",
  "fc00::/7",
  // current network, "this" host (RFC 1122)
  "0.0.0.0/8",
  // carrier-grade NAT / shared address space (RFC 6598)
  "100.64.0.0/10",
  // IETF protocol assignments (RFC 6890)
  "192.0.0.0/24",
  // documentation / test ranges (RFC 5737)
  "192.0.2.0/24",
  "198.51.100.0/24",
  "203.0.113.0/24",
  // benchmarking (RFC 2544)
  "198.18.0.0/15",
  // 6to4 relay anycast (RFC 7526)
  "192.88.99.0/24",
  // AS112-v4 DNS blackhole (RFC 7535)
  "192.31.196.0/24",
  // AMT relay discovery (RFC 7450)
  "192.52.193.0/24",
  // AS112 direct delegation (RFC 7534)
  "192.175.48.0/24",
  // multicast (RFC 5771)
  "224.0.0.0/4",
  // reserved for future use (RFC 1112)
  "240.0.0.0/4",
  // broadcast
  "255.255.255.255/32",
  // unspecified address (RFC 4291)
  "::/128",
  // documentation (RFC 3849)
  "2001:db8::/32",
  // multicast (RFC 4291)
  "ff00::/8",
  // IPv4-mapped IPv6 (RFC 4291) - defense-in-depth alongside displayIP normalization
  "::ffff:0:0/96",
  // NAT64 well-known prefix (RFC 6052) - translates to internal IPv4 via NAT64 gateways
  "64:ff9b::/96",
  // NAT64 local-use prefix (RFC 8215) - operator-specific NAT64 translation
  "64:ff9b:1::/48",
  // IETF protocol assignments (RFC 2928) - covers Teredo, ORCHIDv2, benchmarking, AMT, AS112-v6, and more
  "2001::/23",
  // 6to4 (RFC 3056) - embeds IPv4 addresses (2002:AABB:CCDD:: maps to AA.BB.CC.DD)
  "2002::/16",
  // site-local (RFC 3879, deprecated) - legacy internal addresses still honored by some systems
  "fec0::/10",
  // discard prefix (RFC 6666)
  "100::/64",
  // DETS prefix (RFC 9780)
  "100:0:0:1::/64",
  // RPKI (RFC 9511)
  "2620:4f:8000::/48",
  // documentation (RFC 9637)
  "3fff::/20",
  // segment routing (RFC 9602)
  "5f00::/16"
];

export {
  AUTH_STATUS_CODES,
  DURATION_REGEX,
  PROTOCOL_REGEX,
  DO_NOT_PROXY_REGEX,
  MAX_REDIRECTS,
  DEFAULT_MAX_AGE_SECONDS,
  DEFAULT_HEADERS_TIMEOUT_MS,
  DEFAULT_CONNECT_TIMEOUT_MS,
  DEFAULT_MAX_SIZE,
  DEFAULT_RESPONSE_SIZE_LIMIT,
  DURATION_UNITS,
  DEFAULT_BLACKLIST
};
