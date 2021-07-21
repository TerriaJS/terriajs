"use strict";

import i18next from "i18next";
import { Notification } from "../ReactViewModels/NotificationState";
import { terriaErrorNotification } from "../ReactViews/Notification/terriaErrorNotification";
import filterOutUndefined from "./filterOutUndefined";
import flatten from "./flatten";
import isDefined from "./isDefined";

/** This is used for I18n translation strings so we can "resolve" them when the Error is displayed to the user.
 * This means we can create TerriaErrors before i18next has been initialised.
 */
export interface I18nTranslateString {
  key: string;
  parameters?: Record<string, string>;
}

function resolveI18n(i: I18nTranslateString | string) {
  return typeof i === "string" ? i : i18next.t(i.key, i.parameters);
}

/** `TerriaErrorSeverity` can be `Error` or `Warning`.
 * Errors with severity `Error` are presented to the user. `Warning` will just be printed to console.
 */
export enum TerriaErrorSeverity {
  /** Errors which should be shown to the user. This should be used for any error which **may** significantly impact on user experience.
   * For example:
   * - Errors while loading map configuration
   * - Errors while loading map catalog
   * - Failing to load a catalog member/group
   * - Failing to add a catalog member to the workbench
   * - Failing to create a share link
   * - Failing to load models (from share links or stories) **if they are in the workbench**
   * - TileErrors
   */
  Error,
  /** Errors which can be ignored by the user. These will be printed to console s
   * For example:
   * - Failing to load models (from share links or stories) if they are **NOT** in the workbench
   */
  Warning
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

  /** If `true`, `lib\ReactViews\Notification\terriaErrorNotification.tsx` will be used to display error message.
   * If `false`, a plain old `Notification` will be used.
   * This will default to `true`
   */
  useTerriaErrorNotification?: boolean;

  /** TerriaErrorSeverity - will default to `Error`
   * A function can be used here, which will be resolved when the error is raised to user.
   */
  severity?: TerriaErrorSeverity | (() => TerriaErrorSeverity);
}

/** Object used to clone an existing TerriaError (see `TerriaError.clone()`).
 *
 * If this is a `string` it will be used to set `TerriaError.message`
 * If this is `TerriaErrorSeverity` it will be used to set `TerriaError.severity`
 */
export type TerriaErrorOverrides =
  | Partial<TerriaErrorOptions>
  | string
  | TerriaErrorSeverity;

export function parseOverrides(
  overrides: TerriaErrorOverrides | undefined
): Partial<TerriaErrorOptions> {
  // If overrides is a string - we treat is as the `message` parameter
  if (typeof overrides === "string") {
    overrides = { message: overrides };
  } else if (typeof overrides === "number") {
    overrides = { severity: overrides };
  }
  return overrides ?? {};
}

/**
 * Represents an error that occurred in a TerriaJS module, especially an asynchronous one that cannot be raised
 * by throwing an exception because no one would be able to catch it.
 */
export default class TerriaError {
  private readonly _message: string | I18nTranslateString;
  private readonly _title: string | I18nTranslateString;
  private readonly useTerriaErrorNotification: boolean;
  severity: TerriaErrorSeverity | (() => TerriaErrorSeverity);

  /** `sender` isn't really used for anything at the moment... */
  readonly sender: unknown;
  readonly originalError?: (TerriaError | Error)[];
  private _raisedToUser: boolean = false;

  /**
   * Convenience function to generate a TerriaError from some unknown error. It will try to extract a meaningful message from whatever object it is given.
   *
   * `overrides` can be used to add more context to the TerriaError
   *
   * If error is a `TerriaError`, and `overrides` are provided -  then `createParentError` will be used to create a tree of `TerriaErrors` (see {@link `TerriaError#createParentError}`).
   *
   * Note, you can not pass `TerriaErrorOptions` (or JSON version of `TerriaError`) as the error parameter.
   *
   * For example:
   *
   * This is  **incorrect**:
   *
   * ```
   * TerriaError.from({message: "Some message", title: "Some title"})
   * ```
   *
   * Instead you must use TerriaError constructor
   *
   * This is **correct**:
   *
   * ```
   * new TerriaError({message: "Some message", title: "Some title"})
   * ```
   */
  static from(error: unknown, overrides?: TerriaErrorOverrides): TerriaError {
    if (error instanceof TerriaError) {
      return isDefined(overrides) ? error.createParentError(overrides) : error;
    }

    // Try to find message from error object
    let message: string | undefined;

    if (typeof error === "string") {
      message = error;
    } else if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === "object" && error !== null) {
      message = error.toString();
    }

