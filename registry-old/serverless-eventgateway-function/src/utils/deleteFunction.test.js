const deleteFunction = require('./deleteFunction')

const mockDeleteFunction = jest.fn()

jest.mock('@serverless/event-gateway-sdk', () =>
  jest.fn().mockImplementation(() => ({
    deleteFunction: mockDeleteFunction
  }))
)

describe('#deleteFunction()', () => {
  it('should delete a function registration from the Event Gateway', async () => {
    const inputs = {
      url: 'http://localhost',
      space: 'my-space',
      accessKey: 's0m34cc355k3y',
      functionId: 'myFunction',
      functionType: 'awslambda',
      provider: { arn: 'arn:aws:lambda:us-east-1:12345:function:my-function', region: 'us-east-1' }
    }

    const res = await deleteFunction(inputs)

    const { functionId } = inputs
    expect(mockDeleteFunction).toBeCalledWith({ functionId })
    expect(res).toEqual(true)
  })
})
