import { MongoClient } from "mongodb";
import cors from "cors";
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

mongoClient.connect().then(() => {
	db = mongoClient.db(process.env.MONGO_DB);
});


// global variables


// auxiliary functions


// GET functions


// POST functions


// starts the server
app.listen(process.env.PORT, () => console.log(`Server running in port: ${process.env.PORT}`));
