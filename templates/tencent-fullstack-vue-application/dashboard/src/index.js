'use strict'

require('../env')

const Vue = require('vue')

module.exports = new Vue({
  el: '#root',
  data: {
    message: 'Click me!',
    isVisible: true
  },
  methods: {
    async queryServer() {
      const response = await fetch(window.env.apiUrl)
      const result = await response.json()
      this.message = result.message
    }
  }
})
