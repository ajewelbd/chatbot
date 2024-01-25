const express = require("express");
const fs = require('fs').promises;

const app = express();
app.use(express.json());
const port = process.env.PORT || 4000;


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


app.listen(port, () => console.log(`Server running on http://localhost:${port}`))