    return new TerriaError({
      title: { key: "core.terriaError.defaultTitle" },
      message: message ?? { key: "core.terriaError.defaultMessage" },
      // Create original Error from `error` object or `message`
      originalError:
        error instanceof Error
          ? error
          : message
          ? new Error(message)
          : undefined,
      ...parseOverrides(overrides)
    });
  }

  /** Combine an array of `TerriaErrors` into a single `TerriaError`.
   * `overrides` can be used to add more context to the combined `TerriaError`.
   */
  static combine(
    errors: (TerriaError | undefined)[],
    overrides: TerriaErrorOverrides
  ): TerriaError | undefined {
    const filteredErrors = errors.filter(e => isDefined(e)) as TerriaError[];
    if (filteredErrors.length === 0) return;

    // Find highest severity across errors (eg if one if `Error`, then the new TerriaError will also be `Error`)
    const severity = () =>
      filteredErrors
        .map(error => error.severity)
        .includes(TerriaErrorSeverity.Error)
        ? TerriaErrorSeverity.Error
        : TerriaErrorSeverity.Warning;

    return new TerriaError({
      // Set default title and message
      title: { key: "core.terriaError.defaultCombineTitle" },
      message: { key: "core.terriaError.defaultCombineMessage" },

      // Add original errors and overrides
      originalError: filteredErrors,
      severity,
      ...parseOverrides(overrides)
    });
  }

  constructor(options: TerriaErrorOptions) {
    this._message = options.message;
    this._title = options.title ?? { key: "core.terriaError.defaultTitle" };
    this.sender = options.sender;
    this._raisedToUser = options.raisedToUser ?? false;

    // Transform originalError to an array if needed
    this.originalError = isDefined(options.originalError)
      ? Array.isArray(options.originalError)
        ? options.originalError
        : [options.originalError]
      : [];
    this.useTerriaErrorNotification =
      options.useTerriaErrorNotification ?? true;

    this.severity = options.severity ?? TerriaErrorSeverity.Error;
  }

  get message() {
    return resolveI18n(this._message);
  }

  get title() {
    return resolveI18n(this._title);
  }

  /** Show error to user if `severity` is `Error` */
  get shouldRaiseToUser() {
    return this.severity === TerriaErrorSeverity.Error;
  }

  get raisedToUser() {
    return this._raisedToUser;
  }

  /** Set raisedToUser value for **all** `TerriaErrors` in this tree. */
  set raisedToUser(r: boolean) {
    this._raisedToUser = r;
    if (this.originalError) {
      this.originalError.forEach(err =>
        err instanceof TerriaError ? (err.raisedToUser = r) : null
      );
    }
  }

  /** Convert `TerriaError` to `Notification` */
  toNotification(): Notification {
    return {
      title: () => this.title, // Title may need to be resolved when error is raised to user (for example after i18next initialisation)
      // Use terriaErrorNotification or just use message
      message: this.useTerriaErrorNotification
        ? terriaErrorNotification(this)
        : () => this.message
    };
  }

  /**
   * Create a new parent `TerriaError` from this error. This essentially "clones" the `TerriaError` and applied `overrides` on top. It will also set `originalError` so we get a nice tree of `TerriaErrors`
   */
  createParentError(overrides?: TerriaErrorOverrides): TerriaError {
    return new TerriaError({
      message: this._message,
      title: this._title,
      sender: this.sender,
      raisedToUser: this._raisedToUser,
      originalError: this,
      severity: this.severity,
      ...parseOverrides(overrides)
    });
  }

  flatten(): TerriaError[] {
    return filterOutUndefined([
      this,
      ...flatten(
        this.originalError
          ? this.originalError.map(error =>
              error instanceof TerriaError ? error.flatten() : []
            )
          : []
      )
    ]);
  }
}
