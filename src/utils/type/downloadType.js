import isGitUrl from './isGitUrl'
import download from 'download-git-repo'

const downloadType = async (url, path) => {
  let clone = false
  const isZipUrl = url.split('.').pop() === 'zip'
  if (isGitUrl(url) && !isZipUrl) clone = true
  return new Promise((resolve, reject) => {
    download(`direct:${url}`, path, { clone }, (err) => {
      if (err) return reject(err)
      return resolve()
    })
  })
}

export default downloadType
