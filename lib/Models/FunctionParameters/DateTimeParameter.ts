import FunctionParameter from "./FunctionParameter";

export default class DateTimeParameter extends FunctionParameter<string> {
  static readonly type = "dateTime";
  readonly type = "dateTime";
  variant = "complex";

  /**
   * Process value so that it can be used in an URL.
   */
  static formatValueForUrl(value: string) {
    return JSON.stringify({
      type: "object",
      properties: {
        timestamp: {
          type: "string",
          format: "date-time",
          "date-time": value
        }
      }
    });
  }
}
