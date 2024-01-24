
import express from "express";
import cors from "cors";
import Query from "./query-stream.js";

const app = express();
app.use(express.json());
app.use(cors());
const port = process.env.PORT || 5000;

app.get("/", async (req, res) => {
    res.json({ msg: "Welcome to QA" })
})

const payload = {
    model: "mistral",
    messages: []
}

app.post("/", async (req, res) => {
    console.log(req.body);
    const request = req.body;
    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
    });

    if (request.prompt === "") {
        res.send("Nothing to reply.");
    } else {
        payload.messages.push({
            role: "user",
            content: request.prompt
        })

        const answer = await Query(res, request.prompt);;

        payload.messages.push({
            role: "assistant",
            content: answer
        })
    }
    res.end();
})

// const test = async () => {
//     await Query("Tell me a abou diu");
// }

// test();



app.listen(port, () => console.log(`Server running on http://localhost:${port}`))