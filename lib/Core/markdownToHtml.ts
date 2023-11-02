"use strict";

var defined = require("terriajs-cesium/Source/Core/defined").default;
var MarkdownIt = require("markdown-it");
var DOMPurify = require("dompurify/dist/purify");
import injectTerms from "./injectTerms";
import { Term } from "../ReactViewModels/defaultTerms";

var md = new MarkdownIt({
  html: true,
  linkify: true
});

var htmlRegex = /^\s*<[^>]+>/;

export interface MarkdownOptions {
  // requires tooltipTerms as well
  injectTermsAsTooltips?: boolean;

  // requires injectTermsAsTooltips as well
  tooltipTerms?: Term[];

  /** Single line rendering, without paragraph wrap */
  inline?: boolean;
}

/**
 * Convert a String in markdown format (which includes html) into html format.
 * @param  {String} markdownString String in markdown format.
 * @param  {Boolean} allowUnsafeHtml Pass true to allow unsafe html. Defaults to false.
 * @param  {Object} [domPurifyOptions] Options to pass to DOMPurify, eg. {ADD_TAGS: ['ying', 'yang']} (https://github.com/cure53/DOMPurify).
 * @param  {Object} [markdownOptions] Options for markdown parsing
 * @return {String} HTML-formatted string.
 */
function markdownToHtml(
  markdownString: string,
  allowUnsafeHtml: boolean = false,
  domPurifyOptions: Object = {},
  markdownOptions: MarkdownOptions = {}
) {
  if (!defined(markdownString) || markdownString.length === 0) {
    return markdownString;
  }
  // If the text looks like html, don't try to interpret it as Markdown because
  // we'll probably break it in the process.
  // It would wrap non-standard tags such as <collapsible>hi</collapsible> in a <p></p>, which is bad.
  var unsafeHtml: string;
  if (htmlRegex.test(markdownString)) {
    unsafeHtml = markdownString;
  } else {
    let stringToParse = markdownString;
    // MarkdownIt can't handle something that is not a string primitve.  It can't even handle
    // something that is a string object (instanceof String) rather a string primitive
    // (typeof string === 'string').  So if this isn't a string primitive, call toString
    // on it in order to make it one.
    if (markdownString && typeof markdownString !== "string") {
      stringToParse = (<any>markdownString).toString();
    }
    if (markdownOptions.injectTermsAsTooltips && markdownOptions.tooltipTerms) {
      stringToParse = injectTerms(stringToParse, markdownOptions.tooltipTerms);
    }

    unsafeHtml = markdownOptions.inline
      ? md.renderInline(stringToParse)
      : md.render(stringToParse);
  }
  if (allowUnsafeHtml) {
    return unsafeHtml;
  } else {
    return DOMPurify.sanitize(unsafeHtml, domPurifyOptions);
  }
}

export default markdownToHtml;
