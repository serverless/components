const buildImage = require('./buildImage')
const checkDockerSetup = require('./checkDockerSetup')
const deleteImage = require('./deleteImage')
const getToken = require('./getToken')
const isDockerInstalled = require('./isDockerInstalled')
const isDockerRunning = require('./isDockerRunning')
const login = require('./login')
const logout = require('./logout')
const pushImage = require('./pushImage')
const removeImage = require('./removeImage')

module.exports = {
  buildImage,
  checkDockerSetup,
  deleteImage,
  getToken,
  isDockerInstalled,
  isDockerRunning,
  login,
  logout,
  pushImage,
  removeImage
}
