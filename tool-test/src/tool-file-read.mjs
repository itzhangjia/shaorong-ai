import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import {
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { z } from "zod";
import fs from "node:fs/promises";

const model = new ChatOpenAI({
  modelName: process.env.MODEL,
  apiKey: process.env.API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.BASE_URL,
  },
});

const readFiletool = tool(
  async ({ filePath }) => {
    const content = await fs.readFile(filePath, "utf-8");
    return `文件内容: ${content}`;
  },
  {
    name: "read_file",
    description: "用此工具读取文件内容",
    schema: z.object({ filePath: z.string().describe("文件路径") }),
  },
);
const tools = [readFiletool];
const modelWithTools = model.bindTools(tools);
const messages = [
  new SystemMessage(`你是文件阅读助手，请用此工具读取文件内容。
        工作流程：
        1. 用户要求读取文件时，立即调用 read_file 工具读取文件内容
        2.等待工具返回结果
        3.基于文件内容进行分析和解释
        可用工具：
        read_file: 读取文件内容(使用此工具读取文件内容)

    `),
  new HumanMessage("请读取 src/tool-file-read.mjs 文件内容并解释代码"),
];
let response = await modelWithTools.invoke(messages);
messages.push(response);
while (response.tool_calls && response.tool_calls.length > 0) {
  const toolResults = await Promise.all(
    response.tool_calls.map(async (toolCall) => {
      const tool = tools.find((tool) => tool.name === toolCall.name);
      if (!tool) {
        return `工具 ${toolCall.name} 不存在`;
      }
      try {
        return await tool.invoke(toolCall.args);
      } catch (error) {
        return `工具 ${toolCall.name} 调用失败: ${error.message}`;
      }
    }),
  );
  response.tool_calls.forEach((toolCall, index) => {
    messages.push(
      new ToolMessage({
        content: toolResults[index],
        tool_call_id: toolCall.id,
      }),
    );
  });

  response = await modelWithTools.invoke(messages);

  messages.push(response);
}

console.log(`最终回复: ${response.content}`);
