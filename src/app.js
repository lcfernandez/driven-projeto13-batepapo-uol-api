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
let db;

try {
    await mongoClient.connect();
    db = mongoClient.db(process.env.MONGO_DB);
} catch (err) {
    console.log(err)
}


// global variables


// auxiliary functions


// GET functions
app.get("/messages", async (req, res) => {
    const { limit } = req.query;
    const { user } = req.headers;

    try {
        const messages = await db.collection("messages").find().toArray();

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
        res.status(500).send(err);
    }
});

app.get("/participants", async (req, res) => {
    try {
        const participants = await db.collection("participants").find().toArray();

        res.send(
            participants.map(participant => {
                return {
                    name: participant.name
                };
            })
        );
    } catch (err) {
        res.status(500).res(err);
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
        const participant = await db.collection("participants").findOne({name: from});

        if (participant) {
            await db.collection("messages").insertOne(
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
        res.status(500).send(err);
    }
});

app.post("/participants", async (req, res) => {
    const { name } = req.body;

    if (!name || typeof name !== "string" || !name.length) {
        return res.sendStatus(422);
    }

    try {
        const participant = await db.collection("participants").findOne({name});

        if (!participant) {
            await db.collection("participants").insertOne(
                {
                    name,
                    lastStatus: Date.now()
                }
            );

            await db.collection("messages").insertOne(
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
        res.status(500).send(err);
    }
});

app.post("/status", async (req, res) => {
    const name = req.headers.user;

    if (!name) {
        return res.sendStatus(400);
    }

    try {
        const participant = db.collection("participants").findOne({name});

        if (participant) {
            // TODO: update lastStatus
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    } catch (err) {
        res.status(500).send(err);
    }
});


// starts the server
app.listen(process.env.PORT, () => console.log(`Server running in port: ${process.env.PORT}`));
