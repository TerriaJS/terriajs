declare class ConsoleAnalytics {
  start: (
    configParameters: Partial<{
      enableConsoleAnalytics: boolean;
      googleAnalyticsKey: any;
      googleAnalyticsOptions: any;
    }>
  ) => void;
  logEvent: (
    category: string,
    action: string,
    label?: string,
    value?: number
  ) => void;
}

export default ConsoleAnalytics;
