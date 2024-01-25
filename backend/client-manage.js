import * as fs from "fs";

const filePath = 'clients.txt';

const getClients = () => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error(`Error reading file: ${err}`);
                resolve([]);
            }

            resolve(data.split(" "))
        });
    })
}


const createClient = (name) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error(`Error reading file: ${err}`);
                reject();
            }
        

            const updatedContent = `${data}${name} `;
        
            // Write the updated content back to the file
            fs.writeFile(filePath, updatedContent, 'utf8', (err) => {
                if (err) {
                    console.error(`Error writing file: ${err}`);
                    reject();
                }
        
                resolve('Client added successfully.');
            });
        });
    })
}

export { getClients, createClient };