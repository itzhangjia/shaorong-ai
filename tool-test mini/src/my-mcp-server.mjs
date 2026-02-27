import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const dataBase = {
  users: {
    "001": {
      id: "001",
      name: "张三",
      age: 20,
      email: "zhangsan@example.com",
      role: "admin",
    },
    "002": {
      id: "002",
      name: "李四",
      age: 21,
      email: "lisi@example.com",
      role: "user",
    },
    "003": {
      id: "003",
      name: "王五",
      age: 22,
      email: "wangwu@example.com",
      role: "user",
    },
  },
};

const server = new McpServer({
  name: "my-mcp-server",
  version: "1.0.0",
});

server.registerTool(
  "get_user",
  {
    description: "获取用户信息",
    inputSchema: {
      userId: z.string().describe("用户ID"),
    },
  },
  async ({ userId }) => {
    const user = dataBase.users[userId];
    if (!user) {
      return {
        content: [
          {
            type: "text",
            text: "用户不存在",
          },
        ],
      };
    }
    return {
      content: [
        {
          type: "text",
          text: `用户信息: ID: ${user.id}, 姓名: ${user.name}, 年龄: ${user.age}, 邮箱: ${user.email}, 角色: ${user.role}`,
        },
      ],
    };
  },
);

server.registerResource(
  "使用指南",
  "docs://guide",
  {
    description: "使用指南",
    mimeType: "text/plain",
  },
  async () => {
    return {
      contents: [
        {
          url: "docs://guide",
          mimeType: "text/plain",
          text: `Mcp server 使用指南 
          功能:提供用户查询等工具。
          使用：在cursor等Mcp Client 中通过自然语言对话，Cursor 会自动调用相关工具。`,
        },
      ],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
