// // src/server.js
// const { app, allowedOrigins } = require('./app'); // import bot
// const mongoose = require('mongoose');
// const http = require('http');
// const { Server } = require('socket.io');
// require('dotenv').config();
// const Delivery = require('./models/Delivery'); // ADD THIS LINE

// const PORT = process.env.PORT || 5000;
// const server = http.createServer(app);
// // const io = new Server(server, {
// //     cors: {
// //         origin: '*',
// //     }
// // });

// const io = new Server(server, {
//   cors: {
//     origin: allowedOrigins,
//     credentials: true
//   }
// });


// io.on('connection', (socket) => {
//     console.log('A user connected with Socket.IO:', socket.id);

//     socket.on('update-location', async (data) => {
//         const { deliveryPersonId, latitude, longitude } = data;

//         io.emit('location-updated', {
//             deliveryPersonId,
//             latitude,
//             longitude,
//         });

//         try {
//             await Delivery.findOneAndUpdate(
//                 { deliveryPerson: deliveryPersonId, status: { $ne: 'delivered' } },
//                 { 'liveLocation.latitude': latitude, 'liveLocation.longitude': longitude }
//             );
//         } catch (error) {
//             console.error('Failed to update live location in DB:', error);
//         }
//     });

//     socket.on('disconnect', () => {
//         console.log('A user disconnected from Socket.IO:', socket.id);
//     });
// });

// mongoose.connect(process.env.MONGODB_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// })
// .then(() => console.log('MongoDB connected successfully'))
// .catch(err => console.error('MongoDB connection error:', err));

// server.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });

// server.js
require('dotenv').config();
const { app, allowedOrigins } = require('./app');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const Delivery = require('./models/Delivery');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('A user connected with Socket.IO:', socket.id);

  socket.on('update-location', async (data) => {
    const { deliveryPersonId, latitude, longitude } = data;

    io.emit('location-updated', { deliveryPersonId, latitude, longitude });

    try {
      await Delivery.findOneAndUpdate(
        { deliveryPerson: deliveryPersonId, status: { $ne: 'delivered' } },
        { 'liveLocation.latitude': latitude, 'liveLocation.longitude': longitude }
      );
    } catch (error) {
      console.error('Failed to update live location in DB:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected from Socket.IO:', socket.id);
  });
});

// Validate MONGODB_URI early to provide a clear error message for misconfiguration
if (!process.env.MONGODB_URI || (!process.env.MONGODB_URI.startsWith('mongodb://') && !process.env.MONGODB_URI.startsWith('mongodb+srv://'))) {
  console.error('Missing or invalid MONGODB_URI in .env. Set it to a valid connection string (mongodb://... or mongodb+srv://...).');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
