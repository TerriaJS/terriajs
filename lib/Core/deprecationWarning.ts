import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import defined from "terriajs-cesium/Source/Core/defined";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";

/**
 * Port of Cesium's functions `deprecationWarning` and `oneTimeWarning`.
 */
const warnings: { [key: string]: boolean } = {};

/**
 * Logs a one time message to the console.  Use this function instead of
 * <code>console.log</code> directly since this does not log duplicate messages
 * unless it is called from multiple workers.
 *
 * @function oneTimeWarning
 *
 * @param {String} identifier The unique identifier for this warning.
 * @param {String} [message=identifier] The message to log to the console.
 *
 * @example
 * for(var i=0;i<foo.length;++i) {
 *    if (!defined(foo[i].bar)) {
 *       // Something that can be recovered from but may happen a lot
 *       oneTimeWarning('foo.bar undefined', 'foo.bar is undefined. Setting to 0.');
 *       foo[i].bar = 0;
 *       // ...
 *    }
 * }
 *
 * @private
 */
function oneTimeWarning(identifier: string, message: any) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(identifier)) {
    throw new DeveloperError("identifier is required.");
  }
  //>>includeEnd('debug');

  if (!defined(warnings[identifier])) {
    warnings[identifier] = true;
    console.warn(defaultValue(message, identifier));
  }
}

/**
 * Logs a deprecation message to the console.  Use this function instead of
 * <code>console.log</code> directly since this does not log duplicate messages
 * unless it is called from multiple workers.
 *
 * @function deprecationWarning
 *
 * @param {String} identifier The unique identifier for this deprecated API.
 * @param {String} message The message to log to the console.
 *
 * @example
 * // Deprecated function or class
 * function Foo() {
 *    deprecationWarning('Foo', 'Foo was deprecated in Cesium 1.01.  It will be removed in 1.03.  Use newFoo instead.');
 *    // ...
 * }
 *
 * // Deprecated function
 * Bar.prototype.func = function() {
 *    deprecationWarning('Bar.func', 'Bar.func() was deprecated in Cesium 1.01.  It will be removed in 1.03.  Use Bar.newFunc() instead.');
 *    // ...
 * };
 *
 * // Deprecated property
 * Object.defineProperties(Bar.prototype, {
 *     prop : {
 *         get : function() {
 *             deprecationWarning('Bar.prop', 'Bar.prop was deprecated in Cesium 1.01.  It will be removed in 1.03.  Use Bar.newProp instead.');
 *             // ...
 *         },
 *         set : function(value) {
 *             deprecationWarning('Bar.prop', 'Bar.prop was deprecated in Cesium 1.01.  It will be removed in 1.03.  Use Bar.newProp instead.');
 *             // ...
 *         }
 *     }
 * });
 *
 * @private
 */
function deprecationWarning(identifier: string, message: string) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(identifier) || !defined(message)) {
    throw new DeveloperError("identifier and message are required.");
  }
  //>>includeEnd('debug');

  oneTimeWarning(identifier, message);
}

export default deprecationWarning;
