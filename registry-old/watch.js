/* eslint-disable no-console */
/* eslint-disable-next-line */
'use strict'

const BbPromise = require('bluebird')
const buildComponents = require('./buildComponents')
;(() => {
  return BbPromise.resolve().then(() => buildComponents(true, 0))
})()
