import { tool } from "@langchain/core/tools";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { z } from "zod";

// 读取文件工具
const readFileTool = tool(
  async ({ filePath }) => {
    const content = await fs.readFile(filePath, "utf-8");
    return content;
  },
  {
    name: "read_file",
    description: "读取文件内容",
    schema: z.object({ filePath: z.string().describe("文件路径") }),
  },
);

// 写入文件工具
const writeFileTool = tool(
  async ({ filePath, content }) => {
    try {
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, content, "utf-8");
      console.log(`工具调用: write_file 写入文件: ${filePath}`);
      return `文件写入成功: ${filePath}`;
    } catch (error) {
      console.error(`工具调用: write_file 写入文件失败: ${filePath}`, error);
      return `文件写入失败: ${error.message}`;
    }
  },

  {
    name: "write_file",
    description: "向指定路径写入文件内容，自动创建目录",
    schema: z.object({
      filePath: z.string().describe("文件路径"),
      content: z.string().describe("文件内容"),
    }),
  },
);

// 执行命令工具
const executeCommandTool = tool(
  async ({ command, workingDirectory }) => {
    const cwd = workingDirectory || process.cwd();
    console.log(
      `工具调用: execute_command 执行命令: ${command} 工作目录: ${cwd}`,
    );
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(" ");
      const child = spawn(cmd, args, { cwd, stdio: "inherit", shell: true });
      let errorMsg = "";
      child.on("error", (err) => {
        errorMsg = err.message;
      });
      const cwdInfo = workingDirectory ? ` 工作目录: ${workingDirectory}` : "";
      child.on("close", (code) => {
        if (code === 0) {
          console.log(`工具调用成功 executeCommandTool， command: ${command}`);
          resolve(`命令执行成功: ${command}${cwdInfo}`);
        } else {
          console.log(
            `工具调用失败 executeCommandTool， command: ${command}`,
            errorMsg,
          );
          reject(new Error(`命令执行失败: ${command}${cwdInfo} ${errorMsg}`));
        }
      });
    });
  },
  {
    name: "execute_command",
    description: "执行命令",
    schema: z.object({
      command: z.string().describe("命令"),
      workingDirectory: z.string().describe("工作目录").optional(),
    }),
  },
);

// 列出目录工具
const listDirectoryTool = tool(
  async ({ directory }) => {
    try {
      const files = await fs.readdir(directory);
      console.log(`工具调用: list_directory 列出目录: ${directory}`, files);
      return `目录列表:\n${files.join("\n")}`;
    } catch (error) {
      console.error(
        `工具调用: list_directory 列出目录失败: ${directory}`,
        error,
      );
      return `目录列表失败: ${error.message}`;
    }
  },
  {
    name: "list_directory",
    description: "列出目录下的文件和目录",
    schema: z.object({ directory: z.string().describe("目录") }),
  },
);
export { readFileTool, writeFileTool, executeCommandTool, listDirectoryTool };
