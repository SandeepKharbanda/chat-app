const express = require('express')
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

let count = 0
let messages = 'Welcome!'
io.on('connection', (socket) => {
    console.log('New WebSocket connection')

    // socket.emit('countUpdated', count)
    // socket.emit('message', generateMessage(messages))
    // socket.broadcast.emit('message', generateMessage('A new user has joined')) //socket.broadcast the message except for the new user

    socket.on('increment', () => {
        count++
        // socket.emit('countUpdated', count)
        io.emit('countUpdated', count) //Send it to everyone client
    })

    socket.on('join', ({username, room}, callback) => {
        const { error, user } = addUser({id: socket.id, username, room })
        if(error) {
            return callback(error)
        }
        socket.join(user.room)

        console.log(getUsersInRoom(user.room))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        socket.emit('message', generateMessage('Admin', messages))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined`)) //socket.broadcast.to(room) the message within a room except for the new user
    
        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        if (user) {
            // io.emit('message', generateMessage(message)) //io.emit - Send message to everyone ad every room
            io.to(user.room).emit('message', generateMessage(user.username, message))// io.to('San jose').emit - Send message to everyone of a particular room
            callback('Delivered!')
        }
    })

    socket.on('sendLocation', (coordinate, callback) => {
        const user = getUser(socket.id)
        if (user) {
            const {
                latitude,
                longitude
            } = coordinate
            io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${latitude},${longitude}`))
            callback && callback('Location shared!')
        }
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

// app.listen(port, ()=> {
//     console.log('Server listening on port ' + port)
// })

server.listen(port, ()=> {
    console.log('Server listening on port ' + port)
})
