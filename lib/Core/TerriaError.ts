"use strict";

import i18next from "i18next";
import { Notification } from "../ReactViewModels/ViewState";
import { terriaErrorNotification } from "../ReactViews/Notification/terriaErrorNotification";
import isDefined from "./isDefined";
import { NotUndefined } from "./TypeModifiers";

export interface I18nTranslateString {
  key: string;
  parameters?: Record<string, string>;
}

function resolveI18n(i: I18nTranslateString | string) {
  return typeof i === "string" ? i : i18next.t(i.key, i.parameters);
}

// TODO:
// When to use this or just throw Terria Errors?
export class Result<T> {
  static error(error: TerriaErrorOptions | TerriaError): Result<undefined> {
    return new Result(
      undefined,
      error instanceof TerriaError ? error : new TerriaError(error)
    );
  }

  static return<U>(result: U, errorOptions: TerriaErrorOptions): Result<U> {
    return new Result(result, new TerriaError(errorOptions));
  }

  constructor(readonly result: T, readonly error?: TerriaError) {}

  catch(callback: (error: TerriaError) => void) {
    if (this.error) callback(this.error);
    return this;
  }

  // Rename to throwIfError
  throw(errorOverrides?: TerriaErrorOverrides) {
    if (this.error) {
      throw this.error.clone(errorOverrides);
    }
    return this;
  }

  // Rename to throwIfUndefined
  required(errorOverrides?: TerriaErrorOverrides) {
    if (isDefined(this.result))
      return (this as unknown) as Result<NotUndefined<T>>;
    if (this.error) {
      throw this.error.clone(errorOverrides);
    }
    if (typeof errorOverrides === "string") {
      errorOverrides = { message: errorOverrides };
    }
    throw new TerriaError({
      message: "Unhandled required Result exception",
      ...errorOverrides
    });
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

export type TerriaErrorOverrides = Partial<TerriaErrorOptions> | string;

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
    if (typeof overrides === "string") {
      overrides = { message: overrides };
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

  static combine(
    errors: TerriaError[],
    overrides: TerriaErrorOverrides
  ): TerriaError | undefined {
    if (errors.length === 0) return;
    if (typeof overrides === "string") {
      overrides = { message: overrides };
    }
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
    if (typeof overrides === "string") {
      overrides = { message: overrides };
    }
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
