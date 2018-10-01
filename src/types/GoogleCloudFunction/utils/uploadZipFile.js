const fs = require('fs')
const fetch = require('node-fetch')

async function uploadZipFile(url, filePath) {
  const result = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/zip',
      'x-goog-content-length-range': '0,104857600'
    },
    body: fs.createReadStream(filePath)
  })

  if (!result.ok) {
    throw new Error('An error occurred while uploading the .zip file...')
  }

  return result
}

module.exports = uploadZipFile
