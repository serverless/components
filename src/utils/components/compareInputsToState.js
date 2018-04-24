const R = require('ramda')

/**
 * @typedef {Object} ComparedStateData
 * @property {boolean} hasState - If component instant has previous state data.
 * @property {boolean} isEqual - State & Input data are equal
 * @property {array} keys - input keys that are different
 * @property {array} diffs - If state & inputs not equal, diffs of values will be here
 */

/**
 * Utility method for determining if inputs have changed from context.state
 * @param  {Object} inputs - input values from serverless.yml
 * @param  {Object} state - current state from context
 * @return {ComparedStateData} returns true if inputs have changed from last deployment
 */
module.exports = function compareInputsToState(inputs, state) {
  const hasState = !!Object.keys(state).length // coerce number to boolean
  const initialData = {
    // If no state keys... no state
    hasState,
    // default everything is equal. Zen
    isEqual: true,
    // keys of state that are different
    keys: [],
    // if differences, diffs values of inputs vs state
    diffs: {}
  }
  return Object.keys(inputs).reduce((acc, current) => {
    // if values not deep equal. There are changes
    if (!R.equals(inputs[current], state[current])) {
      return {
        hasState,
        isEqual: false,
        keys: acc.keys.concat(current),
        diffs: {
          ...acc.diffs,
          ...{
            [`${current}`]: {
              inputs: inputs[current],
              state: state[current]
            }
          }
        }
      }
    }
    return acc
  }, initialData)
}
