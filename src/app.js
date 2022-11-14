import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import dayjs from "dayjs";
import dotenv from "dotenv";
import express from "express";
import joi from "joi";


// validation schemas
const messageSchema = joi.object(
    {
        text: joi.string().min(1).required(),
        to: joi.string().min(1).required(),
        type: joi.string().valid("message", "private_message").required()
    }
);

const participantSchema = joi.object(
    {
        name: joi.string().min(1).required()
    }
);


// instance of express
const app = express();


// configs
app.use(cors());
app.use(express.json());
dotenv.config();


// database connection
const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

try {
    await mongoClient.connect();
    console.log("MongoDB connected");

    db = mongoClient.db(process.env.MONGO_DB);
} catch (err) {
    console.log(err);
}


// database collections
const messagesCollection = db.collection("messages");
const participantsCollection = db.collection("participants");


// messages routes
app.delete("/messages/:id", async (req, res) => {
    const { user } = req.headers;
    const { id } = req.params;

    if (!user) {
        return res.sendStatus(422);
    }

    try {
        const message = await messagesCollection.findOne(
            {
                _id: new ObjectId(id)
            }
        );

        if (message) {
            if (message.from === user) {
                await messagesCollection.deleteOne(
                    {
                        _id: message._id
                    }
                );
                
                res.sendStatus(200);
            } else {
                res.sendStatus(401);
            }
        } else {
            res.sendStatus(404);
        }
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }    
});

app.get("/messages", async (req, res) => {
    const { limit } = req.query;
    const { user } = req.headers;

    try {
        const messages = await messagesCollection.find().toArray();

        res.send(
            messages
                .filter(message => {
                    if (
                        message.type === "status" || message.type === "message" ||
                        (message.type === "private_message" && (message.from === user || message.to === user))
                    ) {
                        return message;
                    }
                })
                .slice(-limit)
        );
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

app.post("/messages", async (req, res) => {
    const validation = messageSchema.validate(req.body);

    if (validation.error) {
        return res.status(422).send(
            validation.error.details.map(detail => detail.message)
        );
    }

    const from = req.headers.user;

    try {
        const participant = await participantsCollection.findOne(
            {
                name: from
            }
        );

        if (participant) {
            await messagesCollection.insertOne(
                {
                    from,
                    ...req.body,
                    time: dayjs().format("HH:mm:ss")
                }
            );

            res.sendStatus(201);
        } else {
            res.sendStatus(422);
        }
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

app.put("/messages/:id", async (req, res) => {
    const validation = messageSchema.validate(req.body);

    if (validation.error) {
        return res.status(422).send(
            validation.error.details.map(detail => detail.message)
        );
    }

    const { id } = req.params;
    const user = req.headers.user;

    if (!user) {
        return res.sendStatus(422);
    }

    try {
        const message = await messagesCollection.findOne(
            {
                _id: new ObjectId(id)
            }
        );

        if (message) {
            if (message.from === user) {
                await messagesCollection.updateOne(
                    {
                        _id: message._id
                    },
                    {
                        $set: req.body
                    }
                );
                
                res.sendStatus(200);
            } else {
                res.sendStatus(401);
            }
        } else {
            res.sendStatus(404);
        }
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});


// participants routes
app.get("/participants", async (req, res) => {
    try {
        const participants = await participantsCollection.find().toArray();

        res.send(
            participants.map(participant => {
                return {
                    name: participant.name
                };
            })
        );
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

app.post("/participants", async (req, res) => {
    const validation = participantSchema.validate(req.body);

    if (validation.error) {
        return res.status(422).send(
            validation.error.details.map(detail => detail.message)
        );
    }

    const { name } = req.body;

    try {
        const participant = await participantsCollection.findOne({name});

        if (!participant) {
            await participantsCollection.insertOne(
                {
                    name,
                    lastStatus: Date.now()
                }
            );

            await messagesCollection.insertOne(
                {
                    from: name,
                    to: "Todos",
                    text: "entra na sala...",
                    type: "status",
                    time: dayjs().format("HH:mm:ss")
                }
            );

            res.sendStatus(201);
        } else {
            res.sendStatus(409);
        }
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});


// status route
app.post("/status", async (req, res) => {
    const name = req.headers.user;

    if (!name) {
        return res.sendStatus(400);
    }

    try {
        const participant = await participantsCollection.findOne({name});

        if (participant) {
            await participantsCollection.updateOne(
                {
                    _id: participant._id
                },
                {
                    $set: {lastStatus: Date.now()}
                }
            );

            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});


// routine
setInterval(async () => {
    try {
        const participants = await participantsCollection.find().toArray();

        participants.forEach(async participant => {
            if (Date.now() - participant.lastStatus > 10000) {
                await participantsCollection.deleteOne(
                    {
                        _id: participant._id
                    }
                );

                await messagesCollection.insertOne(
                    {
                        from: participant.name,
                        to: "Todos",
                        text: "sai da sala...",
                        type: "status",
                        time: dayjs().format("HH:mm:ss")
                    }
                );
            }
        });
    } catch (err) {
        console.log(err);
    }
}, 15000);


// starts the server
app.listen(process.env.SERVER_PORT || 5000, () => console.log(`Server running in port: ${process.env.SERVER_PORT || "5000"}`));
