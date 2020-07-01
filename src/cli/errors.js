'use strict';

class CLIError extends Error {
  constructor(message) {
    super(message);
    this.hideStackTrace = true;
  }
}

module.exports = {
  CLIError,
};
