const express = require('express')
const app = express()

// Express Routes
app.get('/', function(req, res) {
  res.send('Hello from Serverless Express!')
})

app.get(`/*`, (req, res) => {
  res.send(`Hello from ${req.path} and ${req.method}`)
})

module.exports = app

