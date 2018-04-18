const { join } = require('path')
const getTmpDir = require('../fs/getTmpDir')
const getRootPath = require('./getRootPath')

describe('#getRootPath()', () => {
  let oldCwd
  let tmpDirPath
  const stateFile = {
    'function-mock': {
      type: 'function-mock',
      rootPath: join('registry-path', 'mocks', 'function-mock')
    },
    'iam-mock': {
      type: 'iam-mock',
      rootPath: join('registry-path', 'mocks', 'iam-mock')
    }
  }

  beforeEach(async () => {
    tmpDirPath = await getTmpDir()
    oldCwd = process.cwd()
    process.chdir(tmpDirPath)
  })

  afterEach(() => {
    process.chdir(oldCwd)
  })

  it('should return the components resolved root path if present', () => {
    const res = getRootPath(stateFile, 'function-mock')
    const expected = join(tmpDirPath, 'registry-path', 'mocks', 'function-mock')
    expect(res).toEqual(expected)
  })

  it('should return null if no root path information is present', () => {
    const res = getRootPath(stateFile, 'non-present-mock')
    expect(res).toEqual(null)
  })
})
