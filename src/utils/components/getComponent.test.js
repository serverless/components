const path = require('path')
const getComponent = require('./getComponent')
const getRegistryRoot = require('../registry/getRegistryRoot')

describe('#getComponent()', () => {
  const registryPath = getRegistryRoot()

  describe('inputType string', () => {
    const inputTypeStringComponentPath = path.join(registryPath, 'tests-input-type-string')
    const inputTypeStringInvalidDefaultComponentPath = path.join(
      registryPath,
      'tests-input-type-string-invalid-default'
    )

    it('Test setting all string types', async () => {
      const instance = await getComponent(
        inputTypeStringComponentPath,
        'test',
        {
          stringTypeRequired: 'foo',
          stringTypeNotRequired: 'bar',
          stringTypeWithDefault: 'baz'
        },
        {
          $: { serviceId: 'AsH3gefdfDSY' },
          'my-component': {
            type: 'aws-function',
            internallyManaged: false,
            instanceId: 'AsH3gefdfDSY-cHA9jPi5lPQj',
            state: {}
          }
        }
      )

      expect(instance.inputs).toEqual({
        stringTypeRequired: 'foo',
        stringTypeNotRequired: 'bar',
        stringTypeWithDefault: 'baz'
      })
    })

    it('Test default string types', async () => {
      const instance = await getComponent(
        inputTypeStringComponentPath,
        'test',
        {
          stringTypeRequired: 'foo',
          stringTypeNotRequired: 'bar'
        },
        {
          $: { serviceId: 'AsH3gefdfDSY' },
          'my-component': {
            type: 'aws-function',
            internallyManaged: false,
            instanceId: 'AsH3gefdfDSY-cHA9jPi5lPQj',
            state: {}
          }
        }
      )

      expect(instance.inputs).toEqual({
        stringTypeRequired: 'foo',
        stringTypeNotRequired: 'bar',
        stringTypeWithDefault: 'baz'
      })
    })

    it('Test required with no default throws', async () => {
      await expect(
        getComponent(
          inputTypeStringComponentPath,
          'test',
          {
            stringTypeNotRequired: 'bar',
            stringTypeWithDefault: 'baz'
          },
          {
            $: { serviceId: 'AsH3gefdfDSY' },
            'my-component': {
              type: 'aws-function',
              internallyManaged: false,
              instanceId: 'AsH3gefdfDSY-cHA9jPi5lPQj',
              state: {}
            }
          }
        )
      ).rejects.toThrow('Type error(s) in component')
    })

    it('Test invalid default for string type', async () => {
      await expect(
        getComponent(
          inputTypeStringInvalidDefaultComponentPath,
          'test',
          {},
          {
            $: { serviceId: 'AsH3gefdfDSY' },
            'my-component': {
              type: 'aws-function',
              internallyManaged: false,
              instanceId: 'AsH3gefdfDSY-cHA9jPi5lPQj',
              state: {}
            }
          }
        )
      ).rejects.toThrow('Type error(s) in component')
    })
  })

  it('Test invalid variables usage', async () => {
    const invalidVariablesUsageComponentPath = path.join(
      registryPath,
      'tests-invalid-variables-usage'
    )

    await expect(
      getComponent(
        invalidVariablesUsageComponentPath,
        'test',
        {},
        {
          $: { serviceId: 'AsH3gefdfDSY' },
          'my-component': {
            type: 'aws-function',
            internallyManaged: false,
            instanceId: 'AsH3gefdfDSY-cHA9jPi5lPQj',
            state: {}
          }
        }
      )
    ).rejects.toThrow('variable syntax cannot be used')
  })

  it('Test incompatible core version', async () => {
    const coreVersionCompatibilityComponentPath = path.join(
      registryPath,
      'tests-core-version-compatibility'
    )

    await expect(
      getComponent(
        coreVersionCompatibilityComponentPath,
        'test',
        {},
        {
          $: { serviceId: 'AsH3gefdfDSY' },
          'my-component': {
            type: 'aws-function',
            internallyManaged: false,
            instanceId: 'AsH3gefdfDSY-cHA9jPi5lPQj',
            state: {}
          }
        }
      )
    ).rejects.toThrow('core is incompatible with component my-project')
  })

  it('Test passed-in serverless.yml component object', async () => {
    const myComponent = {
      type: 'my-component',
      version: '0.1.0',
      inputTypes: {
        foo: {
          type: 'string',
          required: true
        },
        bar: {
          type: 'string',
          required: false
        }
      }
    }

    const instance = await getComponent(
      process.cwd(),
      'test',
      {
        foo: 'bar',
        baz: 'qux'
      },
      {
        $: { serviceId: 'AsH3gefdfDSY' },
        'my-component': {
          type: 'my-component',
          internallyManaged: false,
          instanceId: 'AsH3gefdfDSY-cHA9jPi5lPQj',
          state: {}
        }
      },
      myComponent
    )

    expect(instance.type).toEqual('my-component')
    expect(instance.version).toEqual('0.1.0')
    expect(instance.inputs).toEqual({
      foo: 'bar',
      baz: 'qux'
    })
  })
})
