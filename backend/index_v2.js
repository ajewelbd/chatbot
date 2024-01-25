
import express from "express";
import cors from "cors";
import Query from "./query-stream.js";
import { getClients } from "./client-manage.js";
import { createVectorStore } from "./embed.js";
const fs = require('fs').promises;

const app = express();
app.use(express.json());
app.use(cors());
const port = process.env.PORT || 5000;

app.get("/", async (req, res) => {
    try {
        // Read the HTML file
        const htmlContent = await fs.readFile('index.html', 'utf8');
    
        // Set the Content-Type header to indicate that you're sending HTML
        res.setHeader('Content-Type', 'text/html');
    
        // Send the HTML content as the response
        res.send(htmlContent);
      } catch (error) {
        // Handle errors, e.g., file not found
        console.error(`Error reading HTML file: ${error.message}`);
        res.status(500).send('Internal Server Error');
      }
})

app.get("/client-list", async (req, res) => {
    const clients = await getClients();
    res.json({ clients })
})

app.post("/", async (req, res) => {
    // console.log(req.body);
    const request = req.body;
    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
    });

    if (request.prompt === "") {
        res.send("Nothing to reply.");
    } else {
        await Query(res, request);
    }
    res.end();
})

app.post("/embed", async (req, res) => {
    const request = req.body;
    // console.log(request);

    if (request.path === "") {
        res.send("Nothing to embed.");
    } else {
        await createVectorStore(request);
        res.send("Embedding successfull")
    }
    res.end();
})

app.get("/embed", async (req, res) => {
    try {
        // Read the HTML file
        const htmlContent = await fs.readFile('embed.html', 'utf8');
    
        // Set the Content-Type header to indicate that you're sending HTML
        res.setHeader('Content-Type', 'text/html');
    
        // Send the HTML content as the response
        res.send(htmlContent);
      } catch (error) {
        // Handle errors, e.g., file not found
        console.error(`Error reading HTML file: ${error.message}`);
        res.status(500).send('Internal Server Error');
      }
})

// const test = async () => {
//     await Query("Tell me a abou diu");
// }

// test();



app.listen(port, () => console.log(`Server running on http://localhost:${port}`))