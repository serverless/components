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
          {}
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
