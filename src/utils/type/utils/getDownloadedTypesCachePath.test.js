import os from 'os'
import path from 'path'
import getDownloadedTypesCachePath from './getDownloadedTypesCachePath'

describe('#getDownloadedTypesCachePath()', () => {
  it('should not be async', () => {
    // This method needs to be sync so that it can be used by requireType
    const cachePath = getDownloadedTypesCachePath()
    expect(cachePath).not.toBeInstanceOf(Promise)
  })

  it('should equal expected path', () => {
    const cachePath = getDownloadedTypesCachePath()
    expect(cachePath).toBe(path.join(os.homedir(), '.serverless', 'components', 'cache'))
  })
})
