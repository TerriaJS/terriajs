"use strict";

import i18next from "i18next";
import { Notification } from "../ReactViewModels/ViewState";
import { terriaErrorNotification } from "../ReactViews/Notification/terriaErrorNotification";
import isDefined from "./isDefined";

export interface I18nTranslateString {
  key: string;
  parameters?: Record<string, string>;
}

function resolveI18n(i: I18nTranslateString | string) {
  return typeof i === "string" ? i : i18next.t(i.key, i.parameters);
}

export type Result<T> = PartialResult<T> | T;
export type PartialResult<T> = {
  result: T;
  error: TerriaError;
  isPartialResult: true;
};
export namespace Result {
  export function isPartial<T>(p: any): p is PartialResult<T> {
    return isDefined(p.isPartialResult) && p.isPartialResult;
  }

  export function getResult<T>(p: Result<T>): T {
    return isPartial(p) ? p.result : p;
  }

  export function getError<T>(p: Result<T>): TerriaError | undefined {
    return isPartial(p) ? p.error : undefined;
  }

  export function split<T>(
    p: Result<T>,
    errorOverrides?: TerriaErrorOverrides
  ): [T, TerriaError | undefined] {
    return [getResult(p), TerriaError.fromResult(p, errorOverrides)];
  }

  export function callback<T>(
    p: Result<T>,
    callback: (error: TerriaError) => void
  ): T {
    const error = getError(p);
    if (error) callback(error);
    return getResult(p);
  }

  export function raise<T>(
    p: Result<T>,
    errorOverrides?: TerriaErrorOverrides
  ): T {
    if (isPartial(p)) {
      throw TerriaError.fromResult(p, errorOverrides);
    }
    return getResult(p);
  }

  export function to<T>(result: T, error?: TerriaError): Result<T> {
    if (error) return { result, error, isPartialResult: true };
    return result;
  }
}

export interface TerriaErrorOptions {
  /**  A detailed message describing the error.  This message may be HTML and it should be sanitized before display to the user. */
  message: string | I18nTranslateString;
  /** A short title describing the error. */
  title?: string | I18nTranslateString;

  /** The object that raised the error. */
  sender?: unknown;
  /** True if the user has seen this error; otherwise, false. */
  raisedToUser?: boolean;

  originalError?: TerriaError | Error | (TerriaError | Error)[];

  useTerriaErrorNotification?: boolean;
}

export type TerriaErrorOverrides = Partial<TerriaErrorOptions>;

/**
 * Represents an error that occurred in a TerriaJS module, especially an asynchronous one that cannot be raised
 * by throwing an exception because no one would be able to catch it.
 */
export default class TerriaError {
  readonly sender: unknown;
  private readonly _message: string | I18nTranslateString;
  private readonly _title: string | I18nTranslateString;
  readonly originalError?: (TerriaError | Error)[];

  private readonly useTerriaErrorNotification: boolean;

  private _raisedToUser: boolean = false;

  static from(error: unknown, overrides?: TerriaErrorOverrides): TerriaError {
    if (error instanceof TerriaError) {
      return error.clone(overrides);
    }
    return new TerriaError({
      title: { key: "models.raiseError.errorTitle" },
      message:
        typeof error === "string"
          ? (error as string)
          : (error instanceof Error
              ? error.message
              : typeof error === "object"
              ? error?.toString()
              : undefined) ?? "Unknown error",
      originalError: error instanceof Error ? error : undefined,
      ...overrides
    });
  }

  static fromResult<T>(
    result: Result<T>,
    overrides?: TerriaErrorOverrides
  ): TerriaError | undefined {
    if (Result.isPartial(result)) {
      return isDefined(overrides)
        ? TerriaError.from(result.error, overrides)
        : result.error;
    }
  }

  static combine(
    errors: TerriaError[],
    overrides?: TerriaErrorOverrides
  ): TerriaError | undefined {
    if (errors.length === 0 && !overrides) return;
    return new TerriaError({
      title: { key: "models.raiseError.errorMultipleTitle" },
      message: { key: "models.raiseError.errorMultipleMessage" },
      originalError: errors,
      ...overrides
    });
  }

  constructor(options: TerriaErrorOptions) {
    this._message = options.message;
    this._title = options.title ?? { key: "core.terriaError.defaultValue" };
    this.sender = options.sender;
    this._raisedToUser = options.raisedToUser ?? false;
    this.originalError = isDefined(options.originalError)
      ? Array.isArray(options.originalError)
        ? options.originalError
        : [options.originalError]
      : [];
    this.useTerriaErrorNotification =
      options.useTerriaErrorNotification ?? true;
  }

  get message() {
    return resolveI18n(this._message);
  }

  get title() {
    return resolveI18n(this._title);
  }

  get raisedToUser() {
    return this._raisedToUser;
  }

  set raisedToUser(r: boolean) {
    this._raisedToUser = r;
    if (this.originalError instanceof TerriaError) {
      this.originalError.raisedToUser = r;
    }
  }

  toNotification(): Notification {
    return {
      title: () => this.title,
      message: this.useTerriaErrorNotification
        ? terriaErrorNotification(this)
        : () => this.message
    };
  }

  clone(overrides?: TerriaErrorOverrides): TerriaError {
    return new TerriaError({
      ...{
        message: this._message,
        title: this._title,
        sender: this.sender,
        raisedToUser: this._raisedToUser,
        originalError: this
      },
      ...overrides
    });
  }
}
