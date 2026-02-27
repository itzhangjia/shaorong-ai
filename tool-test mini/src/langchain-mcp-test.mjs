import "dotenv/config";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatOpenAI } from "@langchain/openai";
import chalk from "chalk";
import { HumanMessage, ToolMessage } from "@langchain/core/messages";

const model = new ChatOpenAI({
  model: process.env.MODEL,
  apiKey: process.env.API_KEY,
  configuration: {
    baseURL: process.env.BASE_URL,
  },
});

const mcpClient = new MultiServerMCPClient({
  mcpServers: {
    "my-mcp-server": {
      command: "node",
      args: [
        "/Users/itzhangjiayang/马力前端/shaorong-ai/tool-test mini/src/my-mcp-server.mjs",
      ],
    },
  },
});

const tools = await mcpClient.getTools();
const modelWithTools = model.bindTools(tools);
async function runAgentWithTools(query, maxIterations = 30) {
  const messages = [new HumanMessage(query)];
  for (let i = 0; i < maxIterations; i++) {
    console.log(`迭代次数: ${i},正在等待AI思考...`);
    const response = await modelWithTools.invoke(messages);
    if (!response.tool_calls || response.tool_calls.length === 0) {
      console.log(chalk.bgGreen(`AI思考完成，返回结果: ${response.content}`));
      return response.content;
    }
    messages.push(response);
    console.log(`监测到 ${response.tool_calls?.length ?? 0} 个工具调用`);
    console.log(
      `工具调用: ${response.tool_calls?.map((toolCall) => toolCall.name).join(",")}`,
    );
    // 执行工具调用
    for (let i = 0; i < response.tool_calls?.length; i++) {
      const foundTool = tools.find(
        (tool) => tool.name === response.tool_calls[i].name,
      );
      if (foundTool) {
        const toolResult = await foundTool.invoke(response.tool_calls[i].args);
        messages.push(
          new ToolMessage({
            content: toolResult,
            tool_call_id: response.tool_calls[i].id,
          }),
        );
      }
    }
  }
  return messages[messages.length - 1]?.content;
}

await runAgentWithTools("请查询用户ID为001的用户信息");
