const { equals } = require('ramda')

function compareInputsToState(inputs, state) {
  const hasState = !!Object.keys(state).length
  const initialData = {
    // If no state keys... no state
    hasState: hasState,
    // default everything is equal
    isEqual: true,
    // Keys that are different
    keys: [],
    // Values of the keys that are different
    diffs: {}
  }
  return Object.keys(inputs).reduce((acc, current) => {
    // if values not deep equal. There are changes
    if (!equals(inputs[current], state[current])) {
      return {
        hasState: hasState,
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

module.exports = compareInputsToState
