'use strict'

const express = require('express')
const cors = require('cors')

const app = express()

app.use(cors())

app.get('/', (req, res) => {
  res.send(JSON.stringify({ message: `Server time: ${new Date().toString()}` }))
})

module.exports = app
