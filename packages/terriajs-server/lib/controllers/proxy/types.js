/**
 * @typedef {Record<string, Array<{regexPattern: string, params: Record<string, string>}>>} AppendParamToQueryString
 */

/**
 * @typedef {object} AuthStrategy
 * @property {'user' | 'proxy' | 'none'} type
 * @property {string} [authorization]
 * @property {Array<{name: string, value: string | string[] | undefined}>} [headers]
 */

export {};
