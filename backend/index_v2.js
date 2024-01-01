
import express from "express";
import cors from "cors";
import Query from "./query.js";

const app = express();
app.use(express.json());
app.use(cors());
const port = process.env.PORT || 5000;

app.get("/", async (req, res) => {
    res.json({ msg: "Welcome to QA" })
})

app.post("/", async (req, res) => {
    console.log(req.body);
    const { prompt } = req.body;


    if (prompt === "") {
        res.send("Nothing to reply.");
    } else {
        const response = await Query(prompt);
        res.send(response)
    }

    res.end();
})



app.listen(port, () => console.log(`Server running on http://localhost:${port}`))