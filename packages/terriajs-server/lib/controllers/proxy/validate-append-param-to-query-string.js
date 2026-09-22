import safeRegex from "safe-regex2";

/**
 * Validates the admin-supplied `appendParamToQueryString` configuration once at
 * startup. Each `regexPattern` is checked for syntactic validity and for
 * vulnerability to catastrophic backtracking (ReDoS), since at request time the
 * pattern is tested against the attacker-influenced proxy URL. A misconfigured
 * pattern therefore fails fast at boot rather than throwing on, or hanging, every
 * proxied request.
 *
 * @param {import('./types').AppendParamToQueryString} appendParamToQueryString
 * @throws {Error} If any pattern is syntactically invalid or ReDoS-prone.
 */
function validateAppendParamToQueryString(appendParamToQueryString = {}) {
  Object.entries(appendParamToQueryString).forEach(([host, options]) => {
    options.forEach(({ regexPattern }) => validatePattern(regexPattern, host));
  });
}

/**
 * @param {string} regexPattern
 * @param {string} host
 */
function validatePattern(regexPattern, host) {
  try {
    new RegExp(regexPattern);
  } catch (cause) {
    throw new Error(
      `Invalid regular expression in appendParamToQueryString for host "${host}": ` +
        `"${regexPattern}".`,
      { cause }
    );
  }

  if (!safeRegex(regexPattern)) {
    throw new Error(
      `Unsafe regular expression in appendParamToQueryString for host "${host}": ` +
        `"${regexPattern}" is vulnerable to catastrophic backtracking (ReDoS).`
    );
  }
}

export { validateAppendParamToQueryString };
