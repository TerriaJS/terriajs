"use strict";

import i18next from "i18next";
import { observable } from "mobx";
import RequestErrorEvent from "terriajs-cesium/Source/Core/RequestErrorEvent";
import Terria from "../Models/Terria";
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
  /** Errors which should be shown to the user. This is the default value for all errors.
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

  /** Importance of the error message, this is used to determine which message is displayed to the user if multiple error messages exist.
   * Higher importance messages are shown to user over lower importance. Default value is 0
   * If two errors of equal importance are found - the first error found through depth-first search will be shown
   */
  importance?: number;

  /** A short title describing the error. */
  title?: string | I18nTranslateString;

  /** The object that raised the error. */
  sender?: unknown;

  /** True if error message should be shown to user *regardless* of error severity. If this is undefined, then error severity will be used to determine if overrideRaiseToUser (severity `Error` are presented to the user. `Warning` will just be printed to console) */
  overrideRaiseToUser?: boolean;

  /** True if the user has seen this error; otherwise, false. */
  raisedToUser?: boolean;

  /** Error which this error was created from. This means TerriaErrors can be represented as a tree of errors - and therefore a stacktrace can be generated */
  originalError?: TerriaError | Error | (TerriaError | Error)[];

  /** TerriaErrorSeverity - will default to `Error`
   * A function can be used here, which will be resolved when the error is raised to user.
   */
  severity?: TerriaErrorSeverity | (() => TerriaErrorSeverity);

  /** If true, show error details in terriaErrorNotification by default. If false, error details will be collapsed by default */
  showDetails?: boolean;
}

/** Object used to clone an existing TerriaError (see `TerriaError.createParentError()`).
 *
 * If this is a `string` it will be used to set `TerriaError.message`
 * If this is `TerriaErrorSeverity` it will be used to set `TerriaError.severity`
 */
export type TerriaErrorOverrides =
  | Partial<TerriaErrorOptions>
  | string
  | TerriaErrorSeverity;

/** Turn TerriaErrorOverrides to TerriaErrorOptions so it can be passed to TerriaError constructor */
export function parseOverrides(
  overrides: TerriaErrorOverrides | undefined
): Partial<TerriaErrorOptions> {
  // If overrides is a string - we treat is as the `message` parameter
  if (typeof overrides === "string") {
    overrides = { message: overrides };
  } else if (typeof overrides === "number") {
    overrides = { severity: overrides };
  }

  // Remove undefined properties
  if (overrides)
    Object.keys(overrides).forEach((key) =>
      (overrides as any)[key] === undefined
        ? delete (overrides as any)[key]
        : null
    );

  return overrides ?? {};
}

/**
 * Represents an error that occurred in a TerriaJS module, especially an asynchronous one that cannot be raised
 * by throwing an exception because no one would be able to catch it.
 */
export default class TerriaError {
  private readonly _message: string | I18nTranslateString;
  private readonly _title: string | I18nTranslateString;
  private _raisedToUser: boolean;

  readonly importance: number = 0;
  readonly severity: TerriaErrorSeverity | (() => TerriaErrorSeverity);
  /** `sender` isn't really used for anything at the moment... */
  readonly sender: unknown;
  readonly originalError?: (TerriaError | Error)[];
  readonly stack: string;

  /** Override shouldRaiseToUser (see `get shouldRaiseToUser()`) */
  overrideRaiseToUser: boolean | undefined;
  @observable showDetails: boolean;

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

    // Try to find message/title from error object
    let message: string | I18nTranslateString = {
      key: "core.terriaError.defaultMessage"
    };
    let title: string | I18nTranslateString = {
      key: "core.terriaError.defaultTitle"
    };
    // Create original Error from `error` object
    let originalError: Error | undefined;

    if (typeof error === "string") {
      message = error;
      originalError = new Error(message);
    }
    // If error is RequestErrorEvent - use networkRequestTitle and networkRequestMessage
    else if (error instanceof RequestErrorEvent) {
      title = { key: "core.terriaError.networkRequestTitle" };
      message = {
        key: "core.terriaError.networkRequestMessage"
      };
      originalError = new Error(error.toString());
    } else if (error instanceof Error) {
      message = error.message;
      originalError = error;
    } else if (typeof error === "object" && error !== null) {
      message = error.toString();
      originalError = new Error(error.toString());
    }

