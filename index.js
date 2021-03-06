const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// use middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vm2fc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const inventoryCollection = client.db('gymEquipment').collection('inventory');
        const newsCollection = client.db('gymEquipment').collection('news');

        // jwt
        app.post('/login', async (req, res) => {
            const email = req.body;
            const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET);
            res.send({token})
            console.log(token);
        })

        // inventory api

        app.get('/inventory', async (req, res) => {
            const query = {};
            const cursor = inventoryCollection.find(query);
            const inventories = await cursor.toArray();
            res.send(inventories);
        });

        // news api

        app.get('/news', async (req, res) => {
            const query = {};
            const cursor = newsCollection.find(query);
            const allNews = await cursor.toArray();
            res.send(allNews);
        });

        // email 
        app.get('/myInventory', async (req, res) => {
            const tokenInfo = req.headers.authorization;
            const [email, accessToken] = tokenInfo?.split(" ");
            const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
            if(email === decoded.email){
                const orderInfo = await inventoryCollection.find({email: email}).toArray();
                res.send(orderInfo);
            }
            else{
                res.send({success: 'failed'})
            }
        });

        app.get('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const inventory = await inventoryCollection.findOne(query);
            res.send(inventory);
        });

        // post
        app.post('/inventory', async (req, res) => {
            const newItem = req.body;
            const result = await inventoryCollection.insertOne(newItem);
            res.send(result);
        });

        // delete
        app.delete('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const inventory = await inventoryCollection.deleteOne(query);
            res.send(inventory);
        });

        // use put update quantity
        app.put('/updateQuantity/:id', async (req, res) => {
            const id = req.params.id;
            const data = req.body;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    quantity: data.updateQuantity,
                }
            }
            const result = await inventoryCollection.updateOne(
                filter,
                updateDoc,
                options
            );
            res.send(result);
            console.log(data)
        })
    }
    finally { }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Running gym equipment warehouse');
});

app.listen(port, () => {
    console.log('Listening to port', port);
});