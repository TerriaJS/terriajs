declare class ServerConfig {
  config: unknown;
  init(serverConfigUrl: string): Promise<unknown>;
}

export default ServerConfig;
