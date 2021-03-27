const express = require("express");
const { query } = require("express");
const cors = require('cors');
const admin = require("firebase-admin");
const serviceAccount = require("./config/burj-al-arab-development-firebase-adminsdk-itzng-21dc47b6f5.json");
const MongoClient = require("mongodb").MongoClient;
require("dotenv").config();
const port = 5000;
const uri =
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ykse1.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const app = express();
app.use(cors());
app.use(express.json());


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect((err) => {
    const bookingsCollection = client.db("burjAlArab").collection("bookings");
    
    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        bookingsCollection.insertOne(newBooking)
        .then(result => {
            res.send(result.insertedCount > 0)
        })
        console.log(newBooking);
    });

    app.get('/bookings', (req, res) => {
        const bearer = req.headers.authorization;
        if(bearer && bearer.startsWith('Bearer ')){
            const idToken = bearer.split(" ")[1];
            admin
                .auth()
                .verifyIdToken(idToken)
                .then((decodedToken) => {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    console.log(tokenEmail, queryEmail);
                    if (tokenEmail === queryEmail) {
                        bookingsCollection.find({ email: queryEmail }).toArray((err, documents) => {
                            res.send(documents);
                        });
                    } else {
                        res.status(401).send("you are unauthorized!!!!");
                    }
                })
                .catch((error) => {
                    res.status(401).send("you are unauthorized!!!!");
                });
        } else {
            res.status(401).send('you are unauthorized!!!!')
        }
    })
});




app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
