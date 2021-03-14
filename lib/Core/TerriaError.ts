"use strict";

import i18next from "i18next";

export interface TerriaErrorOptions {
  /**  A detailed message describing the error.  This message may be HTML and it should be sanitized before display to the user. */
  message: string;
  /** A short title describing the error. */
  title?: string;
  /** The object that raised the error. */
  sender?: unknown;
  /** True if the user has seen this error; otherwise, false. */
  raisedToUser?: boolean;
}

/**
 * Represents an error that occurred in a TerriaJS module, especially an asynchronous one that cannot be raised
 * by throwing an exception because no one would be able to catch it.
 */
export default class TerriaError implements TerriaErrorOptions {
  readonly sender: unknown;
  readonly message: string;
  readonly title: string;
  raisedToUser: boolean = false;

  constructor(options: TerriaErrorOptions) {
    this.message = options.message;
    this.title = options.title ?? i18next.t("core.terriaError.defaultValue");
    this.sender = options.sender;
    this.raisedToUser = options.raisedToUser ?? false;
  }
}
