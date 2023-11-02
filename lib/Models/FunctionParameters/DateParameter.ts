import FunctionParameter from "./FunctionParameter";

export default class DateParameter extends FunctionParameter<string> {
  static readonly type = "date";
  readonly type = "date";
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
          format: "date",
          date: value
        }
      }
    });
  }
}
