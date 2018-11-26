import path from 'path'
import { createContext } from '../../../src/utils'

describe('EnvironmentBasedConfiguration', () => {
  it('should return the specified values', async () => {
    const context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    const EnvironmentBasedConfiguration = await context.import('./')

    process.env.TEST_VARIABLE_FOO = 'foo value'
    process.env.TEST_VARIABLE_BAR = 'bar value'
    process.env.TEST_VARIABLE_BAZ = 'baz value'
    const instance = await context.construct(EnvironmentBasedConfiguration, {
      variables: ['TEST_VARIABLE_FOO', 'TEST_VARIABLE_BAR']
    })

    expect(instance.values).toEqual({
      TEST_VARIABLE_FOO: 'foo value',
      TEST_VARIABLE_BAR: 'bar value'
    })
  })
})
