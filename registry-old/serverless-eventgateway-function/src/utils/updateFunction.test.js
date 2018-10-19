const updateFunction = require('./updateFunction')

const mockUpdateFunction = jest.fn().mockResolvedValue({
  space: 'my-space',
  functionId: 'myFunction',
  provider: {
    arn: 'arn:aws:lambda:us-east-1:12345:function:my-function',
    region: 'us-east-1'
  },
  metadata: {}
})

jest.mock('@serverless/event-gateway-sdk', () =>
  jest.fn().mockImplementation(() => ({
    updateFunction: mockUpdateFunction
  }))
)

describe('#updateFunction()', () => {
  it('should update the function registered at the Event Gateway', async () => {
    const inputs = {
      url: 'http://localhost',
      space: 'my-space',
      accessKey: 's0m34cc355k3y',
      functionId: 'myFunction',
      functionType: 'awslambda',
      provider: { arn: 'arn:aws:lambda:us-east-1:12345:function:my-function', region: 'us-east-1' }
    }

    const res = await updateFunction(inputs)

    const { functionId, functionType, provider } = inputs
    expect(mockUpdateFunction).toBeCalledWith({ functionId, type: functionType, provider })
    expect(res).toEqual({
      space: 'my-space',
      functionId: 'myFunction',
      provider: {
        arn: 'arn:aws:lambda:us-east-1:12345:function:my-function',
        region: 'us-east-1'
      },
      metadata: {}
    })
  })
})
