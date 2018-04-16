const getRootPath = require('./getRootPath')

describe('#getRootPath()', () => {
  const stateFile = {
    'function-mock': {
      type: 'function-mock',
      rootPath: 'registry-path/mocks/function-mock'
    },
    'iam-mock': {
      type: 'iam-mock',
      rootPath: 'registry-path/mocks/iam-mock'
    }
  }

  it('should return the components root path if present', () => {
    const res = getRootPath(stateFile, 'function-mock')
    expect(res).toEqual('registry-path/mocks/function-mock')
  })

  it('should return null if no root path information is present', () => {
    const res = getRootPath(stateFile, 'non-present-mock')
    expect(res).toEqual(null)
  })
})
