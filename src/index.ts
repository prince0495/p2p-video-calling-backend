import express, {Request, Response} from 'express'
import { Server } from 'socket.io'
import { createServer } from 'node:http'
import cors from 'cors'
import 'dotenv/config'
import { globalPrismaClient } from './prisma'

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
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.post('/room/create', async(req, res) => {
    try {
        const prisma = globalPrismaClient;
        const {roomName} = req.body;
        const alreadyRoom = await prisma.room.findUnique({
            where: {
                name: roomName
            }
        })
        if(alreadyRoom) {
            res.json({msg: 'room already exists' })
        }
        else {
            const room = await prisma.room.create({
                data: {
                    name: roomName
                }
            })
            res.json({msg: 'room created'})
        }
    } catch (error) {
        res.json({msg: 'Cannot create room', error})
    }
    
})

app.post('/room/del', async(req, res) => {
    try {
        const prisma = globalPrismaClient;
        const {roomName} = req.body;
        await prisma.room.delete({
            where: {
                name: roomName
            }
        })
        res.json({msg: 'room deleted'})
    } catch (error) {
        res.json({msg: 'cannot delete room', error})
    }
})

app.get('/room', async(req, res) => {
    const prisma = globalPrismaClient;
    const rooms = await prisma.room.findMany({});
    res.json({rooms})
})

io.on('connection', (socket) => {
    console.log("New user connected with socket id :", socket.id);
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
    socket.on('leaveRoom', async roomName => {
        const clients = await io.in(roomName).fetchSockets();
        const count = clients.length;
        if(count == 1) {
            try {
                const prisma = globalPrismaClient;
                const alreadyPresent = await prisma.room.findUnique({
                    where: {
                        name: roomName
                    }
                })
                if(alreadyPresent) {
                    await prisma.room.delete({
                        where: {
                            name: roomName
                        }
                    })
                    console.log('room deleted with roomName: ', roomName);
                }
                else {
                    console.log('room was not present in db');
                }
            } catch (error) {
                console.log('cannot delete room with roomName: ', roomName, error);
            }
        }
        socket.leave(roomName)
        socket.broadcast.to(roomName).emit('userLeft')
    })

    socket.on('disconnect', async() => {
        console.log('user disconnected with socket id : ', socket.id);
    })
})

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
})