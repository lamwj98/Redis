let express = require('express');
// Import Mongoose
let mongoose = require('mongoose');
// Initialise the app
let app = express();
// Import Body parser
let bodyParser = require('body-parser');
// Configure bodyparser to handle post requests
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
const Redis = require('redis')
const redisClient = Redis.createClient({
    host:'localhost',
    port:6379}
)

redisClient.connect()

const DEFAULT_EXPIRATION = 3600

const Contact = require('./model.js')

mongoose.connect('mongodb://localhost/redis',
{
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
var db = mongoose.connection;

// Added check for DB connection
if(!db)
    console.log("Error connecting db")
else
    console.log("Db connected successfully")

// Setup server port
var port = 8080;

// Send message for default URL
app.get('/', (req, res) => {
    console.log(req)
    res.send('Hello World with Express')
});

app.get('/contacts', async (req, res) => {
    try {
        await redisClient.get("contacts").then((contacts) => {
            if (contacts === null) {
                Contact.get((err, contactsInner) => {
                    if (err) {
                        return res.json({
                            status: "error",
                            message: err,
                        });
                    } else {
                        redisClient.setEx("contacts",
                                          DEFAULT_EXPIRATION,
                                          JSON.stringify(contactsInner))
                        return res.json(contactsInner)
                    }
                })
            } else {
                return res.send(contacts)
            }
        })
    } catch (err) {
        return res.send("Try failed: " + err)
    }
})



app.post('/contacts', (req, res) => {
    try {
        if (req.body.name != null && req.body.email != null) {
            var contact = new Contact();
            contact.name = req.body.name;
            contact.gender = req.body.gender;
            contact.email = req.body.email;
            contact.phone = req.body.phone;


            contact.save(function (err) {
                if (err) {
                    res.json({
                        status: "error",
                        message: err,
                    });
                } else {
                    res.json({
                        status: "success",
                        message: 'New contact created!',
                        contact: contact
                    });
                }
            });
        } else {
            res.json({
                status: "error",
                message: "Missing field(s)"
            });
        }
    } catch (err) {
        return res.json({message: "error", err})
    }
})

app.post('/test', (req, res) => {
    console.log(req.body)
    return;
})

// Launch app to listen to specified port
app.listen(port, function () {
    console.log("Running RestHub on port " + port);
});