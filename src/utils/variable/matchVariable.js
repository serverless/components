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
  let expression
  let match
  let exact
  if (result) {
    expression = result[1]
    match = result[0]
    exact = result.input === result[0]
  }
  return {
    expression,
    match,
    exact
  }
}

export default matchVariable
