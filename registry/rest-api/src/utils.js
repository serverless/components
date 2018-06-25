const { isEmpty, prepend, reduce } = require('ramda')

// "private" functions
function removeSlashes(str) {
  let res = str
  res = res.replace(/^\//, '')
  res = res.replace(/\/$/, '')
  return res
}

// "public" functions
function joinUrl(base, ...parts) {
  parts = prepend(base, ...parts)

  return reduce(
    (accum, part) => {
      const normalizedPart = removeSlashes(part)
      if (isEmpty(accum)) {
        return normalizedPart
      }
      return `${accum}/${normalizedPart}`
    },
    '',
    parts
  )
}

module.exports = {
  joinUrl
}
