import { regex } from './regexVariable'

/**
 * Accepts a string and attempts to find a variable string match
 *
 * @param {string} string The string to match
 * @returns {{
 *   expression: string, // the matching variable expression
 *   exact: boolean // whether or not this match was exact
 * }}
 */
const matchVariable = (string) => {
  const result = string.match(regex)
  if (!result) {
    return result
  }
  return {
    expression: result[1],
    exact: result.input === result[0]
  }
}

export default matchVariable
