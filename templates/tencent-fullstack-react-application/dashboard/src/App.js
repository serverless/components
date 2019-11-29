'use strict'

const React = require('react')
const lib = require('./lib')
const imageHero = require('./images/hero.png')

const { Component } = React

module.exports = class App extends Component {
  constructor(props) {
    super(props)
    this.state = {}
    this.getTime = this.getTime.bind(this)
  }

  /**
   * Component Did Mount
   */

  async componentDidMount() {
    return this.getTime()
  }

  /**
   * Get server time
   */

  async getTime() {
    this.setState({ serverTime: await lib.getTime() })
  }

  /**
   * Render
   */

  render() {
    return (
      <div className="container">
        <div className="hero">
          <img src={imageHero} />
        </div>

        <div className="tagline">
          a fullstack app built on serverless components via the serverless framework
        </div>

        <div className="buttonContainer">
          <div
            className={`button`}
            onClick={() => {
              this.getTime()
            }}
          >
            <div className={`buttonInner`}>
              <div className={`buttonLeft`}>ß</div>
              <div className="buttonRight">{this.state.serverTime}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
