require('dotenv').config()
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const Stripe = require('stripe');
const port = process.env.PORT || 5000
const app = express();

app.use(cors())
app.use(express.json())


// intialize stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const subscriberCollection = database.collection('Subscribers');
        const forumCollection = database.collection("Forums");
        const classCollection = database.collection("Classes");
        const applicationCollection = database.collection("Applications");
        const slotCollection = database.collection('Slots')
        const paymentCollection = database.collection("Payments")
        const reviewCollection = database.collection('Reviews')

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



        // ------------ Subscriber Related Api ---------------------

        app.post('/subscribers', async (req, res) => {
            const data = req.body;
            const result = await subscriberCollection.insertOne(data);
            res.send(result);
        })

        app.get("/subscribers", async (req, res) => {
            const result = await subscriberCollection.find().toArray();
            res.send(result)
        })



        // -------------- Get All Trainers Profile ---------------
        app.get('/trainers', async (req, res) => {
            const result = await userCollection.find({ role: 'trainer' }).toArray()
            res.send(result)
        })

        // get specific trainer
        app.get('/trainers/:id', async (req, res) => {
            const id = req.params.id;
            const result = await userCollection.findOne({ _id: new ObjectId(id) })
            res.send(result)
        })

        // Delete Trainer by Admin
        app.patch('/trainers/:id', async (req, res) => {
            const id = req.params.id;
            const result = await userCollection.updateOne({ _id: new ObjectId(id) }, { $set: { role: 'member' } })
            res.send(result)
        })




        // -------------- Forum Related Apis ----------------
        app.post('/forum', async (req, res) => {
            const forumData = req.body;
            const result = await forumCollection.insertOne(forumData)
            res.send(result)
        })

        app.get('/forum', async (req, res) => {
            const page = parseInt(req.query.page) || 1; // Default to page 1 if no page is provided
            const limit = 6; // Posts per page
            const skip = (page - 1) * limit; // Calculate the number of documents to skip

            try {
                const totalPosts = await forumCollection.countDocuments(); // Total number of posts
                const result = await forumCollection
                    .find()
                    .sort({ postedDate: -1 }) // Sort by `postedDate` in descending order (latest first)
                    .skip(skip) // Skip documents for pagination
                    .limit(limit) // Limit the number of documents per page
                    .toArray();

                res.status(200).send({
                    totalPosts,
                    currentPage: page,
                    totalPages: Math.ceil(totalPosts / limit),
                    posts: result,
                });
            } catch (error) {
                res.status(500).send({ message: "Error retrieving forums", error: error.message });
            }
        });

        // API to handle upvotes
        app.patch('/forum/upvote/:id', async (req, res) => {
            const { id } = req.params;
            try {
                const result = await forumCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $inc: { upvotes: 1 } } // Increment upvotes by 1
                );
                res.status(200).json({ message: "Upvote successful", result });
            } catch (error) {
                res.status(500).json({ message: "Error upvoting", error: error.message });
            }
        });

        // API to handle downvotes
        app.patch('/forum/downvote/:id', async (req, res) => {
            const { id } = req.params;
            try {
                const result = await forumCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $inc: { downvotes: 1 } } // Increment downvotes by 1
                );
                res.status(200).json({ message: "Downvote successful", result });
            } catch (error) {
                res.status(500).json({ message: "Error downvoting", error: error.message });
            }
        });




        // --------------- Class Related Apis -----------------
        app.post('/classes', async (req, res) => {
            const classData = req.body;
            const result = await classCollection.insertOne(classData)
            res.send(result)
        })

        app.get('/classes', async (req, res) => {
            try {
                const { page = 1, limit = 6, search = '' } = req.query;

                // Parse page and limit as integers
                const pageInt = parseInt(page);
                const limitInt = parseInt(limit);

                // Search filter
                const searchFilter = search
                    ? { className: { $regex: search, $options: 'i' } } // Case-insensitive search
                    : {};

                // Calculate total count for pagination
                const totalCount = await classCollection.countDocuments(searchFilter);

                // Fetch paginated and filtered data
                const classes = await classCollection
                    .find(searchFilter)
                    .skip((pageInt - 1) * limitInt) // Skip documents for pagination
                    .limit(limitInt) // Limit the number of documents
                    .toArray();

                // Response
                res.json({
                    classes,
                    totalPages: Math.ceil(totalCount / limitInt),
                    currentPage: pageInt,
                });
            } catch (error) {
                console.error('Error fetching classes:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        // get all classes
        app.get('/all-classes', async (req, res) => {
            const result = await classCollection.find().toArray()
            res.send(result)
        })




        // -------------- Trainer Application Apis --------------
        app.post('/apply', async (req, res) => {
            const applicantData = req.body;
            const {userEmail} = applicantData;
            const processedData = { ...applicantData, slots: 10, status: "pending", appliedAt: new Date(), adminFeedback: null, }
            const result = await applicationCollection.insertOne(processedData)
            await userCollection.updateOne({email: userEmail}, {$set: {status: 'pending'}})
            res.send(result)
        })

        // Get All applications for admin dashboard
        app.get('/applications', async (req, res) => {
            const result = await applicationCollection.find({ status: 'pending' }).toArray()
            res.send(result)
        })

        // check for applicant
        app.get('/application/:email', async (req, res) => {
            const email = req.params.email;
            const result = await applicationCollection.findOne({ userEmail: email })
            res.send(result)
        })

        // confirm application
        app.patch('/confirm/:email', async (req, res) => {
            const userEmail = req.params.email;
            const application = await applicationCollection.findOne({ userEmail })

            const { fullName, photoURL, age, aboutInfo, experience, skills, availableDays, availableTime, linkedin, instagram, slots } = application;

            const updateTrainer = await userCollection.updateOne({ email: userEmail },
                {
                    $set: {
                        photoURL, fullName, age, aboutInfo, linkedin, instagram, experience, skills, availableDays, availableTime, slots, role: 'trainer', status: 'approved',
                    }
                }
            )

            if (updateTrainer.modifiedCount > 0) {
                await applicationCollection.deleteOne({ userEmail })
                return res.status(200).json({ message: 'Application approved and user updated successfully.' })
            } else {
                return res.status(404).json({ message: 'User not found.' });
            }
        })

        // Reject application
        app.patch('/reject/:email', async (req, res) => {
            const userEmail = req.params.email;
            const { adminFeedback } = req.body;

            const application = await applicationCollection.findOne({ userEmail })

            const { fullName, photoURL, age, aboutInfo, experience, skills, availableDays, availableTime, slots } = application;

            const result = await userCollection.updateOne({ email: userEmail }, {
                $set: {
                    displayName: fullName,
                    age, photoURL,
                    status: 'rejected',
                    adminFeedback,
                }
            })

            if (result.modifiedCount > 0) {
                await applicationCollection.deleteOne({ userEmail })
                return res.status(200).json({ message: 'Application rejected successfully.' })
            } else {
                return res.status(404).json({ message: 'User not found.' });
            }
        })




        // ------------ Slots Related Apis ---------------
        app.post('/add-slot', async (req, res) => {
            const slotData = req.body;
            const {selectedClasses} = slotData;

            const classesId = selectedClasses.map(selectedClass=> selectedClass.value);

            const trainerId = slotData.trainerId;
            
            const result = await slotCollection.insertOne(slotData)
            if (result.insertedId) {
                const updateClass = await classCollection.updateMany({_id: {$in: classesId.map(classId=>new ObjectId(classId))}}, {
                    $addToSet: {trainerId: trainerId}
                })
                res.send(updateClass)
            }
            
        })

        app.get('/slots/:id', async (req, res) => {
            const trainerId = req.params.id;
            const result = await slotCollection.find({ trainerId }).toArray()
            res.send(result)
        })

        app.get('/slot/:slotId', async (req, res) => {
            const slotId = req.params.slotId;
            const result = await slotCollection.findOne({ _id: new ObjectId(slotId) })
            res.send(result)
        })



        // -------------- Paymet related apis ----------------
        // API to create payment intent
        app.post('/api/create-payment-intent', async (req, res) => {
            try {
                const { amount } = req.body;

                const paymentIntent = await stripe.paymentIntents.create({
                    amount: amount,
                    currency: 'usd'
                });

                res.send({ clientSecret: paymentIntent.client_secret });
            } catch (err) {
                console.error("Error creating payment intent", err)
                res.status(500).send({ error: "Internal Server Error" })
            }
        })

        // Save payment info
        app.post('/api/save-payment-info', async (req, res) => {
            try {
                const { trainerName, slotName, packageName, price, classesId, userName, userEmail, paymentId, slotId, trainerId } = req.body;


                // Save payment information in the database
                const paymentInfo = {
                    paymentId,
                    trainerName,
                    slotName,
                    slotId,
                    trainerId,
                    packageName,
                    price,
                    classesId,
                    userName,
                    userEmail,
                    date: new Date(),
                };

                await paymentCollection.insertOne(paymentInfo);

                // Update booking count for the class
                await classCollection.updateMany(
                    { _id: {$in: classesId.map(classId =>new ObjectId(classId))} },
                    { $inc: { bookings: 1 } }
                );

                await userCollection.updateOne({ _id: new ObjectId(trainerId) }, {
                    $inc: { slots: -1 }
                })

                await userCollection.updateOne({ email: userEmail}, {
                    $set: { subscription: packageName }
                })

                res.send({ message: "Payment information saved successfully." });
            } catch (err) {
                console.error("Error saving payment info:", err);
                res.status(500).send({ error: "Internal Server Error" });
            }
        });

        // Get booking info
        app.get('/bookings/:email', async(req, res)=>{
            const userEmail = req.params.email;
            const bookingResult = await paymentCollection.findOne({userEmail})
            const slotResult = await slotCollection.findOne({_id: new ObjectId(bookingResult.slotId)})
            const trainerResult = await userCollection.findOne({_id: new ObjectId(bookingResult.trainerId)})

            const classesId = bookingResult.classesId
            const classResult = await classCollection.find({_id: {$in: classesId.map(classId=>new ObjectId(classId))}}).toArray()
            res.send({bookingResult, slotResult, trainerResult, classResult})
        })






        // ------------- Review Related APIs ---------------
        app.post('/reviews', async(req, res)=>{
            const reviewData = req.body;
            const result = await reviewCollection.insertOne(reviewData)
            res.send(result);
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