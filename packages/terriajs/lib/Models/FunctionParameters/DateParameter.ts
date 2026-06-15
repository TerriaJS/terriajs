import Clock from "terriajs-cesium/Source/Core/Clock";
import CatalogFunctionMixin from "../../ModelMixins/CatalogFunctionMixin";
import FunctionParameter, { Options } from "./FunctionParameter";
import { makeObservable, override } from "mobx";
import moment from "moment";

interface DateParameterOptions extends Options {
  /**
   * Clock to read the default date time value
   */
  clock: Clock;
}

export default class DateParameter extends FunctionParameter<string> {
  static readonly type = "date";
  readonly type = "date";
  variant = "complex";

  private readonly clock: Clock;

  constructor(
    protected readonly catalogFunction: CatalogFunctionMixin.Instance,
    options: DateParameterOptions
  ) {
    super(catalogFunction, options);
    this.clock = options.clock;
    makeObservable(this);
  }

  /**
   * Return current date value.
   *
   * When no value is available and the field is marked as required, then
   * return the current timeline clock date.
   */
  @override
  get value(): string | undefined {
    return (
      super.value ?? (this.isRequired ? this.currentClockDate() : undefined)
    );
  }

  /**
   * Validate and set datetime value
   */
  setValue(stratumId: string, newValue: string) {
    super.setValue(
      stratumId,
      this.isValidDate(newValue) ? newValue : undefined
    );
  }

  private isValidDate(value: string): boolean {
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.valueOf());
  }

  /**
   * Returns current clock time in local time zone.
   */
  private currentClockDate(): string {
    const currentTime = this.clock.currentTime;
    const ct = new Date(currentTime.toString());
    const date = moment.utc(ct.toISOString()).local().format("YYYY-MM-DD");
    return date;
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
          format: "date",
          date: value
        }
      }
    });
  }
}
