import { displayIP, inRange } from "range_check";

/**
 *
 * @param {object} options
 * @param {boolean} options.proxyAllDomains
 * @param {Array<string>} options.proxyableDomains
 * @param {Array<string>} options.blacklistedAddresses
 *
 * @returns {function(string, string=): boolean}
 */
function makeHostnameMatcher(options) {
  const proxyAllDomains = options.proxyAllDomains || false;
  const proxyableDomains = options.proxyableDomains || [];
  const blacklistedAddresses = options.blacklistedAddresses || [];

  /**
   *
   * @param {string} hostname
   * @param {string | undefined} port
   * @returns {boolean}
   */
  return function proxyAllowedHost(hostname, port) {
    // Normalize IPv4-mapped IPv6 (e.g. ::ffff:7f00:1) to IPv4 (127.0.0.1)
    // so they match IPv4 CIDR ranges in the blacklist.
    const normalizedHostname = displayIP(hostname) || hostname;

    // Exclude hosts that are really IP addresses and are in our blacklist.
    if (
      inRange(normalizedHostname, blacklistedAddresses) ||
      inRange(`${normalizedHostname}:${port}`, blacklistedAddresses) ||
      blacklistedAddresses.some(
        (addr) =>
          addr.toLowerCase() ===
            `${normalizedHostname}:${port}`.toLowerCase() ||
          addr.toLowerCase() === normalizedHostname.toLowerCase()
      )
    ) {
      return false;
    }

    if (proxyAllDomains) {
      return true;
    }

    const lowercaseHostname = hostname.toLowerCase();
    //check that host is from one of whitelisted domains
    return proxyableDomains.some((domain) => {
      const domainLower = domain.toLowerCase();
      // Exact match OR subdomain match (with leading dot)
      return (
        inRange(lowercaseHostname, domainLower) ||
        inRange(`${lowercaseHostname}:${port}`, domainLower) ||
        `${lowercaseHostname}:${port}` === domainLower ||
        lowercaseHostname === domainLower ||
        lowercaseHostname.endsWith(`.${domainLower}`)
      );
    });
  };
}

export { makeHostnameMatcher };
