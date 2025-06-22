import express from 'express'
import { Server } from 'socket.io'
import { createServer } from 'node:http'
import cors from 'cors'
import 'dotenv/config'

const app = express();
const server = createServer(app)
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ['GET', 'POST', 'PUT'],
        credentials: true
    }
})
const PORT = process.env.PORT || 8080;
app.use(cors())

app.get('/', (req, res) => {
    res.send('Hello World!')
})

io.on('connection', (socket) => {
    console.log("New user connected");
    socket.on('joinRoom', async(roomName: string) => {
        const clients = await io.in(roomName).fetchSockets();
        const count = clients.length;
        if(count >= 2) {
            socket.emit('roomFull')
        }
        else {
            socket.join(roomName)
            socket.emit('roomJoined')
            socket.broadcast.to(roomName).emit('newUserJoined')
        }
    })
    socket.on('createOffer', (obj) => {
        const {roomName, sdp} = obj;
        socket.broadcast.to(roomName).emit('createOffer', obj)
    })
    socket.on('createAnswer', (obj) => {
        const {roomName, sdp} = obj;
        socket.broadcast.to(roomName).emit('createAnswer', obj)
    })
    socket.on('iceCandidateExchange', (obj) => {
        const { roomName, candidate } = obj;
        socket.broadcast.to(roomName).emit('iceCandidateExchange', {roomName: roomName, candidate: candidate})
    })
    socket.on('leaveRoom', roomName => {
        socket.leave(roomName)
        socket.broadcast.to(roomName).emit('userLeft')
    })
})


server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
})