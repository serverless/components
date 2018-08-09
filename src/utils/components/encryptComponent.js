const jsyaml = require('js-yaml')
const { decryptString } = require('../encryption')

const EncryptedYamlType = new jsyaml.Type('!encrypted', {
  kind: 'scalar',
  construct: (data) => {
    return decryptString(data)
  }
})

module.exports = {
  schema: jsyaml.Schema.create([EncryptedYamlType])
}
