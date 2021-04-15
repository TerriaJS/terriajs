"use strict";

import i18next from "i18next";
import { Notification } from "../ReactViewModels/ViewState";
import { terriaErrorNotification } from "../ReactViews/Notification/terriaErrorNotification";

export interface I18nTranslateString {
  key: string;
  parameters?: Record<string, string>;
}

function resolveI18n(i: I18nTranslateString | string) {
  return typeof i === "string" ? i : i18next.t(i.key, i.parameters);
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

  originalError?: TerriaError | Error;

  useTerriaErrorNotification?: boolean;
}

/**
 * Represents an error that occurred in a TerriaJS module, especially an asynchronous one that cannot be raised
 * by throwing an exception because no one would be able to catch it.
 */
export default class TerriaError {
  readonly sender: unknown;
  private readonly _message: string | I18nTranslateString;
  private readonly _title: string | I18nTranslateString;
  private readonly originalError?: TerriaError | Error;

  private readonly useTerriaErrorNotification: boolean;

  private _raisedToUser: boolean = false;

  static from(
    error: unknown,
    overrides?: Partial<TerriaErrorOptions>
  ): TerriaError {
    if (error instanceof TerriaError) {
      return error.clone(overrides);
    }
    return new TerriaError({
      title: i18next.t("models.raiseError.errorTitle"),
      message:
        typeof error === "string"
          ? (error as string)
          : (error instanceof Error
              ? error.message
              : typeof error === "object"
              ? error?.toString()
              : undefined) ?? "Unknown error",
      originalError: error instanceof Error ? error : undefined
    });
  }

  constructor(options: TerriaErrorOptions) {
    this._message = options.message;
    this._title = options.title ?? { key: "core.terriaError.defaultValue" };
    this.sender = options.sender;
    this._raisedToUser = options.raisedToUser ?? false;
    this.originalError = options.originalError;
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

  get stackTrace(): string | undefined {
    return this.originalError instanceof TerriaError
      ? this.originalError.stackTrace
      : this.originalError instanceof Error
      ? this.originalError.stack
      : undefined;
  }

  toNotification(): Notification {
    return {
      title: () => this.title,
      message: this.useTerriaErrorNotification
        ? terriaErrorNotification(this)
        : () => this.message
    };
  }

  clone(overrides?: Partial<TerriaErrorOptions>): TerriaError {
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
