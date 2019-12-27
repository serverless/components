import React, { Component } from 'react'
import lib from './lib'
import imageHero from './images/hero.png'

export default class App extends Component {
  constructor(props) {
    super(props)
    this.state = {}
    this.state.loading = false
    this.state.votes = null

    this.saveVote = this.saveVote.bind(this)
  }

  /**
   * Component Did Mount
   */

  async componentDidMount() {
    const self = this
    await self.getVotes()
  }

  /**
   * Get Votes
   */

  async getVotes() {
    const self = this
    if (self.timer) clearInterval(self.timer)
    const votes = await lib.getVotes()
    self.setState({ votes: votes.votes || 0 }, () => {
      self.timer = setInterval(async () => {
        await self.getVotes()
      }, 3000)
    })
  }

  /**
   * Save Vote
   */

  async saveVote() {
    const self = this
    this.setState({ votes: this.state.votes + 1 }, async () => {
      await lib.saveVote()
    })
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
              this.saveVote()
            }}
          >
            <div className={`buttonInner`}>
              <div className={`buttonLeft`}>ß</div>
              <div className="buttonRight">{this.state.votes}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
