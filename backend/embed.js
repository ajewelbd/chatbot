import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import * as fs from "fs";
import { createClient } from "./client-manage.js";

const getVectorStore = async (dbName) => {
    const path = `./db/${dbName}.index`;

    if (fs.existsSync(path)) {
        return await HNSWLib.load(
            path,
            new HuggingFaceTransformersEmbeddings()
        );
    } else return null;
}

const createVectorStore = async ({client, type, path}) => {
    let docs;

    if(type == "text") {
        docs = path;
        await saveSourceAsText(client, path)
    } else {
        let loader;
        if(type == "url") loader = new CheerioWebBaseLoader(path);
        else loader = new TextLoader(`documents/${path}`);

        docs = await loader.load();
    }

    const splitter = new RecursiveCharacterTextSplitter({
        chunkOverlap: 0,
        chunkSize: 1000,
    });

    const splitDocuments = type == "text" ? await splitter.createDocuments([docs]) : await splitter.splitDocuments(docs);

    const vectorStore = await HNSWLib.fromDocuments(
        splitDocuments,
        new HuggingFaceTransformersEmbeddings()
    );
    const dbName = `./db/${client}.index`;
    await vectorStore.save(dbName);
    await createClient(client);
}

const saveSourceAsText = (client, text) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(`./documents/${client}.txt`, text, 'utf8', (err) => {
            if (err) {
                console.error(`Error writing file: ${err}`);
                reject();
            }
    
            resolve('Client added successfully.');
        });
    })
}

export { getVectorStore, createVectorStore};