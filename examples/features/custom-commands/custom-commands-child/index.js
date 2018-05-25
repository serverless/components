const create = (inputs, context) => {
  context.log('creating')
}

const update = (inputs, context) => {
  context.log('updating')
}

const Delete = (inputs, context) => {
  context.log('deleting')
}

const customYml = (inputs, state, options) => { // eslint-disable-line
  console.log('running custom command from yml file') // eslint-disable-line
}

const commands = {
  custom: {
    command: 'custom',
    description: 'Get info about github webhook',
    handler: async (inputs, state, options) => { // eslint-disable-line
      console.log('running custom') // eslint-disable-line
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
  create,
  update,
  delete: Delete,
  commands,
  customYml
}
