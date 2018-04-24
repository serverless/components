const concordance = require('concordance')
const { concordanceOptions, concordanceDiffOptions } = require('./options')

function formatDescriptorDiff(actualDescriptor, expectedDescriptor, options) {
  const diffOptions = Object.assign({}, options, concordanceDiffOptions)
  return concordance.diffDescriptors(actualDescriptor, expectedDescriptor, diffOptions)
}

module.exports = function diffValues(actual, expected) {
  const result = concordance.compare(actual, expected, concordanceOptions)
  if (result.pass) {
    return null
  }
  const actualDescriptor = result.actual || concordance.describe(actual, concordanceOptions)
  const expectedDescriptor = result.expected || concordance.describe(expected, concordanceOptions)

  return formatDescriptorDiff(actualDescriptor, expectedDescriptor)
}
