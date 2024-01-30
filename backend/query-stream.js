import { formatDocumentsAsString } from "langchain/util/document";
import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { Ollama } from "@langchain/community/llms/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { getVectorStore } from "./embed.js";

const Query = async (res, payload) => {
    // console.log(payload);
    const vectorStore = await getVectorStore(payload.client);

    if(!vectorStore) {
        res.write("Sorry! No source found. Please contact with site admin");
        return;
    }

    const retriever = vectorStore.asRetriever();

    // mistral wrapped by Ollama
    // const model = new Ollama({
    //     baseUrl: "http://localhost:11434",
    //     model: "phi",
    // });

    const model = new ChatOpenAI({
        openAIApiKey: "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"
    });

    const questionPrompt = PromptTemplate.fromTemplate(
        `You are an AI assistant of Notre Dame University. Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer. Keep the answer as concise as possible.
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

    const stream = await chain.stream({
        question: payload.question,
    });

    let streamedResult = "";
    for await (const chunk of stream) {
        streamedResult += chunk;
        res.write(chunk);
        // console.log(streamedResult);
    }

    return true;
}

export default Query;