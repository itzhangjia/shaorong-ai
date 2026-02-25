import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";
dotenv.config();
const model = new ChatOpenAI({
  model: process.env.MODEL,
  apiKey: process.env.API_KEY,
  configuration: {
    baseURL: process.env.BASE_URL,
  },
});
const response = await model.invoke("介绍一下自己");
console.log(response.content);
