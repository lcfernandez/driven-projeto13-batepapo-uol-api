import cors from "cors";
import express from "express";


// instance of express

const app = express();


// configs

app.use(cors());
app.use(express.json());


// global variables


// GET functions


// POST functions


// auxiliary functions


// starts the server

app.listen(5000, () => console.log(`Server running in port: 5000`));