    return new TerriaError({
      title,
      message,
      originalError,
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
    const filteredErrors = errors.filter((e) => isDefined(e)) as TerriaError[];
    if (filteredErrors.length === 0) return;

    // If only one error, just create parent error - this is so we don't get unnecessary levels of TerriaError created
    if (filteredErrors.length === 1) {
      return filteredErrors[0].createParentError(overrides);
    }

    // Find highest severity across errors (eg if one if `Error`, then the new TerriaError will also be `Error`)
    const severity = () =>
      filteredErrors
        .map((error) =>
          typeof error.severity === "function"
            ? error.severity()
            : error.severity
        )
        .includes(TerriaErrorSeverity.Error)
        ? TerriaErrorSeverity.Error
        : TerriaErrorSeverity.Warning;

    // overrideRaiseToUser will be true if at least one error includes overrideRaiseToUser = true
    // Otherwise, it will be undefined
    let overrideRaiseToUser: boolean | undefined =
      filteredErrors.some((error) => error.overrideRaiseToUser === true) ||
      undefined;

    // overrideRaiseToUser will be false if:
    // - NO errors includes overrideRaiseToUser = true
    // - and at least one error includes overrideRaiseToUser = false
    if (
      !isDefined(overrideRaiseToUser) &&
      filteredErrors.some((error) => error.overrideRaiseToUser === false)
    ) {
      overrideRaiseToUser = false;
    }

    return new TerriaError({
      // Set default title and message
      title: { key: "core.terriaError.defaultCombineTitle" },
      message: { key: "core.terriaError.defaultCombineMessage" },

      // Add original errors and overrides
      originalError: filteredErrors,
      severity,
      overrideRaiseToUser,
      ...parseOverrides(overrides)
    });
  }

  constructor(options: TerriaErrorOptions) {
    this._message = options.message;
    this._title = options.title ?? { key: "core.terriaError.defaultTitle" };
    this.sender = options.sender;
    this._raisedToUser = options.raisedToUser ?? false;
    this.overrideRaiseToUser = options.overrideRaiseToUser;
    this.importance = options.importance ?? 0;
    this.showDetails = options.showDetails ?? false;

    // Transform originalError to an array if needed
    this.originalError = isDefined(options.originalError)
      ? Array.isArray(options.originalError)
        ? options.originalError
        : [options.originalError]
      : [];

    this.severity = options.severity ?? TerriaErrorSeverity.Error;

    this.stack = (new Error().stack ?? "")
      .split("\n")
      // Filter out some less useful lines in the stack trace
      .filter((s) =>
        ["result.ts", "terriaerror.ts", "opendatasoft.apiclient.umd.js"].every(
          (remove) => !s.toLowerCase().includes(remove)
        )
      )
      .join("\n");
  }

  get message() {
    return resolveI18n(this._message);
  }

  /** Return error with message of highest importance in Error tree */
  get highestImportanceError() {
    return this.flatten().sort((a, b) => b.importance - a.importance)[0];
  }

  get title() {
    return resolveI18n(this._title);
  }

  /** True if `severity` is `Error` and the error hasn't been raised yet - or return this.overrideRaiseToUser if it is defined */
  get shouldRaiseToUser() {
    return (
      // Return this.overrideRaiseToUser override if it is defined
      this.overrideRaiseToUser ??
      // Otherwise, we should raise the error if it hasn't already been raised and the severity is ERROR
      (!this.raisedToUser &&
        (typeof this.severity === "function"
          ? this.severity()
          : this.severity) === TerriaErrorSeverity.Error)
    );
  }

  /** Has any error in the error tree been raised to the user? */
  get raisedToUser() {
    return this.flatten().find((error) => error._raisedToUser) ? true : false;
  }

  /** Resolve error seveirty */
  get resolvedSeverity() {
    return typeof this.severity === "function"
      ? this.severity()
      : this.severity;
  }

  /** Set raisedToUser value for **all** `TerriaErrors` in this tree. */
  set raisedToUser(r: boolean) {
    this._raisedToUser = r;
    if (this.originalError) {
      this.originalError.forEach((err) =>
        err instanceof TerriaError ? (err.raisedToUser = r) : null
      );
    }
  }

  /** Print error to console */
  log() {
    this.resolvedSeverity === TerriaErrorSeverity.Warning
      ? console.warn(this.toString())
      : console.error(this.toString());
  }

  /** Convert `TerriaError` to `Notification` */
  toNotification(): Notification {
    return {
      title: () => this.highestImportanceError.title, // Title may need to be resolved when error is raised to user (for example after i18next initialisation)
      message: terriaErrorNotification(this),
      // Don't show TerriaError Notification if shouldRaiseToUser is false, or we have already raisedToUser
      ignore: () => !this.shouldRaiseToUser,
      // Set raisedToUser to true on dismiss
      onDismiss: () => (this.raisedToUser = true)
    };
  }

  /**
   * Create a new parent `TerriaError` from this error. This essentially "clones" the `TerriaError` and applied `overrides` on top. It will also set `originalError` so we get a nice tree of `TerriaErrors`
   */
  createParentError(overrides?: TerriaErrorOverrides): TerriaError {
    // Note: we don't copy over `raisedToUser` or `importance` here
    // We don't need `raisedToUser` as the getter will check all errors in the tree when called
    // We don't want `importance` copied over, as it may vary between errors in the tree - and we want to be able to find errors with highest importance when diplaying the entire error tree to the user
    return new TerriaError({
      message: this._message,
      title: this._title,
      sender: this.sender,
      originalError: this,
      severity: this.severity,
      overrideRaiseToUser: this.overrideRaiseToUser,
      ...parseOverrides(overrides)
    });
  }

  /** Depth-first flatten */
  flatten(): TerriaError[] {
    return filterOutUndefined([
      this,
      ...flatten(
        this.originalError
          ? this.originalError.map((error) =>
              error instanceof TerriaError ? error.flatten() : []
            )
          : []
      )
    ]);
  }

  /**
   * Returns a plain error object for this TerriaError instance.
   *
   * The `message` string for the returned plain error will include the
   * messages from all the nested `originalError`s for this instance.
   */
  toError(): Error {
    // indentation required per nesting when stringifying nested error messages
    const indentChar = "  ";
    const buildNested: (
      prop: "message" | "stack"
    ) => (error: TerriaError, depth: number) => string | undefined =
      (prop) => (error, depth) => {
        if (!Array.isArray(error.originalError)) {
          return;
        }

        const indent = indentChar.repeat(depth);
        const nestedMessage = error.originalError
          .map((e) => {
            if (e instanceof TerriaError) {
              // recursively build the message for nested errors
              return `${e[prop]
                ?.split("\n")
                .map((s) => indent + s)
                .join("\n")}\n${buildNested(prop)(e, depth + 1)}`;
            } else {
              return `${e[prop]
                ?.split("\n")
                .map((s) => indent + s)
                .join("\n")}`;
            }
          })
          .join("\n");
        return nestedMessage;
      };

    let message = this.message;
    const nestedMessage = buildNested("message")(this, 1);
    if (nestedMessage) {
      message = `${message}\nNested error:\n${nestedMessage}`;
    }

    const error = new Error(message);
    error.name = this.title;

    let stack = this.stack;
    const nestedStack = buildNested("stack")(this, 1);
    if (nestedStack) {
      stack = `${stack}\n${nestedStack}`;
    }
    error.stack = stack;
    return error;
  }

  toString(): string {
    // indentation required per nesting when stringifying nested error messages
    const indentChar = "  ";
    const buildNested: (
      error: TerriaError,
      depth: number
    ) => string | undefined = (error, depth) => {
      if (!Array.isArray(error.originalError)) {
        return;
      }

      const indent = indentChar.repeat(depth);
      const nestedMessage = error.originalError
        .map((e) => {
          const log = `${e.message}\n${e.stack}`
            .split("\n")
            .map((s) => indent + s)
            .join("\n");
          if (e instanceof TerriaError) {
            // recursively build the message for nested errors
            return `${log}\n${buildNested(e, depth + 1)}`;
          } else {
            return log;
          }
        })
        .join("\n");
      return nestedMessage;
    };

    const nestedMessage = buildNested(this, 1);
    return `${this.title}: ${this.highestImportanceError.message}\n${nestedMessage}`;
  }

  raiseError(
    terria: Terria,
    errorOverrides?: TerriaErrorOverrides,
    forceRaiseToUser?: boolean
  ) {
    terria.raiseErrorToUser(this, errorOverrides, forceRaiseToUser);
  }
}

/** Wrap up network request error with user-friendly message */
export function networkRequestError(error: TerriaError | TerriaErrorOptions) {
  // Combine network error with "networkRequestMessageDetailed" - this contains extra info about what could cause network error
  return TerriaError.combine(
    [
      error instanceof TerriaError ? error : new TerriaError(error),
      new TerriaError({
        message: {
          key: "core.terriaError.networkRequestMessageDetailed"
        }
      })
    ],
    // Override combined error with user-friendly title and message
    {
      title: { key: "core.terriaError.networkRequestTitle" },
      message: {
        key: "core.terriaError.networkRequestMessage"
      },
      importance: 1
    }
  );
}
