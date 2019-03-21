const { ensureDir } = require('fs-extra')
const download = require('download-git-repo')

const downloadGitRepo = async (url, path) => {
  await ensureDir(path)
  return new Promise((resolve, reject) => {
    download(`github:${url}`, path, { clone: false }, (err) => {
      if (err) {
        return reject(err)
      }
      return resolve(path)
    })
  })
}

module.exports = downloadGitRepo
