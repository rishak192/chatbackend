var express = require('express')
var bodyParser = require('body-parser')
var cors = require('cors')

var app = express()
app.use(cors())

require('dotenv/config')

// app.use(bodyParser())

app.use(bodyParser.json({
    limit: '20mb'
}))

app.use(bodyParser.urlencoded({
    limit: '20mb',
    parameterLimit: 100000,
    extended: true
}))

const mongoose = require('mongoose')

const http = require('http').Server(app);
const io = require('socket.io')(http, { 'transports': ['websocket', 'polling'] });

const Chat = require('./Models/chat')
const User = require('./Models/user')
const { removeAllListeners } = require('./Models/chat')

mongoose.connect(process.env.URL, { useNewUrlParser: true, useUnifiedTopology: true }, () => {
    console.log('Database Connected');
})

const users = {}

io.on('connection', socket => {
    //console.log("Connected");


    socket.on('join', ({ userid, chatid, chattingwith }) => {
        //console.log("chatid chattingwith", chatid, chattingwith, userid);

        users[userid] = true;

        //console.log(users);

        socket.on('image',({chatid,userid,result})=>{
            // console.log(chatid,userid,result)
            var img='img'
            socket.broadcast.to(chatid).emit('imagereceived',{img,result})
        })

        socket.on('disconnect', () => {
            //console.log("Disconnected");
            users[userid] = false
            //console.log(users);
            socket.broadcast.emit('disconnected', userid)
        })

        socket.join(chatid);
        socket.broadcast.emit('online', users);
        socket.emit('friendsonline', users)

        socket.on('leaveroom', data => {
            //console.log("room leaving",data);
            var left = socket.leave(data);
            socket.emit("roomleft", left)
        })

        User.updateOne({ name: userid },
            {
                $set: {
                    ["chatid." + chatid]: true
                }
            }, { upsert: true }).then((result) => {
                //console.log(result);
            })

        User.updateOne({ name: chattingwith },
            {
                $set: {
                    ["chatid." + chatid]: true
                }
            }, { upsert: true }).then((result) => {
                //console.log(result);
            })

        Chat.findOne({ chatid: chatid }).then(res => {
            if (res !== null) {
                //console.log(res.mesDetails);
                socket.emit('started', res.mesDetails)
            }
        })

        // socket.of('/').in(chatid).clients((error, clients) => {
        //     if (error) throw error;
        //     console.log(clients); // => [Anw2LatarvGVVXEIAAAD]
        // });

        // var roster = io.sockets.adapter.rooms.get(chatid);

        // roster.forEach(function(client) {
        //     console.log('Username: ' + client.nickname);
        // });

        User.findOne({ name: userid }).then(res => {
            // console.log('user', res);
            if (res === null) {
                const user = new User({ name: userid })
                user.save().then(res => {
                    // console.log(res);
                })
            }
        })

        Chat.findOne({ chatid: chatid }).then(res => {
            // console.log('chat', res);
            if (res === null) {
                const chat = new Chat({ chatid: chatid })
                chat.save().then(res => {
                    // console.log(res);
                })
            }
        })
    })

    socket.on('type', ({ userid, chatid }) => {
        // console.log(userid, chatid);
        socket.broadcast.to(chatid).emit('typing', { userid, chatid });
    })

    socket.on('send', ({ mes, id, chatId }) => {
        // socket.emit('recieve',{mes,id});
        // console.log(mes,id,chatId);
        // console.log(mes,id,chatId);
        var d = new Date(Date.now());

        var chatDocument = {
            message: mes,
            userid: id,
            datetime: {
                date: d.toDateString().toString(),
                time: d.toTimeString().toString()
            }
        }

        var datetime = chatDocument.datetime

        Chat.updateOne({ chatid: chatId },
            {
                $push: {
                    mesDetails:
                    {
                        $each: [chatDocument]
                    }
                }
            }, { upsert: true }).then(() => {
                socket.broadcast.to(chatId).emit('receive', { mes, id, datetime });
            })
    })
})


app.get('/', (req, res) => {
    res.send("third")
})

app.get('/alluser', async (req, res) => {
    await User.find().then(result => {
        // console.log(result);
        res.json({ result })
    })
})

app.get('/prevchats/:userid', async (req, res) => {
    const userid = req.params.userid
    //console.log("userid ", userid);

    await User.findOne({ name: userid }).then(result => {
        //console.log("result ", result, "userid ", userid);
        res.json({ result })
    })

})

app.post('/image', async (req, res) => {
    console.log(req.body);
    res.json({ image: req.body.data[0] })
})

http.listen(process.env.PORT, () => {
    console.log("listening");
})
