import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";
import {
  readFileTool,
  writeFileTool,
  executeCommandTool,
  listDirectoryTool,
} from "./all-tools.mjs";
import {
  SystemMessage,
  HumanMessage,
  ToolMessage,
} from "@langchain/core/messages";
import chalk from "chalk";
dotenv.config();
const model = new ChatOpenAI({
  model: process.env.MODEL,
  apiKey: process.env.API_KEY,
  configuration: {
    baseURL: process.env.BASE_URL,
  },
});
const tools = [
  readFileTool,
  writeFileTool,
  executeCommandTool,
  listDirectoryTool,
];
const modelWithTools = model.bindTools(tools);

async function runAgentWithTools(query, maxIterations = 30) {
  const messages = [
    new SystemMessage(`你是一个项目管理助手，必须通过调用工具完成任务，禁止只输出步骤或计划。
        每一步都要实际调用对应工具，不要用文字或 JSON 描述步骤。
        当前工作目录：${process.cwd()}
        工具：
        1. read_file: 读取文件内容
        2. write_file: 写入文件内容
        3. execute_command: 执行命令
        4. list_directory: 列出目录
        重要规则 -execute_command:
        -workingDirectory: 工作目录，默认为当前目录
        -当使用 workingDirectory时,不要在command中cd
        -错误示例:{
        "command": "cd src && npm install",
        "workingDirectory": "src"
        }
        这是错误的因为已经在workingDirectory中，不要在command中cd
        -正确示例:{
        "command": "npm install",
        "workingDirectory": "src"
        }
        这是正确的因为workingDirectory是当前目录，command是npm install
        回复要简洁，只说做了什么
        `),
    new HumanMessage(query),
  ];
  for (let i = 0; i < maxIterations; i++) {
    console.log(`迭代次数: ${i},正在等待AI思考...`);

    const response = await modelWithTools.invoke(messages);
    messages.push(response);
    if (!response.tool_calls || response.tool_calls.length === 0) {
      console.log(chalk.bgGreen(`AI思考完成，返回结果: ${response.content}`));
      return response.content;
    }
    if (response.tool_calls && response.tool_calls.length > 0) {
      for (const toolCall of response.tool_calls) {
        const tool = tools.find((tool) => tool.name === toolCall.name);
        if (!tool) continue;
        const toolResult = await tool.invoke(toolCall.args);
        messages.push(
          new ToolMessage({
            content: String(toolResult),
            tool_call_id: toolCall.id,
          }),
        );
      }
    }
  }
  return messages[messages.length - 1]?.content ?? "未完成";
}
const case1 = `1.创建项目: echo -e'n\nn' |pnpm create vite react-ts --template react-ts
2.修改src/App.tsx文件，实现一个简单的todolist
3.修改复杂样式 渐变色背景 按钮样式 字体样式 图片样式 等等 所有的样式放到css文件中
4.添加动画
5.列出目录确定
注意：使用pnpm ,功能需要保证完整，样式要美观，要有动画效果
之后在使用 pnpm install 安装依赖
pnpm dev 启动项目
`;
try {
  runAgentWithTools(case1);
} catch (error) {
  console.error(`运行失败: ${error}`);
}
