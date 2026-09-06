import { makeHostnameMatcher } from "../../../lib/controllers/proxy/proxy-allowed-host.js";

describe("proxyAllowedHost", () => {
  describe("blacklisted addresses", () => {
    it("should block IP addresses with and without specific ports", () => {
      // Block entire IP
      const blockAll = makeHostnameMatcher({
        proxyAllDomains: true,
        blacklistedAddresses: ["127.0.0.1"]
      });
      expect(blockAll("127.0.0.1", undefined)).toBe(false);
      expect(blockAll("127.0.0.1", "8080")).toBe(false);

      // Block specific IP:port combination
      const blockPort = makeHostnameMatcher({
        proxyAllDomains: true,
        blacklistedAddresses: ["127.0.0.1:8080"]
      });
      expect(blockPort("127.0.0.1", "8080")).toBe(false);
      expect(blockPort("127.0.0.1", "9090")).toBe(true);
    });

    it("should block IPs in CIDR range and allow IPs outside range", () => {
      const proxyAllowedHost = makeHostnameMatcher({
        proxyAllDomains: true,
        blacklistedAddresses: ["192.168.0.0/16"]
      });

      // Inside range - blocked
      expect(proxyAllowedHost("192.168.1.100", undefined)).toBe(false);
      expect(proxyAllowedHost("192.168.255.255", undefined)).toBe(false);

      // Outside range - allowed
      expect(proxyAllowedHost("192.169.1.1", undefined)).toBe(true);
      expect(proxyAllowedHost("10.0.0.1", undefined)).toBe(true);
    });

    it("should block multiple blacklisted addresses and ranges including IPv6", () => {
      const proxyAllowedHost = makeHostnameMatcher({
        proxyAllDomains: true,
        blacklistedAddresses: [
          "127.0.0.1",
          "10.0.0.0/8",
          "192.168.1.1:3000",
          "::1",
          "localhost"
        ]
      });

      expect(proxyAllowedHost("127.0.0.1", undefined)).toBe(false);
      expect(proxyAllowedHost("10.5.5.5", undefined)).toBe(false);
      expect(proxyAllowedHost("192.168.1.1", "3000")).toBe(false);
      expect(proxyAllowedHost("::1", undefined)).toBe(false);
      expect(proxyAllowedHost("localhost", undefined)).toBe(false);
    });

    it("should block IPv4-mapped IPv6 addresses that map to blacklisted IPv4", () => {
      const proxyAllowedHost = makeHostnameMatcher({
        proxyAllDomains: true,
        blacklistedAddresses: ["127.0.0.0/8", "10.0.0.0/8", "192.168.0.0/16"]
      });

      // IPv4-mapped IPv6 in hex form (as URL parser normalizes them)
      expect(proxyAllowedHost("::ffff:7f00:1", undefined)).toBe(false); // 127.0.0.1
      expect(proxyAllowedHost("::ffff:a00:1", undefined)).toBe(false); // 10.0.0.1
      expect(proxyAllowedHost("::ffff:c0a8:101", undefined)).toBe(false); // 192.168.1.1

      // IPv4-mapped IPv6 in dotted form
      expect(proxyAllowedHost("::ffff:127.0.0.1", undefined)).toBe(false);
      expect(proxyAllowedHost("::ffff:10.0.0.1", undefined)).toBe(false);
      expect(proxyAllowedHost("::ffff:192.168.1.1", undefined)).toBe(false);

      // Non-blacklisted IPv4-mapped should still be allowed
      expect(proxyAllowedHost("::ffff:8.8.8.8", undefined)).toBe(true);
    });

    it("should prioritize blacklist over allowed domains", () => {
      const proxyAllowedHost = makeHostnameMatcher({
        proxyableDomains: ["127.0.0.1"],
        blacklistedAddresses: ["127.0.0.1"]
      });

      expect(proxyAllowedHost("127.0.0.1", undefined)).toBe(false);
    });
  });

  it("should allow any domain, IP, or port when proxyAllDomains is true", () => {
    const proxyAllowedHost = makeHostnameMatcher({
      proxyAllDomains: true
    });

    // Domains
    expect(proxyAllowedHost("example.com", undefined)).toBe(true);
    expect(proxyAllowedHost("another.com", undefined)).toBe(true);
    expect(proxyAllowedHost("subdomain.example.com", undefined)).toBe(true);

    // IPv4
    expect(proxyAllowedHost("8.8.8.8", undefined)).toBe(true);
    expect(proxyAllowedHost("1.2.3.4", undefined)).toBe(true);

    // IPv6
    expect(proxyAllowedHost("2001:db8::1", undefined)).toBe(true);
    expect(proxyAllowedHost("::1", undefined)).toBe(true);

    // Ports
    expect(proxyAllowedHost("example.com", "8080")).toBe(true);
    expect(proxyAllowedHost("localhost", "3000")).toBe(true);
  });

  describe("exact domain matching", () => {
    it("should match domains and IPs exactly with case insensitivity", () => {
      const domainMatcher = makeHostnameMatcher({
        proxyableDomains: ["Example.COM", "my-site-123.com"]
      });
      expect(domainMatcher("example.com", undefined)).toBe(true);
      expect(domainMatcher("EXAMPLE.COM", undefined)).toBe(true);
      expect(domainMatcher("different.com", undefined)).toBe(false);

      // Domains with hyphens and numbers
      expect(domainMatcher("my-site-123.com", undefined)).toBe(true);
      expect(domainMatcher("MY-SITE-123.COM", undefined)).toBe(true);

      const ipMatcher = makeHostnameMatcher({
        proxyableDomains: ["192.168.1.1"]
      });
      expect(ipMatcher("192.168.1.1", undefined)).toBe(true);
    });

    it("should match ports exactly when specified", () => {
      const portMatcher = makeHostnameMatcher({
        proxyableDomains: ["example.com:8080", "192.168.1.1:3000"]
      });

      expect(portMatcher("example.com", "8080")).toBe(true);
      expect(portMatcher("example.com", "9090")).toBe(false);
      expect(portMatcher("example.com", undefined)).toBe(false);

      expect(portMatcher("192.168.1.1", "3000")).toBe(true);
    });
  });

  describe("subdomain matching", () => {
    it("should allow subdomains at all levels with case insensitivity", () => {
      const proxyAllowedHost = makeHostnameMatcher({
        proxyableDomains: ["Example.COM", "my-api-2024.io"]
      });

      // Single level
      expect(proxyAllowedHost("subdomain.example.com", undefined)).toBe(true);
      expect(proxyAllowedHost("www.example.com", undefined)).toBe(true);
      expect(proxyAllowedHost("api.example.com", undefined)).toBe(true);

      // Multi-level
      expect(proxyAllowedHost("deep.nested.sub.example.com", undefined)).toBe(
        true
      );
      expect(proxyAllowedHost("a.b.c.d.example.com", undefined)).toBe(true);

      // With ports
      expect(proxyAllowedHost("api.example.com", "8080")).toBe(true);

      // Case insensitive
      expect(proxyAllowedHost("API.EXAMPLE.COM", undefined)).toBe(true);
      expect(proxyAllowedHost("Api.Example.Com", undefined)).toBe(true);

      // Domains with special characters (hyphens, numbers)
      expect(proxyAllowedHost("v1.my-api-2024.io", undefined)).toBe(true);
      expect(proxyAllowedHost("staging-env.my-api-2024.io", undefined)).toBe(
        true
      );
    });

    it("should reject domains that only end with same suffix (not actual subdomains)", () => {
      const proxyAllowedHost = makeHostnameMatcher({
        proxyableDomains: ["example.com"]
      });

      // These end with "example.com" but are NOT subdomains
      expect(proxyAllowedHost("notexample.com", undefined)).toBe(false);
      expect(proxyAllowedHost("fakeexample.com", undefined)).toBe(false);
      expect(proxyAllowedHost("myexample.com", undefined)).toBe(false);
    });

    it("should reject subdomain of different domain", () => {
      const proxyAllowedHost = makeHostnameMatcher({
        proxyableDomains: ["example.com"]
      });

      expect(proxyAllowedHost("api.different.com", undefined)).toBe(false);
      expect(proxyAllowedHost("subdomain.another.org", undefined)).toBe(false);
    });

    it("should not allow parent domain when subdomain is in list", () => {
      const proxyAllowedHost = makeHostnameMatcher({
        proxyableDomains: ["api.example.com"]
      });

      // api.example.com is allowed
      expect(proxyAllowedHost("api.example.com", undefined)).toBe(true);

      // Subdomains of api.example.com are allowed
      expect(proxyAllowedHost("v1.api.example.com", undefined)).toBe(true);

      // But example.com itself is NOT allowed
      expect(proxyAllowedHost("example.com", undefined)).toBe(false);

      // And other subdomains of example.com are NOT allowed
      expect(proxyAllowedHost("www.example.com", undefined)).toBe(false);
    });
  });

  it("should allow IPs within CIDR ranges and reject IPs outside", () => {
    const smallRange = makeHostnameMatcher({
      proxyableDomains: ["192.168.0.0/24"]
    });

    // Inside /24 range
    expect(smallRange("192.168.0.1", undefined)).toBe(true);
    expect(smallRange("192.168.0.100", undefined)).toBe(true);
    expect(smallRange("192.168.0.255", undefined)).toBe(true);

    // Outside /24 range
    expect(smallRange("192.168.1.1", undefined)).toBe(false);
    expect(smallRange("10.0.0.1", undefined)).toBe(false);

    const largeRange = makeHostnameMatcher({
      proxyableDomains: ["10.0.0.0/8"]
    });

    // Inside /8 range
    expect(largeRange("10.0.0.1", undefined)).toBe(true);
    expect(largeRange("10.255.255.255", undefined)).toBe(true);
  });

  it("should handle multiple domains with mix of domains, IPs, and ranges", () => {
    const proxyAllowedHost = makeHostnameMatcher({
      proxyableDomains: [
        "example.com",
        "another.org",
        "192.168.1.100",
        "10.0.0.0/8",
        "api.service.com:8080"
      ]
    });

    // Exact matches
    expect(proxyAllowedHost("example.com", undefined)).toBe(true);
    expect(proxyAllowedHost("another.org", undefined)).toBe(true);

    // Subdomains
    expect(proxyAllowedHost("api.example.com", undefined)).toBe(true);

    // IP and ranges
    expect(proxyAllowedHost("192.168.1.100", undefined)).toBe(true);
    expect(proxyAllowedHost("10.5.5.5", undefined)).toBe(true);

    // Port-specific
    expect(proxyAllowedHost("api.service.com", "8080")).toBe(true);
    expect(proxyAllowedHost("api.service.com", "9090")).toBe(false);

    // Not in list
    expect(proxyAllowedHost("different.com", undefined)).toBe(false);
  });
});
