'use strict';

const { ONE_SECOND } = require('./constants');

async function sleep(seconds) {
  setTimeout(() => {
    Promise.resolve(true);
  }, seconds * ONE_SECOND);
}

module.exports = {
  sleep,
};
