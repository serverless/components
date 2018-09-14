const sleep = (time) => new Promise((resolve) => setTimeout(() => resolve(), time))

module.exports = sleep
