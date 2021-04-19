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

/** Object used to create a TerriaError */
export interface TerriaErrorOptions {
  /**  A detailed message describing the error.  This message may be HTML and it should be sanitized before display to the user. */
  message: string | I18nTranslateString;
  /** A short title describing the error. */
  title?: string | I18nTranslateString;

  /** The object that raised the error. */
  sender?: unknown;
  /** True if the user has seen this error; otherwise, false. */
  raisedToUser?: boolean;

  /** Error which this error was created from. This means TerriaErrors can be represented as a tree of errors - and therefore a stacktrace can be generated */
  originalError?: TerriaError | Error | (TerriaError | Error)[];

  /** If true, lib\ReactViews\Notification\terriaErrorNotification.tsx will be used to display error message.
   * If false, a plain old `Notification` will be used
   */
  useTerriaErrorNotification?: boolean;
}

/** Object used to clone an existing TerriaError (see `TerriaError.clone()`).
 *
 * If this is a `string` it will be used to set `TerriaError.message`
 */
export type TerriaErrorOverrides = Partial<TerriaErrorOptions> | string;

/**
 * Represents an error that occurred in a TerriaJS module, especially an asynchronous one that cannot be raised
 * by throwing an exception because no one would be able to catch it.
 */
export default class TerriaError {
  private readonly _message: string | I18nTranslateString;
  private readonly _title: string | I18nTranslateString;
  private readonly useTerriaErrorNotification: boolean;

  /** `sender` isn't really used for anything at the moment... */
  readonly sender: unknown;
  readonly originalError?: (TerriaError | Error)[];
  private _raisedToUser: boolean = false;

  /**
   * Convenience function to generate a TerriaError from some unknown error. It will try to extract a meaningful message from whatever object it is given.
   *
   * If error is a `TerriaError`, then it will be `cloned` to create a tree of `TerriaErrors` (see `TerriaError.clone()`).
   *
   * `overrides` can be used to add more context to the TerriaError
   */
  static from(error: unknown, overrides?: TerriaErrorOverrides): TerriaError {
    if (error instanceof TerriaError) {
      return isDefined(overrides) ? error.createParentError(overrides) : error;
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

  /** Combine an array of `TerriaErrors` into a single `TerriaError`.
   * `overrides` can be used to add more context to the combined `TerriaError`.
   */
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

  /** Set raisedToUser value for **all** `TerriaErrors` in this tree. */
  set raisedToUser(r: boolean) {
    this._raisedToUser = r;
    if (this.originalError instanceof TerriaError) {
      this.originalError.raisedToUser = r;
    }
  }

  /** Convert `TerriaError` to `Notification` */
  toNotification(): Notification {
    return {
      title: () => this.title,
      message: this.useTerriaErrorNotification
        ? terriaErrorNotification(this)
        : () => this.message
    };
  }

  /**
   * Create a new parent `TerriaError` from this error. This essentially "clones" the `TerriaError` and applied `overrides` on top. It will also set `originalError` so we get a nice tree of `TerriaError`s
   */
  createParentError(overrides?: TerriaErrorOverrides): TerriaError {
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
