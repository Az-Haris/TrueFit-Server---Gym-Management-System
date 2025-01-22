require('dotenv').config()
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const port = process.env.PORT || 5000
const app = express();

app.use(cors())
app.use(express.json())




const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.DB_URI;

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
        const database = client.db('TrueFit');
        const userCollection = database.collection('Users');

        // -------------- User Related APIs -----------------------------

        // API to Save User Data
        app.post('/users', async (req, res) => {
            const { email, displayName, photoURL, authMethod } = req.body;
            try {
                // Check if a user with the email already exist
                const existingUser = await userCollection.findOne({ email })

                if (existingUser) {
                    // Update the user with the new authMethod
                    if (existingUser.authMethod !== authMethod) {
                        await userCollection.updateOne(
                            { email },
                            { $set: { authMethod, updatedAt: new Date(), lastLogin: new Date() } }
                        )
                    }

                    return res.status(200).json({
                        message: "User already exists",
                        user: existingUser,
                    });
                }

                // Insert a new user if no duplicate found
                const newUser = {
                    email,
                    displayName,
                    photoURL,
                    authMethod,
                    role: 'member',
                    createdAt: new Date(),
                    lastLogin: new Date()
                }

                const result = await userCollection.insertOne(newUser);
                res.status(201).json({
                    message: "User created successfully",
                    user: { ...newUser, _id: result.insertedId },
                })
            }
            catch (error) {
                res.status(500).json({ message: "Error saving user", error: error.message })
            }
        });

        // Login User and update login time
        app.patch("/users/:email", async (req, res) => {
            const email = req.params.email;
            try {
                const result = await userCollection.updateOne(
                    { email }, // Filter
                    { $set: { lastLogin: new Date() } } // Update using $set
                );
                if (result.matchedCount === 0) {
                    return res.status(404).json({ message: "User not found" });
                }

                const user = await userCollection.findOne({ email })
                res.status(200).json({
                    message: "User login time updated successfully",
                    result,
                    user
                });
            } catch (error) {
                res.status(500).json({ message: "Error updating user", error: error.message });
            }
        });

        //   Get User's all data from db
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const result = await userCollection.findOne({ email })
            res.send(result);
        })

        // update user info
        app.patch("/user/:email", async (req, res) => {
            const email = req.params.email;
            const updatedInfo = req.body;
            const result = await userCollection.updateOne({ email }, { $set: updatedInfo })
            const user = await userCollection.findOne({ email })
            res.send(user)
        })

        // Get user's role
        app.get('/users/role/:email', async (req, res) => {
            const email = req.params.email;
            const result = await userCollection.findOne({ email })
            res.send({ role: result.role })
        })





        console.log("Successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send("Hello from True Fit Server...")
})

app.listen(port, () => {
    console.log('Server is running on port : ', port)
})