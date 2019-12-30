'use strict'

/** @type Egg.EggPlugin */
module.exports = {
  // had enabled by egg
  static: {
    enable: true
  },
  nunjucks: {
    enable: true,
    package: 'egg-view-nunjucks'
  }
}
