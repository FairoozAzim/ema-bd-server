const express = require('express')
const cors = require('cors');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require('multer');
const path = require('path');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json())


//listening to port
app.listen(port, () => {
    console.log(`Server is running on PORT: ${port}`)
})

//mongo connection


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@ema-bd.hk4ihbq.mongodb.net/?retryWrites=true&w=majority&appName=EMA-BD`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// Set up Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // specify the destination folder
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // use original filename
  }
});

const upload = multer({ storage: storage });

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    const db = client.db("EMA-BD-Website")
    const memberCollection = db.collection("Members");
    const eventCollection = db.collection("Events");
    const blogCollection = db.collection("Blogs");
    const alumniCollection = db.collection("StudentsAlumni");
    
    // ======================Login Endpoint =======================================
    app.post("/login", (req, res) => {
         // check if email exists
      // console.log(req.body.email);
      const {email, password} = req.body
      memberCollection.findOne({ 'email': email })
       
          //if email exists
          .then((user) => {
             // compare the password entered and the hashed password found
             bcrypt.compare(password, user.password)
               // if the passwords match
               .then((passwordCheck) => {
                 // check if password matches
                 if(!passwordCheck) {

                   return res.status(400).send({
                     message: "Passwords does not match",
                     error,
                   });
                 }
                
                 //   create JWT token
                 const token = jwt.sign(
                   {
                     userId: user._id,
                     userEmail: user.email,
                   },
                   "RANDOM-TOKEN",
                   { expiresIn: "24h" }
                 );
            
                 //   return success response
                 res.status(200).send({
                   message: "Login Successful",
                   email: user.email,
                   role: user.adminType,
                   token,
                 });
               })
               // catch error if password does not match
               .catch((error) => {
                 res.status(400).send({
                   message: "Passwords does not match",
                   error,
                 });
               });
           })
           // catch error if email does not exist
           .catch((e) => {
             res.status(404).send({
               message: "Email not found",
               e,
             });
            });
          });

    //=============================== EVENT ==========================================
    // ===========================Event Post

    app.post("/events", upload.single('banner'), (req,res) => {
      console.log(req.file);
      // res.send("Found the data");
      const newEvent = req.body;
      newEvent.banner = req.file.filename;
      // console.log(newEvent);
      eventCollection.insertOne(newEvent)
      .then((eventDes) => {
        res.status(200).send({
          message: "Event posted successfully",
          data : eventDes
        });;
      })
      .catch((error) => {
        res.status(400).send({
          message: "Something went wrong! Please try again.",
          error,
        });
      })

    })

    //the route to images uploaded using forms
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
    
    // // ===========================Event Get

    app.get('/events',async (req,res) => {
      const cursor = eventCollection.find();
      const eventsList = await cursor.toArray();
      // console.log(eventsList);
      res.send(eventsList);
    })

   // // ===========================Event Get by ID

   app.get('/events/:eventId', async (req, res) => {
   const eventId = req.params.eventId;
   console.log(eventId);
    try {
      // Find the requested event
      const query = {_id : new ObjectId(eventId)}
      const event = await eventCollection.findOne(query)
  
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
  
      // Find the previous and next events
      const [previousEvent, nextEvent] = await Promise.all([
        eventCollection.find({ _id: { $lt: eventId } }).sort({ _id: -1 }).limit(1),
        eventCollection.find({ _id: { $gt: eventId } }).sort({ _id: 1 }).limit(1)
      ]);
  
      const response = {
        event,
        links: {
          previous: previousEvent ? `/events/${previousEvent._id}` : null,
          next: nextEvent ? `/events/${nextEvent._id}` : null
        }
      };
      res.json(response);
    }
    
    catch (error){
      console.error('Error fetching event:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  //===========================Event Delete

  app.delete("/events/:eventId", async(req, res) => {
    const eventId = req.params.eventId;
    console.log("Id to delete:", req.params)
    const query = {_id : new ObjectId(eventId)}
    eventCollection.deleteOne(query)
    .then((deleted) => {
      res.status(200).send({
        message: "Deleted Successfully",
        data: eventId
      });
    })
    .catch((error) => {
      res.status(400).send({
        message: "Something went wrong! Please try again.",
        error,
      });
    })
    
    })
     // ===========================BLOG =====================================

    //blog posting endpoint

  app.post("/blogs", upload.single('blogImage'), (req,res) => {
      const newBlog = req.body;
      newBlog.blogImage = req.file.filename;
      console.log("blog: ", newBlog);
      blogCollection.insertOne(newBlog)
      .then((blog) => {
        res.status(200).send({
          message: "Blog posted successfully",
          data : blog
        });;
      })
     .catch((error)=> {
      res.status(400).send({
        message: "Something went wrong! Please try again.",
        error,
      });
     })
    })

    //==================Get Blogs
  app.get('/blogs',async (req,res) => {
      const cursor = blogCollection.find();
      const blogsList = await cursor.toArray();
      console.log(blogsList);
      res.send(blogsList);
    })

    //Get Blog by ID
  app.get('/blogs/:blogId',async (req,res) => {
    const blogId = req.params.blogId;
    console.log("blog id",blogId);
    const oId = new ObjectId(blogId);
    blogCollection.find({"_id": oId}).next()
    .then((blog)=> {
      if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
      }
 
      res.status(200).json({
        message: "Data extracted successfully",
        data: blog
      });
    
    })
    .catch((error) => {
      console.error('Error fetching event:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    })
    })
    //===================================Alumni============================
    //get all alumni
    app.get('/alumni', async(req,res) => {
      const cursor = alumniCollection.find();
      const alumniList = await cursor.toArray();
      // console.log(alumniList);
      res.send(alumniList);
    })
    
   //==============================MEMBERS======================================
   //======================Get Members
   app.get('/members', async(req,res) => {
    const cursor = memberCollection.find();
    const memberList = await cursor.toArray();
    // console.log(alumniList);
    res.send(memberList);
  })
 //======================Get Member by ID
  app.get('/members/:memberId',async (req,res) => {
    const memberId = req.params.memberId;
    console.log(memberId);
    const oId = new ObjectId(memberId);
    memberCollection.find({"_id": oId}).next()
    .then((member)=> {
      if (!member) {
        return res.status(404).json({ message: 'Member doesn\'t exist' });
      }
 
      res.status(200).json({
        message: "Data extracted successfully",
        data: member
      });
    
    })
    .catch((error) => {
      console.error('Error fetching event:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    })
    })
  
    //========================checking the connection of mongodb=====================================================
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } 
  finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

//event-data

app.get('/', (req,res) => {
    res.send("EMA BD server running")

})
