const express=require('express');
const socketIO=require('socket.io');
const http=require('http');
const https = require('https');
const ws = require('ws');
const fs = require('fs');
const cors = require('cors');
const ngrok = require('ngrok');
const mongoose = require('mongoose');
var User = require("./models/user.js");

const port=process.env.PORT||3000
var app=express();
app.use(cors({
  origin: '*'
}));

const httpsOptions = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem')
}
// let server = https.createServer(httpsOptions, app);
let server = http.createServer(app);
// const wss = new ws.Server({ server });
// var io=socketIO('https://localhost:3000');
const io = require('socket.io')(server);
// var io=socketIO('wss://localhost:3000');

// Connect to the MongoDB database.
  mongoose.connect('mongodb://127.0.0.1:27017/v-call',
  {
  useNewUrlParser: true,
  useUnifiedTopology: true
  }).then(() => console.log("Database connected!"))
  .catch(err => console.log("database err : ",err));

// make connection with user from server side
io.on('connection', (socket)=>{
console.log('New user connected');

const user = new User({
          name: socket.handshake.username,
          socketId: socket.id,
          freeToConnect: true,
        });
      console.log(user)
        user.save();
    //   });

//emit message from server to user
socket.emit('myPeerId', {
	peerId: socket.id
});

// listen for message from user
socket.on('createMessage', (newMessage)=>{
	console.log('newMessage', newMessage);
});

socket.on('freeToConnect', async (x , callback)=>{
	console.log('freeToConnect');
  
  const randId = await getRandomSocketId(socket.id);
  console.log("randId", randId)
  // socket.emit('myPeerId', {
  //   nextPeerId: randId
  // });
  callback({
    nextPeerId : randId
  })
});

socket.on('peerConnected',async ()=>{
  console.log('peerConnected',socket.id);
  await User.findOneAndUpdate({ socketId: socket.id }, { freeToConnect: false });
})

socket.on('peerDisconnected',async ()=>{
  console.log('peerDisconnected',socket.id);
  await User.findOneAndUpdate({ socketId: socket.id }, { freeToConnect: true });
})

 // When a user disconnects from the socket, delete the user instance from the database.
  socket.on('disconnect', () => {
    User.deleteOne({ socketId: socket.id }).then(() => {
      console.log('User deleted from database.');
    });
  });
});

app.get("/", (req, res) => {

res.send("Hello World!");
});

server.listen(port, () => {
    console.log('Server listening on port 3000.');
  });


  async function getRandomSocketId(mySocketId) {
    // Get all of the socketIds from the users collection.
    const filteredSocketIds = await User.find({
      freeToConnect: true,
      socketId: { $ne: mySocketId }
    }).select('socketId');
    // const socketIds = await User.find().select('socketId');
   
    // Filter out your own socketId.
    // const filteredSocketIds = socketIds.filter(socketId => (socketId?.socketId !== mySocketId )  );
  
    // Pick a random socketId from the filtered list.
    const randomSocketId = filteredSocketIds[Math.floor(Math.random() * filteredSocketIds.length)];
    console.log("random",filteredSocketIds)
    // Return the socketId.
    return randomSocketId?.socketId;
  }
