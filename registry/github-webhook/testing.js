const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const R = require('ramda')
const util = require('util')

const fileContents = fs.readFileSync(path.join(__dirname, 'serverless.yml'), 'utf-8')

let doc

try {
  doc = yaml.safeLoad(fileContents)
  console.log(doc)
} catch (e) {
  console.log(e)
}

if (!doc) {
  console.log('Yaml messed up')
}

const inputs = {
  token: 'hi',
  owner: 'what',
  repo: 'yo',
  url: 'wwoxowow',
  event: ['push']
}

const context = {
  state: {
    token: 'hi',
    owner: 'what',
    repo: 'yo',
    url: 'wwoowow',
    event: ['push']
  }
}

/*
const noChanges = (
  inputs.token === context.state.token &&
  inputs.owner === context.state.owner &&
  inputs.repo === context.state.repo &&
  inputs.url === context.state.url &&
  inputs.event === context.state.event
)
 */

const compareInputsToState = function (inputs, state) {
  const initialData = {
    isEqual: true,
    keys: [],
    diffs: {}
  }
  return Object.keys(inputs).reduce((acc, current) => {
    // if values not deep equal. There are changes
    if (!R.equals(inputs[current], state[current])) {
      return {
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

if (doc.inputTypes) {
  const hasChangex = compareInputsToState(inputs, context.state)

  // alternative shortcut
  console.log(util.inspect(hasChangex, false, null))
  //console.log('compareInputsToState', hasChangex)
}
