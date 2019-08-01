import React, { Component } from 'react'
import imageHero from './images/hero.png'

export default class App extends Component {

  constructor(props) {
    super(props)
    this.state = {}
  }

  /**
   * Component Did Mount
   */

  async componentDidMount() {}

  /**
   * Render
   */

  render() {

    return (
      <div className='container'>
        <div className='hero'>
          <img src={imageHero}/>
        </div>

        <div className='tagline'>
          a website built on serverless components via the serverless framework
        </div>
      </div>
    )
  }
}
