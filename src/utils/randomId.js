// not using the short-id npm package because it
// insists on creating 64 unique characters
// which means that it MUST contain special characters
// and this would likely be invalid for some resource names
module.exports = () =>
  Math.random()
    .toString(36)
    .substring(6)
