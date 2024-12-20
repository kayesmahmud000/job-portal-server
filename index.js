require('dotenv').config()
const express = require('express');
const jwt = require('jsonwebtoken')
 const cors = require('cors');
 const cookieParser = require('cookie-parser');

 const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
 const port = process.env.PORT || 5000
 const app =express()

 app.use(cors())
 app.use(express.json())
 app.use(cookieParser())


 
 const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.crgmj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
 
 // Create a MongoClient with a MongoClientOptions object to set the Stable API version
 const client = new MongoClient(uri, {
   serverApi: {
     version: ServerApiVersion.v1,
     strict: true,
     deprecationErrors: true,
   }
 });
 
 async function run() {
   try {
     // Connect the client to the server	(optional starting in v4.7)
     await client.connect();
     const jobCollection = client.db("JobPortalDb").collection("Jobs");
     const jobApplicationCollection = client.db("JobPortalDb").collection("applications");

    //  auth api
     app.post("/jwt", async(req, res)=>{
      const user =req.body
      const token = jwt.sign(user, process.env.JWT_SECRET, {expiresIn:"1h"})
      res.cookie('token', token,{
        httpOnly: true,
        secure:false

      })
      .send({success:true})
     })

     app.get("/allJobs", async(req ,res)=>{
      const email= req.query.email
      let query={}
      if(email){
        query={hr_email: email}
      }
        const cursor= jobCollection.find(query)
       const  result= await cursor.toArray()
       res.send(result)
     })

     app.get("/jobs/:id" , async(req, res)=>{
      const id = req.params.id
      const query= {_id:new ObjectId(id)}
      const result = await jobCollection.findOne(query) 
      res.send(result)
     })

     app.post("/jobs", async(req, res)=>{
      const newJob =req.body
      const result= await jobCollection.insertOne(newJob)
      res.send(result)
     })

     app.get("/job-application", async(req, res)=>{
      const email= req.query.email
      const query= {applicant_email: email}
        const result= await jobApplicationCollection.find(query).toArray()

        for(const apply of result){
          const id = apply.job_id
          const query1= {_id:new ObjectId(id)}
          const result1 = await jobCollection.findOne(query1) 
          if(result1){
            apply.title= result1.title,
            apply.company= result1.company
            apply.company_logo= result1.company_logo
          }
        }
        res.send(result)
     })

     app.get("/job-application/job/:id", async(req, res)=>{
      const jobId= req.params.id
      const query= {job_id: jobId}

      const result=await jobApplicationCollection.find(query).toArray()
      res.send(result)
     })
     
      app.post("/job-application", async(req, res)=>{
        const application= req.body
        console.log(application)
        const result= await jobApplicationCollection.insertOne(application)

        const id =application.job_id;
        const query= {_id :new ObjectId(id)}

        const job = await jobCollection.findOne(query)
        let newCount =0
        if(job.applicationCount){
          newCount= job.applicationCount+1
        }else{
          newCount=1
        }
        const filter= {_id: new ObjectId(id)}
        const updateJob={
          $set:{
             applicationCount: newCount
            }
        }
        const updateResult = await jobCollection.updateOne(filter, updateJob)
        console.log(job)
        res.send(result)

      })
      app.patch("/job-application/:id", async(req, res)=>{
        const id = req.params.id
        const filter={ _id: new ObjectId(id)}
        const data = req.body

        const updateDoc= {
          $set:{
            status: data.status
          }
        }
        const result= await jobApplicationCollection.updateOne(filter, updateDoc)
        res.send(result)
      })
     
     // Send a ping to confirm a successful connection
     await client.db("admin").command({ ping: 1 });
     console.log("Pinged your deployment. You successfully connected to MongoDB!");
   } finally {
     // Ensures that the client will close when you finish/error
    //  await client.close();
   }
 }
 run().catch(console.dir);
 
 app.get("/", (req, res)=>{
    res.send("Job portal is running")
 })

 app.listen(port, ()=>{
    console.log(`Job portal server is running from port${port}`)
 })