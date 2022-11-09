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

mongoClient
    .connect()
    .then(() => db = mongoClient.db(process.env.MONGO_DB))
    .catch(err => console.log(err));


// global variables


// auxiliary functions


// GET functions
app.get("/messages", (req, res) => {
    const { limit } = req.query;
    const { user } = req.headers;

    db
        .collection("messages")
        .find()
        .toArray()
        .then(resDB => {
            res.send(
                resDB
                    .filter(message => {
                        if (
                            message.type === "status" || message.type === "message" ||
                            (message.type === "private_message" && (message.from === user || message.to === user))
                        ) {
                            return message;
                        }
                    })
                    .slice(-limit)
            )
        })
        .catch(err => res.status(500).send(err));
});

app.get("/participants", (req, res) => {
    db
        .collection("participants")
        .find()
        .toArray()
        .then(resDB => {
            res.send(
                resDB.map(participant => {
                    return {
                        name: participant.name
                    };
                })
            )
        })
        .catch(err => res.status(500).res(err));
});

// POST functions
app.post("/messages", (req, res) => {
    const { text, to, type } = req.body;
    const from = req.headers.user;

    if (
        !text || !to || !type || !from ||
        typeof text !== "string" || typeof to !== "string" || typeof type !== "string" ||
        !text.length || !to.length || (type !== "message" && type !== "private_message")
    ) {
        return res.sendStatus(422);
    }

    db
        .collection("participants")
        .findOne({name: from})
        .then(resDB => {
            if (resDB) {
                db
                    .collection("messages")
                    .insertOne(
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
        })
        .catch(err => res.status(500).send(err));
});

app.post("/participants", (req, res) => {
    const { name } = req.body;

    if (!name || typeof name !== "string" || !name.length) {
        return res.sendStatus(422);
    }

    db
        .collection("participants")
        .findOne({name})
        .then(resDB => {
            if (!resDB) {
                db
                    .collection("participants")
                    .insertOne(
                        {
                            name,
                            lastStatus: Date.now()
                        }
                    );

                db
                    .collection("messages")
                    .insertOne(
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
        })
        .catch(err => res.status(500).send(err));
});


// starts the server
app.listen(process.env.PORT, () => console.log(`Server running in port: ${process.env.PORT}`));
