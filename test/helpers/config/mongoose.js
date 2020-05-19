const mongoose = require('mongoose')
const connectionString = process.env.MONGO_TEST_SERVER

mongoose.connect(connectionString)
mongoose.connection.on('connected', () => {
  console.log('db connected')
})

module.exports = mongoose
