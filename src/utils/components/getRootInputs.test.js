const getRootInputs = require('./getRootInputs')

jest.mock('../components/getComponent', () =>
  jest.fn().mockImplementation((componentRoot, componentId, inputs, stateFile, slsYml) => {
    if (slsYml === null) {
      return {
        inputs: {
          some: 'file'
        }
      }
    }
    return slsYml
  })
)

describe('#getRootInputs()', () => {
  it('should return root inputs object loaded from serverless.yml', async () => {
    const res = await getRootInputs('.')
    expect(res).toEqual({ some: 'file' })
  })

  it('should return root inputs object from object passed as argument', async () => {
    const res = await getRootInputs('.', { inputs: { some: 'passed' } })
    expect(res).toEqual({ some: 'passed' })
  })
})
