// this is the "long" `id` the core uses internally
function getId(fileName) {
  return fileName
    .split('.')
    .slice(0, -1)
    .join('.')
}

module.exports = getId
