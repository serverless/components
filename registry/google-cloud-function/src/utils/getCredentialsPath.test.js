const path = require('path')
const os = require('os')
const getCredentialsPath = require('./getCredentialsPath')

describe('#getCredentialsPath()', () => {
  it('should return the credentials for an absolute path', () => {
    const keyFilePath = path.join(path.sep, 'foo', 'bar', 'baz')
    const res = getCredentialsPath(keyFilePath)

    const expectedRes = path.join(path.sep, 'foo', 'bar', 'baz')
    expect(res).toEqual(expectedRes)
  })

  it('should return the credentials for a relative path', () => {
    const keyFilePath = path.join('..', 'foo', 'bar', 'baz')
    const res = getCredentialsPath(keyFilePath)

    const expectedRes = path.join('..', 'foo', 'bar', 'baz')
    expect(res).toEqual(expectedRes)
  })

  it('should expand the tilde to the home directory', () => {
    const keyFilePath = path.join('~', 'foo', 'bar', 'baz')
    const res = getCredentialsPath(keyFilePath)

    const expectedRes = path.join(os.homedir(), 'foo', 'bar', 'baz')

    expect(res).toEqual(expectedRes)
  })
})
