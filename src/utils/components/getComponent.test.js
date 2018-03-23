const path = require('path')
const getComponent = require('./getComponent')

describe('#getComponent()', () => {
  describe('inputType string', () => {
    it('Test setting all string types', async () => {
      const instance = await getComponent(
        path.resolve(__dirname, '../../../registry/tests-input-type-string'),
        'test',
        {
          stringTypeRequired: 'foo',
          stringTypeNotRequired: 'bar',
          stringTypeWithDefault: 'baz'
        },
        {
          serviceId: 'AsH3gefdfDSY',
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
        path.resolve(__dirname, '../../../registry/tests-input-type-string'),
        'test',
        {
          stringTypeRequired: 'foo',
          stringTypeNotRequired: 'bar'
        },
        {
          serviceId: 'AsH3gefdfDSY',
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
      let error
      try {
        await getComponent(
          path.resolve(__dirname, '../../../registry/tests-input-type-string'),
          'test',
          {
            stringTypeNotRequired: 'bar',
            stringTypeWithDefault: 'baz'
          },
          {
            serviceId: 'AsH3gefdfDSY',
            'my-component': {
              type: 'aws-function',
              internallyManaged: false,
              instanceId: 'AsH3gefdfDSY-cHA9jPi5lPQj',
              state: {}
            }
          }
        )
      } catch (err) {
        error = err
      }
      expect(error).toMatchObject({
        message: expect.stringMatching(/Type error in component/)
      })
    })

    it('Test invalid default for string type', async () => {
      let error
      try {
        await getComponent(
          path.resolve(__dirname, '../../../registry/tests-input-type-string-invalid-default'),
          'test',
          {},
          {
            serviceId: 'AsH3gefdfDSY',
            'my-component': {
              type: 'aws-function',
              internallyManaged: false,
              instanceId: 'AsH3gefdfDSY-cHA9jPi5lPQj',
              state: {}
            }
          }
        )
      } catch (err) {
        error = err
      }
      expect(error).toMatchObject({
        message: expect.stringMatching(/Type error in component/)
      })
    })
  })
})
