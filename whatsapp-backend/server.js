//importing
import express from 'express'
import mongoose from 'mongoose'
import Messages from './dbMessages.js'
import Pusher from 'pusher'
import cors from 'cors'

//app config
const app = express()
const port = process.env.PORT || 9000

const pusher = new Pusher({
    appId: '1068701',
    key: '068954e7ff0fc557306f',
    secret: '16c077fad7e55352e452',
    cluster: 'us3',
    encrypted: true
});

const db = mongoose.connection

db.once('open', () => {
    console.log('DB connected')

    const msgCollection = db.collection('messagecontents')
    const changeStream = msgCollection.watch()

    changeStream.on('change',(change) => {
        console.log(change);

        if(change.operationType === 'insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger('messages','inserted',
                {
                    name:messageDetails.name,
                    massage:messageDetails.message,
                    timestamp:messageDetails.timestamp,
                    received:messageDetails.received

                 }
            )
        }
        else {
            console.log('Error triggering Pusher')
        }
    })
})

//middleware
app.use(express.json())
app.use(cors())


//DB config
const connection_url = 'mongodb+srv://admin:MMPpLstu3kgExGD1@cluster0.xfmit.mongodb.net/whatsappdb?retryWrites=true&w=majority'

mongoose.connect(connection_url,{
    useCreateIndex:true,
    useNewUrlParser:true,
    useUnifiedTopology:true
})

// ???

// api routes
app.get('/', (req, res) => {
  res.status(200).send("Hello World!!")
});

app.get('/messages/sync',(req,res) => {
    Messages.find((err,data) => {
        if(err){
            res.status(500).send(err)
        }else{
            res.status(200).send(data)
        }
    })
})

app.post('/messages/new', (req, res) => {
  const dbMessage = req.body

    Messages.create(dbMessage,(err,data)=> {
        if(err) {
            res.status(500).send(err)
        }else{
            res.status(201).send(`new message created ${data}`)
        }
    })

});

//listen
app.listen(port,() => {
    console.log(`Listening on http://localhost:${port}`)
})
