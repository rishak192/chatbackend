var express = require('express')
var app = express()
var cors=require('cors')

app.use(cors())

require('dotenv/config')

const http = require('http').Server(app);
const io = require('socket.io')(http, { 'transports': ['websocket', 'polling'] });

// const Chat = require('./Routes/chat');

// app.use(Chat)

http.listen(process.env.PORT, () => {
    console.log("listening");
})

io.on('connection', socket => {
    console.log("Connected");
    socket.emit('started', "Done")
    var chatI
    socket.on('join', (chatId) => {
        // console.log("chatid", chatId);
        socket.join(chatId);
        socket.emit('joinsuccess', chatId);
    })

    socket.on('send',({mes,id,chatId})=>{
        // socket.emit('recieve',{mes,id});
        // console.log(mes,id,chatId);
        socket.broadcast.to(chatId).emit('receive', {mes,id});
    })

    socket.on('disconnect', () => {
        console.log("Disconnected");
    })
})


app.get('/', (req, res) => {
    // console.log("Getting");
    res.send("Started")
})
