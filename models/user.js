const mongoose = require('mongoose');

// Create a new Mongoose schema for the user model.
const userSchema = new mongoose.Schema({
  name: String,
  socketId: String,
  freeToConnect: String
});

// Create a new Mongoose model using the schema.
const User = mongoose.model('User', userSchema);

module.exports = User;
