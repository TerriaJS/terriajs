export interface ServerConfigResponse {
  /**
   * Current version of server
   */
  version: string;
  /**
   * Whether all domains can be proxied
   */
  proxyAllDomains?: boolean;
  /**
   * Array of domains that can be proxied
   */
  allowProxyFor?: string[];
  /**
   * Object defining share URL prefixes that can be resolved
   */
  shareUrlPrefixes?: Record<string, string>;
  /**
   * if defined, the share URL service is active
   */
  newShareUrlPrefix?: string;
  /**
   * Human readable maximum request size for share URL service, e.g. "10mb".
   */
  shareMaxRequestSize?: string;
  /**
   * Maximum request size for share URL service in bytes.
   */
  shareMaxRequestSizeBytes?: number;
  /**
   * array of additional feedback parameters that can be used
   */
  additionalFeedbackParameters?: {
    descriptiveLabel: string;
    name: string;
  }[];
}
