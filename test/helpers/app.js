const express = require('express')
const logger = require('morgan')
const bodyParser = require('body-parser')
const app = express()
// process.env now has the keys and values you defined in your .env file.
require('dotenv').config()

require('./config')(app)
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.get('/', function (req, res) {
  res.send('Hello World!')
})

module.exports = app
