/**
 * 生产环境密钥优先从「仓库外」读取，避免 git pull / 重装目录时覆盖密码：
 *   /var/data/blog.env
 * 可通过环境变量 BLOG_SECRETS_FILE 指定其它路径。
 *
 * 合并顺序：项目内 .env.production < 外置文件（外置覆盖本地）。
 * Next.js 文档：已存在于 process.env 的变量不会被 .env 文件覆盖。
 */
const fs = require("fs");
const path = require("path");

function parseEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const cwd = __dirname;
const externalPath = process.env.BLOG_SECRETS_FILE || "/var/data/blog.env";
const localProduction = path.join(cwd, ".env.production");

const mergedEnv = {
  ...parseEnvFile(localProduction),
  ...parseEnvFile(externalPath),
};

module.exports = {
  apps: [
    {
      name: "blog",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: __dirname,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        ...mergedEnv,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
    },
  ],
};
