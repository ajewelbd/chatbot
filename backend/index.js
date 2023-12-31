const express = require("express");
const http = require("http");
const cors = require("cors");
const Ollama = require("ollama-node").Ollama;

const app = express();
app.use(express.json());
app.use(cors());
const port = process.env.PORT || 5000;


const ollama = new Ollama();
const setModel = async () => await ollama.setModel("mistral");
setModel();
ollama.setSystemPrompt("You are an AI assistant.");

const printword = (word) => {
    process.stdout.write(word);
}

app.get("/", async (req, res) => {
    // const result = await ollama.streamingGenerate("why is the sky blue?", printword)
    // console.log(result)
    const text = await getResponssNew();
    res.json({ msg: text })
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

        const answer = await getResponssNew(payload, res);

        payload.messages.push({
            role: "assistant",
            content: answer
        })
    }
    res.end();
})

const getResponss = async (prompt, res) => {
    return new Promise((resolve, reject) => {
        try {
            ollama.streamingGenerate(prompt, (responseAsChunk) => {
                res.write(responseAsChunk)
            }, null, (r) => {
                const response = JSON.parse(r);
                if (response.done) resolve();
            })
        } catch (e) {
            reject("Internal Error");
        }
    })
}

const getResponssNew = async (payload, res) => {
    console.log(payload)
    
    return new Promise((resolve, reject) => {
        let typingText = "";

        try {
            fetch('http://localhost:11434/api/chat', {
                method: "POST",
                body: JSON.stringify(payload),
                headers: {
                    "Content-Type": "application/json"
                }
            }).then((response) => {
                const reader = response.body?.getReader();

                if (reader) {
                    const processChunk = ({ done, value }) => {
                        if (done) {
                            // Stream has ended
                            resolve(typingText);
                            return;
                        }

                        // Decode the Uint8Array to a string
                        const textDecoder = new TextDecoder('utf-8');

                        const r = JSON.parse(textDecoder.decode(value));
                        typingText += r.message.content;
                        res.write(r.message.content)

                        // Continue to the next chunk
                        reader.read().then(processChunk);
                    };

                    // Start reading the stream
                    reader.read().then(processChunk);
                }
            })
            } catch (error) {
                reject("Error")
            }
    })
}


app.listen(port, () => console.log(`Server running on http://localhost:${port}`))