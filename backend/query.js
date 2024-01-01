import { RetrievalQAChain, loadQAStuffChain } from "langchain/chains";
import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { HNSWLib } from "langchain/vectorstores/hnswlib";
import { Ollama } from "langchain/llms/ollama";
import { PromptTemplate } from "langchain/prompts";
import { HuggingFaceTransformersEmbeddings } from "langchain/embeddings/hf_transformers";
import fs from 'fs';

const getVectorStore = async () => {
    let vectorStore;
    const VECTOR_STORE_PATH = "./db/Documents.index";

    if (fs.existsSync(VECTOR_STORE_PATH)) {
        vectorStore = await HNSWLib.load(
            VECTOR_STORE_PATH,
            new HuggingFaceTransformersEmbeddings()
        );
    } else {
        const loader = new CheerioWebBaseLoader(
            "https://daffodilvarsity.edu.bd/department/cse/program/bsc-in-cse"
        );

        const docs = await loader.load();
        const splitter = new RecursiveCharacterTextSplitter({
            chunkOverlap: 0,
            chunkSize: 500,
        });

        const splitDocuments = await splitter.splitDocuments(docs);

        vectorStore = await HNSWLib.fromDocuments(
            splitDocuments,
            new HuggingFaceTransformersEmbeddings()
        );

        await vectorStore.save(VECTOR_STORE_PATH);
    }

    return vectorStore;
}

const Query = async (_question) => {
    const vectorStore = await getVectorStore();
    const retriever = vectorStore.asRetriever();

    // Llama 2 7b wrapped by Ollama
    const model = new Ollama({
        baseUrl: "http://localhost:11434",
        model: "mistral",
    });

    const template = `Use the following pieces of context to answer the question at the end.
    If you don't know the answer, just say that you don't know, don't try to make up an answer.
    Use three sentences maximum and keep the answer as concise as possible.
    Always say "thanks for asking!" at the end of the answer.
    {context}
    Question: {question}
    Helpful Answer:`;

    const QA_CHAIN_PROMPT = new PromptTemplate({
        inputVariables: ["context", "question"],
        template,
    });

    // Create a retrieval QA chain that uses a Llama 2-powered QA stuff chain with a custom prompt.
    const chain = new RetrievalQAChain({
        combineDocumentsChain: loadQAStuffChain(model, { prompt: QA_CHAIN_PROMPT }),
        retriever,
        returnSourceDocuments: true,
        inputKey: "question",
    });

    const response = await chain.call({
        question: _question,
    });

    // console.log(response);
    return response.text;
}

// run("How much cgpa needed for admission?");

export default Query;