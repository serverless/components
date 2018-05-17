const getDependencies = require('./getDependencies')

/* eslint-disable no-template-curly-in-string */

describe('#getDependencies()', () => {
  const inputs = {
    name: 'my-function',
    role: '${some-service:lambdaRole.id}',
    memorySize: 512,
    timeout: 60,
    environment: {
      isMock: true,
      variables: {
        productsTable: '${some-service:productsTable.name}'
      }
    }
  }

  it('should return the component dependencies listed in inputs', () => {
    const res = getDependencies(inputs)

    expect(res).toEqual(['some-service:lambdaRole', 'some-service:productsTable'])
  })
})
