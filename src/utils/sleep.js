const { curry } = require('ramda')

const sleep = curry(async (wait) => new Promise((resolve) => setTimeout(() => resolve(), wait)))

module.exports = sleep
