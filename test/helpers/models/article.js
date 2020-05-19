const mongoose = require('mongoose')

const articleSchema = mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  secret: {
    type: String,
    default: 'some secret'
  },
  views: {
    type: Number,
    default: 0
  }
})

module.exports = mongoose.model('Article', articleSchema)
