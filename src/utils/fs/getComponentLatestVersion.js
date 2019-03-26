const semverRegex = require('semver-regex')
const semverSort = require('semver-sort')
const axios = require('axios')

const getComponentLatestVersion = async (owner, repo) => {
  const url = `https://api.github.com/repos/${owner}/${repo}/git/refs/tags`
  const res = await axios(url)

  const versionsList = res.data
    .map((tagObj) => tagObj.ref.replace('refs/tags/', ''))
    .filter((version) => semverRegex().test(version)) // todo what if it's v1.0.0 rather than 1.0.0

  const latestVersion = semverSort.desc(versionsList)[0]
  return latestVersion
}

module.exports = getComponentLatestVersion
