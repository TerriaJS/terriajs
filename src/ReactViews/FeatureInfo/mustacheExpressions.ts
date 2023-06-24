import dateFormat from "dateformat";
import Mustache from "mustache";
import isDefined from "../../Core/isDefined";
import { isJsonString, JsonObject } from "../../Core/Json";

export type MustacheFunction = () => (
  text: string,
  render: (value: string) => string
) => string;

/**
 * Returns a function which extracts JSON elements from the content of a Mustache section template and calls the
 * supplied customProcessing function with the extracted JSON options, example syntax processed:
 * {optionKey: optionValue}{{value}}
 * @private
 */
function mustacheJsonSubOptions(
  customProcessing: (value: string, options?: JsonObject) => string
) {
  return function (text: string, render: (input: string) => string) {
    // Eg. "{foo:1}hi there".match(optionReg) = ["{foo:1}hi there", "{foo:1}", "hi there"].
    // Note this won't work with nested objects in the options (but these aren't used yet).
    // Note I use [\s\S]* instead of .* at the end - .* does not match newlines, [\s\S]* does.
    const optionReg = /^(\{[^}]+\})([\s\S]*)/;
    const components = text.match(optionReg);
    // This regex unfortunately matches double-braced text like {{number}}, so detect that separately and do not treat it as option json.
    const startsWithdoubleBraces =
      text.length > 4 && text[0] === "{" && text[1] === "{";
    if (!components || startsWithdoubleBraces) {
      // If no options were provided, just use the defaults.
      return customProcessing(render(text));
    }
    // Allow {foo: 1} by converting it to {"foo": 1} for JSON.parse.
    const quoteReg = /([{,])(\s*)([A-Za-z0-9_\-]+?)\s*:/g;
    const jsonOptions = components[1].replace(quoteReg, '$1"$3":');
    const options = JSON.parse(jsonOptions);
    return customProcessing(render(components[2]), options);
  };
}

/**
 * Returns a function which implements number formatting in Mustache templates, using this syntax:
 * {{#terria.formatNumber}}{useGrouping: true}{{value}}{{/terria.formatNumber}}
 * @private
 */
export function mustacheFormatNumberFunction(): (
  text: string,
  render: (value: string) => string
) => string {
  return mustacheJsonSubOptions(
    (value: string, options?: Intl.NumberFormatOptions) => {
      const number = parseFloat(value);
      if (Number.isNaN(number)) return value;
      return parseFloat(value).toLocaleString(undefined, {
        useGrouping: false,
        maximumFractionDigits: 20,
        ...options
      });
    }
  );
}

/**
 * Returns a function that replaces value in Mustache templates, using this syntax:
 * {
 *   "template": {{#terria.partialByName}}{{value}}{{/terria.partialByName}}.
 *   "partials": {
 *     "value1": "replacement1",
 *     ...
 *   }
 * }
 *
 * E.g. {{#terria.partialByName}}{{value}}{{/terria.partialByName}}
     "featureInfoTemplate": {
        "template": "{{Pixel Value}} dwellings in {{#terria.partialByName}}{{feature.data.layerId}}{{/terria.partialByName}} radius.",
        "partials": {
          "0": "100m",
          "1": "500m",
          "2": "1km",
          "3": "2km"
        }
      }
 * @private
 */
export function mustacheRenderPartialByName(
  partials: Record<string, string>,
  templateData: Object
): MustacheFunction {
  return () => {
    return mustacheJsonSubOptions((value, options) => {
      if (!isJsonString(value)) return `${value}`;
      if (partials && typeof partials[value] === "string") {
        return Mustache.render(partials[value], templateData);
      } else {
        return Mustache.render(value, templateData);
      }
    });
  };
}

/**
 * Formats the date according to the date format string.
 * If the date expression can't be parsed using Date.parse() it will be returned unmodified.
 *
 * @param {String} text The date to format.
 * @param {Object} options Object with the following properties:
 * @param {String} options.format If present, will override the default date format using the npm datefromat package
 *                                format (see https://www.npmjs.com/package/dateformat). E.g. "isoDateTime"
 *                                or "dd-mm-yyyy HH:MM:ss". If not supplied isoDateTime will be used.
 * @private
 */
export function formatDateTime(text: string, options?: { format?: string }) {
  const date = Date.parse(text);

  if (!isDefined(date) || isNaN(date)) {
    return text;
  }

  if (isDefined(options) && isDefined(options.format)) {
    return dateFormat(date, options.format);
  }

  return dateFormat(date, "isoDateTime");
}

/**
 * Returns a function which implements date/time formatting in Mustache templates, using this syntax:
 * {{#terria.formatDateTime}}{format: "npm dateFormat string"}DateExpression{{/terria.formatDateTime}}
 * format If present, will override the default date format (see https://www.npmjs.com/package/dateformat)
 * Eg. "isoDateTime" or "dd-mm-yyyy HH:MM:ss".
 * If the Date_Expression can't be parsed using Date.parse() it will be used(returned) unmodified by the terria.formatDateTime section expression.
 * If no valid date formatting options are present in the terria.formatDateTime section isoDateTime will be used.
 * @private
 */
export function mustacheFormatDateTime() {
  return mustacheJsonSubOptions(formatDateTime);
}

/**
 * URL Encodes provided text: {{#terria.urlEncodeComponent}}{{value}}{{/terria.urlEncodeComponent}}.
 * See encodeURIComponent for details.
 *
 * {{#terria.urlEncodeComponent}}W/HO:E#1{{/terria.urlEncodeComponent}} -> W%2FHO%3AE%231
 * @private
 */
export function mustacheURLEncodeTextComponent() {
  return function (text: string, render: (value: string) => string) {
    return encodeURIComponent(render(text));
  };
}

/**
 * URL Encodes provided text: {{#terria.urlEncode}}{{value}}{{/terria.urlEncode}}.
 * See encodeURI for details.
 *
 * {{#terria.urlEncode}}http://example.com/a b{{/terria.urlEncode}} -> http://example.com/a%20b
 * @private
 */
export function mustacheURLEncodeText() {
  return function (text: string, render: (value: string) => string) {
    return encodeURI(render(text));
  };
}
