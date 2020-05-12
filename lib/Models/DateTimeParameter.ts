import FunctionParameter from "./FunctionParameter";
import { observable } from "mobx";

export default class DateTimeParameter extends FunctionParameter<string> {
  readonly type = "dateTime";

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
