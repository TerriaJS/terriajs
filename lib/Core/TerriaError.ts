"use strict";

import i18next from "i18next";
import { Notification } from "../ReactViewModels/ViewState";
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

export enum TerriaErrorSeverity {
  /** Critical errors should be used for any error which **will** cause Terria to fail or behave incorrectly.
   * For example:
   * - Errors while loading map configuration
   * - Errors while loading map catalog
   */
  Critical,
  /** Errors which should be shown to the user. This should be used for any error which **may** significantly impact on user experience.
   * For example:
   * - Failing to load a catalog member/group
   * - Failing to add a catalog member to the workbench
   * - Failing to create a share link
   * - Failing to load models (from share links or stories) **if they are in the workbench**
   * - TileErrors
   */
  Error,
  /** Errors which can be ignored by the user. These will be printed to console */
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

  /** If true, lib\ReactViews\Notification\terriaErrorNotification.tsx will be used to display error message.
   * If false, a plain old `Notification` will be used
   */
  useTerriaErrorNotification?: boolean;

  /** TerriaErrorSeverity - will default to Warning
   * A function can be used here, which will be resolved when the error is raised to user.
   */
  severity?: TerriaErrorSeverity | (() => TerriaErrorSeverity);
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
  readonly severity: TerriaErrorSeverity | (() => TerriaErrorSeverity);

  /** `sender` isn't really used for anything at the moment... */
  readonly sender: unknown;
  readonly originalError?: (TerriaError | Error)[];
  private _raisedToUser: boolean = false;

  /**
   * Convenience function to generate a TerriaError from some unknown error. It will try to extract a meaningful message from whatever object it is given.
   *
   * If error is a `TerriaError`, then `createParentError` it will be used to create a tree of `TerriaErrors` (see {@link `TerriaError#createParentError}`).
   *
   * `overrides` can be used to add more context to the TerriaError
   */
  static from(error: unknown, overrides?: TerriaErrorOverrides): TerriaError {
    if (error instanceof TerriaError) {
      return isDefined(overrides) ? error.createParentError(overrides) : error;
    }

    // Try to find message using overrides or error object
    let message = "Unknown error";

    // If overrides is a string - we treat is as the `message` parameter
    if (typeof overrides === "string") {
      message = overrides;
      overrides = {};
    } else if (typeof error === "string") {
      message = error;
    } else if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === "object" && error !== null) {
      message = error.toString();
    }

    return new TerriaError({
      title: { key: "core.terriaError.defaultTitle" },
      message,
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

    // If overrides is a string - we treat is as the `message` parameter
    if (typeof overrides === "string") {
      overrides = { message: overrides };
    }
    return new TerriaError({
      // Set default title and message
      title: { key: "core.terriaError.defaultCombineTitle" },
      message: { key: "core.terriaError.defaultCombineMessage" },

      // Add original errors and overrides
      originalError: errors,
      ...overrides
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

    this.severity = options.severity ?? TerriaErrorSeverity.Warning;
  }

  get message() {
    return resolveI18n(this._message);
  }

  get title() {
    return resolveI18n(this._title);
  }

  /** Show error to user if `nestedSeverity` is `Error` or `Critical */
  get shouldRaiseToUser() {
    return (
      this.nestedSeverity === TerriaErrorSeverity.Critical ||
      this.nestedSeverity === TerriaErrorSeverity.Error
    );
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

  /** Get the nested error severity for this TerriaError and it's children (originalErrors)
   * This will return the highest error severity across the whole tree of errors.
   * It essentially escalates the severity of errors to the highest severity across the tree
   */
  get nestedSeverity() {
    const nestedSeverity = this.flatten().map(error =>
      typeof error.severity === "function" ? error.severity() : error.severity
    );
    if (nestedSeverity.includes(TerriaErrorSeverity.Critical))
      return TerriaErrorSeverity.Critical;
    if (nestedSeverity.includes(TerriaErrorSeverity.Error))
      return TerriaErrorSeverity.Error;
    return TerriaErrorSeverity.Warning;
  }

  /** Convert `TerriaError` to `Notification` */
  toNotification(): Notification {
    return {
      title: () => this.title,
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
