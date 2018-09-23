// https://github.com/serverless/utils/pull/7

const sleep = (time) => new Promise((resolve) => setTimeout(() => resolve(), time))

module.exports = sleep
