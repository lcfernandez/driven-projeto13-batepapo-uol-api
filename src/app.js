import { MongoClient } from "mongodb";
import cors from "cors";
import dayjs from "dayjs";
import dotenv from "dotenv";
import express from "express";


// instance of express
const app = express();


// configs
app.use(cors());
app.use(express.json());
dotenv.config();


// database connection
const mongoClient = new MongoClient(process.env.MONGO_URI);
let db, messagesCollection, participantsCollection;

try {
    await mongoClient.connect();
    db = mongoClient.db(process.env.MONGO_DB);

    messagesCollection = db.collection("messages");
    participantsCollection = db.collection("participants");
} catch (err) {
    console.log(err);
}


// GET functions
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

// POST functions
app.post("/messages", async (req, res) => {
    const { text, to, type } = req.body;
    const from = req.headers.user;

    if (
        !text || !to || !type || !from ||
        typeof text !== "string" || typeof to !== "string" || typeof type !== "string" ||
        !text.length || !to.length || (type !== "message" && type !== "private_message")
    ) {
        return res.sendStatus(422);
    }

    try {
        const participant = await participantsCollection.findOne({name: from});

        if (participant) {
            await messagesCollection.insertOne(
                {
                    from,
                    to,
                    text,
                    type,
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

app.post("/participants", async (req, res) => {
    const { name } = req.body;

    if (!name || typeof name !== "string" || !name.length) {
        return res.sendStatus(422);
    }

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

app.post("/status", async (req, res) => {
    const name = req.headers.user;

    if (!name) {
        return res.sendStatus(400);
    }

    try {
        const participant = await participantsCollection.findOne({name});

        if (participant) {
            await participantsCollection.updateOne({_id: participant._id}, {
                    $set: {
                        lastStatus: Date.now()
                    }
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


// app's behavior
setInterval(async () => {
    try {
        const participants = await participantsCollection.find().toArray();

        participants.forEach(async participant => {
            if (Date.now() - participant.lastStatus > 10000) {
                await participantsCollection.deleteOne({_id: participant._id});
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
app.listen(process.env.PORT, () => console.log(`Server running in port: ${process.env.PORT}`));
