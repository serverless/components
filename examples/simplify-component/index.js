const Create = (inputs, context) => {
  console.log('creating')
}

const Update = (inputs, context) => {
  console.log('updating')
}

const Delete = (inputs, context) => {
  console.log('deleting')
}

const deploy = (inputs, context) => {
  console.log('deploying')
}

// const custom = (inputs, state, options) => {
//   console.log('deploying')
// }

const customYml = (inputs, state, options) => {
  console.log('running custom yml')
}

const commands = {
  custom: {
    command: 'custom',
    description: 'Get info about github webhook',
    handler: async (inputs, state, options) => {
      console.log('running custom')
    },
    options: {
      test: {
        description: 'Test option',
        shortcut: 't'
      }
    }
  }
}

module.exports = {
  Create,
  Update,
  Delete,
  deploy,
  commands,
  customYml
}
