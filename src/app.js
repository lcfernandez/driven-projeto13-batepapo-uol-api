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


// POST functions
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
