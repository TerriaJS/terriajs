import { makeObservable, override } from "mobx";
import moment from "moment";
import Clock from "terriajs-cesium/Source/Core/Clock";
import CatalogFunctionMixin from "../../ModelMixins/CatalogFunctionMixin";
import FunctionParameter, { Options } from "./FunctionParameter";

interface DateTimeParameterOptions extends Options {
  /**
   * Clock to read the default date time value
   */
  clock: Clock;
}

export default class DateTimeParameter extends FunctionParameter<string> {
  static readonly type = "dateTime";
  readonly type = "dateTime";
  variant = "complex";

  private readonly clock: Clock;

  constructor(
    protected readonly catalogFunction: CatalogFunctionMixin.Instance,
    options: DateTimeParameterOptions
  ) {
    super(catalogFunction, options);
    this.clock = options.clock;
    makeObservable(this);
  }

  /**
   * Return current date time value.
   *
   * When no value is available and the field is marked as required, then
   * return the current timeline clock time.
   */
  @override
  get value(): string | undefined {
    return (
      super.value ?? (this.isRequired ? this.currentClockTime() : undefined)
    );
  }

  /**
   * Validate and set datetime value
   */
  setValue(stratumId: string, newValue: string) {
    super.setValue(
      stratumId,
      this.isValidDateTime(newValue) ? newValue : undefined
    );
  }

  private isValidDateTime(value: string): boolean {
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.valueOf());
  }

  /**
   * Returns current clock time in local time zone.
   */
  private currentClockTime(): string {
    const currentTime = this.clock.currentTime;
    const ct = new Date(currentTime.toString());
    const date = moment.utc(ct.toISOString()).local().format("YYYY-MM-DD");
    const time = moment.utc(ct.toISOString()).local().format("HH:mm");
    return `${date}T${time}`;
  }

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
