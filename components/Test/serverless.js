/*
 * Component – Test
 */

const path = require('path')
const { Component } = require('../../src')

/*
 * Class – Test
 */

class Test extends Component {

  /*
   * Default
   */

  async default(inputs = {}) {
    this.cli.status(`Deploying`)
    console.log(this.context)
    return {}
  }
}

module.exports = Test
