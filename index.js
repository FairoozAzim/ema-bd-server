const express = require('express')
const cors = require('cors');

const events = require('./Database/events');

const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json())

//listening to port
app.listen(port, () => {
    console.log(`Server is running on PORT: ${port}`)
})


//event-data

app.get('/', (req,res) => {
    res.send("EMA BD server running")

})

app.get('/events', (req, res) => {
    res.send(events)
})

app.post('/events', (req,res) =>{
    // console.log(req.body);
    // console.log("post api hitting");
    const newEvent = req.body;
    newEvent.id = events.length + 1;
    events.push(newEvent);
    res.send(newEvent);
})

app.get('/events/:id', (req,res) =>{
    const id = parseInt(req.params.id);
    const filtered_data = events[id-1];
    const length = events.length;
    const next_id = id +1;
    const prev_id = id-1 ;
    console.log(next_id);
    const responseData = {
        filtered_data,
        prev_id: prev_id > 0 ? prev_id : null,
        next_id: next_id <= length ? next_id : null
    }
    res.send(responseData);
})


app.delete('/events/:id', (req, res) => {
    const id = req.params.id;
    // console.log(id);
    deleteIndex = id-1;
    events.splice(deleteIndex, 1);
    // console.log(events);
    res.send(events);
    
})
