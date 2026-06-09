/**
 * Replace all underscores in the string with spaces. If the argument is not a string, return it unchanged.
 * @param string The string to replace. If the argument is not a string, does nothing.
 * @return The argument with all underscores replaced with spaces. If the argument is not a string, returns the argument unchanged.
 */
function replaceUnderscores(str: any): typeof str {
  return typeof str === "string" || str instanceof String
    ? str.replace(/_/g, " ")
    : str;
}

export default replaceUnderscores;
