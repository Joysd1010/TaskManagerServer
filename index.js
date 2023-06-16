const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()


const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oeyyszo.mongodb.net/?retryWrites=true&w=majority`;

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
        // await client.connect();
        // -----------declaring database collection
        const taskCollection = client.db('TaskManager').collection('task');
        const user = client.db('TaskManager').collection('user');
        const cartCollection = client.db('TaskManager').collection('myTask');

        //-------------------get request for getting all classes-------------
        app.get('/alltask', async (req, res) => {
            const cursor = taskCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        })
        // --------------api get request for verifying admin----------------------
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email
            const filter = { email: email }
            const cursor = user.findOne(filter);
            const result = await cursor;
            res.send(result)
        })
        //-----------------------fetching all users-------------------------------------
        app.get('/users', async (req, res) => {
            const cursor = user.find();
            const result = await cursor.toArray();
            res.send(result)
        })
        //-----------------------fetching all Cart data-------------------------------------
        app.get('/cart/:email', async (req, res) => {
            const email = req.params.email;
            if (!email) {
                return res.send([])
            }

            const query = { email: email };
            const result = await cartCollection.find(query).toArray();

            res.send(result)
        })
        //----------------------deleting from the cart -------------------------
        app.delete('/cart/:id', async (req, res) => {
            const id = req.params.id;
            //console.log(' delete from database', id);
            const query = { _id: new ObjectId(id) }

            const result = await cartCollection.deleteOne(query);
            res.send(result);
        })

        // --------------Add task to cart to complete by user later--------------------
        app.post('/cart', async (req, res) => {
            const newTask = req.body;
            const result = await cartCollection.insertOne(newTask)
            res.send(result)
        })
        //----------------making admin-----------------------
        app.patch('/users/admin/:id', async (req, res) => {
            const _id = req.params.id;
            const filter = { _id: new ObjectId(_id) }
            const updateDoc = { $set: { role: 'admin' } }
            const result = await user.updateOne(filter, updateDoc)
            res.send(result)
        })
        // --------------Add task--------------------
        app.post('/addTask', async (req, res) => {
            const newClass = req.body;
            const result = await taskCollection.insertOne(newClass)

            res.send(result)
        })
        // --------------------------------deleting user-------------------
        app.delete('/deleteUser/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await user.deleteOne(query);
            res.send(result)
        })
        //--------------Post request for saving all user details into database-------------------------------
        app.post('/user', async (req, res) => {
            const item = req.body
            const query = { email: item.email }
            const existUser = await user.findOne(query)
            if (existUser) {
                return res.send({ message: 'This user is already exists' })
            }
            const result = await user.insertOne(item);
            res.send(result)
        })


        //---------------------Updating the task by admin---------------------------
        app.patch('/updatetask/:id', async (req, res) => {
            const id = req.params.id;
            const task = req.body;
            //console.log(id, task);

            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updatedtask = {
                $set: {
                    task_name: task.task_name,
                    task_deadline: task.task_deadline,
                    task_description: task.task_description
                }
            }

            const result = await taskCollection.updateOne(filter, updatedtask, options);
            res.send(result);

        })
        //---------------------Updating the task complete number by user---------------------------
        app.patch('/number/:id', async (req, res) => {
            const id = req.params.id;
            const number = req.body;
            const update=parseInt( number.total_completed)+1;
            //console.log(update);

            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const taskupdate = {
                $set: {
                    total_completed: update
                }
            }

            const result = await taskCollection.updateOne(filter, taskupdate, options);
            res.send(result);

        })
        //---------------------Updating the task complete Status by user---------------------------
        app.patch('/complete/:id', async (req, res) => {
            const id = req.params.id;
            //console.log(id);
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const taskupdate = {
                $set: {
                    status: 'completed'
                }
            }

            const result = await cartCollection.updateOne(filter, taskupdate, options);
            res.send(result);

        })
        //-------------------------approving task by admin--------------------------
        app.patch('/approveTask/:id', async (req, res) => {
            const id = req.params.id;


            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updatedtoy = {
                $set: {
                    task_approve_status: "approved"
                }
            }

            const result = await taskCollection.updateOne(filter, updatedtoy, options);
            res.send(result);

        })
        //-----------------------delete task--------------------
        app.delete('/tasks/:id', async (req, res) => {
            const id = req.params.id;
            //console.log(' delete from database', id);
            const query = { _id: new ObjectId(id) }

            const result = await taskCollection.deleteOne(query);
            res.send(result);
        })




        await client.db("admin").command({ ping: 1 });
        //console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send('Task manager is running ')
})
app.listen(port, () => {
    //console.log(`TaskManager is running on port ${port}`)
})