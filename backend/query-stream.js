import { formatDocumentsAsString } from "langchain/util/document";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RetrievalQAChain, loadQAStuffChain } from "langchain/chains";
// import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import { Ollama } from "@langchain/community/llms/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import * as fs from "fs";

const getVectorStore = async () => {
    let vectorStore;
    const dbName = "notredame"
    const VECTOR_STORE_PATH = `./db/${dbName}.index`;

    if (fs.existsSync(VECTOR_STORE_PATH)) {
        vectorStore = await HNSWLib.load(
            VECTOR_STORE_PATH,
            new HuggingFaceTransformersEmbeddings()
        );
    } else {
        const path = "./documents/notredame.txt"
        // const loader = new CheerioWebBaseLoader(
        //     "https://daffodilvarsity.edu.bd/department/cse/program/bsc-in-cse"
        // );

        const loader = new TextLoader(path);

        const docs = await loader.load();
        const splitter = new RecursiveCharacterTextSplitter({
            chunkOverlap: 0,
            chunkSize: 1000,
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

const Query = async (res, _question) => {
    console.log(_question);
    const vectorStore = await getVectorStore();
    const retriever = vectorStore.asRetriever();

    // Llama 2 7b wrapped by Ollama
    const model = new Ollama({
        baseUrl: "http://localhost:11434",
        model: "mistral",
    });

    // const template = `Use the following pieces of context to answer the question at the end.
    // If you don't know the answer, just say that you don't know, don't try to make up an answer.
    // Use three sentences maximum and keep the answer as concise as possible.
    // Always say "thanks for asking!" at the end of the answer.
    // {context}
    // Question: {question}
    // Helpful Answer:`;

    // const QA_CHAIN_PROMPT = new PromptTemplate({
    //     inputVariables: ["context", "question"],
    //     template,
    // });

    // Create a retrieval QA chain that uses a Llama 2-powered QA stuff chain with a custom prompt.
    // const chain = new RetrievalQAChain({
    //     combineDocumentsChain: loadQAStuffChain(model, { prompt: QA_CHAIN_PROMPT }),
    //     retriever,
    //     returnSourceDocuments: true,
    //     inputKey: "question",
    // });

    // const response = await chain.call({
    //     question: _question,
    // });

    const questionPrompt = PromptTemplate.fromTemplate(
        `Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer.
      ----------
      CONTEXT: {context}
      ----------
      CHAT HISTORY: {chatHistory}
      ----------
      QUESTION: {question}
      ----------
      Helpful Answer:`
    );

    const chain = RunnableSequence.from([
        {
            question: (input) =>
                input.question,
            chatHistory: (input) =>
                input.chatHistory ?? "",
            context: async (input) => {
                const relevantDocs = await retriever.getRelevantDocuments(input.question);
                const serialized = formatDocumentsAsString(relevantDocs);
                return serialized;
            },
        },
        questionPrompt,
        model,
        new StringOutputParser(),
    ]);

    // console.log(response);

    const stream = await chain.stream({
        question: _question,
    });

    let streamedResult = "";
    for await (const chunk of stream) {
        streamedResult += chunk;
        res.write(chunk);
        // console.log(streamedResult);
    }
    return streamedResult;
}

// run("How much cgpa needed for admission?");

export default Query;