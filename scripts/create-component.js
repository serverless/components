/* eslint-disable no-console */
const fs = require('fs-extra')
const path = require('path')

const { version } = require('../package.json')
const name = process.argv[2]
const directory = path.join(process.cwd(), 'registry', name)

const packageJsonTemplate = {
  name: `@serverless-components/${name}`,
  version: version,
  private: true,
  main: 'dist/index.js',
  scripts: {
    test: 'echo "Error: no test specified" && exit 1'
  }
}

const serverlessYmlTemplate = `---
type: ${name}
version: ${version}
core: ${version
  .split('.')
  .slice(0, 2)
  .join('.')}.x

description: "My component description"
license: Apache-2.0
author: "Serverless, Inc. <hello@serverless.com> (https://serverless.com)"
repository: "github:serverless/components"

inputTypes:
  myInput:
    type: string
    displayName: My input
    description: My input string
    example: hello-world

outputTypes:
  myOutput:
    type: string
    description: my output string
`

const readMeTemplate = `<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
<!-- AUTO-GENERATED-CONTENT:END -->
<!-- AUTO-GENERATED-CONTENT:START (TOC) -->
<!-- AUTO-GENERATED-CONTENT:END -->
<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_INPUT_TYPES) -->
<!-- AUTO-GENERATED-CONTENT:END -->
<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
<!-- AUTO-GENERATED-CONTENT:END -->
<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
<!-- AUTO-GENERATED-CONTENT:END -->
`

const indexTemplate = `// ${name}

const deploy = async (inputs, context) => {
  return {}
}

const remove = async (inputs, context) => {
  return {}
}

module.exports = {
  deploy,
  remove
}
`

const indexTestTemplate = `// ${name}
const myComponent = require('./index')

describe('${name} Unit Tests', () => {
  it('should have tests', async () => {
    const contextMock = {
      state: {},
      log: () => {},
      saveState: jest.fn()
    }
    await myComponent.deploy({}, contextMock)
    expect(false).toBe(true)
  })
})
`

const run = async () => {
  if (await fs.exists(directory)) {
    throw new Error(`Component "${name}" already exists.`)
  }
  await fs.ensureDir(directory)
  await fs.ensureDir(path.join(directory, 'src'))
  await Promise.all([
    fs.writeJson(path.join(directory, 'package.json'), packageJsonTemplate, {
      encoding: 'utf8',
      spaces: 2
    }),
    fs.writeFile(path.join(directory, 'serverless.yml'), serverlessYmlTemplate, {
      encoding: 'utf8'
    }),
    fs.writeFile(path.join(directory, 'README.md'), readMeTemplate, {
      encoding: 'utf8'
    }),
    fs.writeFile(path.join(directory, 'src', 'index.js'), indexTemplate, {
      encoding: 'utf8'
    }),
    fs.writeFile(path.join(directory, 'src', 'index.test.js'), indexTestTemplate, {
      encoding: 'utf8'
    })
  ])
}

run().catch((error) => {
  console.error('ERROR:', error.message)
})

/* eslint-enable no-console */
