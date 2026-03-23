/**
 * 管理员密码可持久化到服务器文件（哈希存储），便于在后台自助修改，
 * 无需改 .env。会话签名使用独立 sessionSecret，改密后旧 Cookie 失效。
 */
import fs from "fs";
import path from "path";
import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "crypto";

export interface AdminCredentialFile {
  version: 1;
  /** scrypt 输出 hex */
  passwordHash: string;
  /** salt hex */
  salt: string;
  /** 会话 HMAC 密钥（与登录密码分离） */
  sessionSecret: string;
  updatedAt: string;
}

function getCredentialsPath(): string {
  const fromEnv = process.env.ADMIN_PASSWORD_FILE?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "development") {
    return path.join(process.cwd(), ".data", "admin-credentials.json");
  }
  return "/var/data/blog-admin.json";
}

function ensureDirForFile(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readStored(): AdminCredentialFile | null {
  const p = getCredentialsPath();
  try {
    if (!fs.existsSync(p)) return null;
    const raw = JSON.parse(fs.readFileSync(p, "utf8")) as AdminCredentialFile;
    if (
      raw?.version === 1 &&
      typeof raw.passwordHash === "string" &&
      typeof raw.salt === "string" &&
      typeof raw.sessionSecret === "string"
    ) {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function hashPassword(plain: string, saltHex: string): Buffer {
  const salt = Buffer.from(saltHex, "hex");
  return scryptSync(plain.normalize("NFKC"), salt, 64);
}

/** 若存在凭证文件，用其校验密码 */
export function verifyPasswordAgainstFile(plain: string): boolean {
  const stored = readStored();
  if (!stored) return false;
  try {
    const expected = Buffer.from(stored.passwordHash, "hex");
    const actual = hashPassword(plain.trim(), stored.salt);
    if (expected.length !== actual.length) return false;
    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

/** 会话签名：优先 ADMIN_SECRET，其次凭证文件中的 sessionSecret，最后 ADMIN_PASSWORD */
export function getSessionSecretForSigning(): string {
  const envSecret = process.env.ADMIN_SECRET?.trim();
  if (envSecret && envSecret.length >= 8) return envSecret;

  const stored = readStored();
  if (stored?.sessionSecret && stored.sessionSecret.length >= 32) {
    return stored.sessionSecret;
  }

  const pwd = process.env.ADMIN_PASSWORD?.trim();
  if (pwd && pwd.length >= 8) return pwd;

  if (process.env.NODE_ENV === "development") {
    return "dev-secret-change-in-production";
  }

  throw new Error("请设置 ADMIN_PASSWORD 或 ADMIN_SECRET，或在后台初始化管理员密码文件");
}

export function hasCredentialFile(): boolean {
  return readStored() !== null;
}

export function changeAdminPassword(
  oldPassword: string,
  newPassword: string
): { ok: true } | { ok: false; error: string } {
  const trimmed = newPassword.trim();
  if (trimmed.length < 8) {
    return { ok: false, error: "新密码至少 8 位" };
  }

  const stored = readStored();
  const envPwd = process.env.ADMIN_PASSWORD?.trim();

  if (stored) {
    if (!verifyPasswordAgainstFile(oldPassword)) {
      return { ok: false, error: "当前密码错误" };
    }
  } else {
    if (!envPwd) {
      return { ok: false, error: "服务器未配置初始管理员密码" };
    }
    if (oldPassword.trim() !== envPwd) {
      return { ok: false, error: "当前密码错误" };
    }
  }

  const salt = randomBytes(16).toString("hex");
  const passwordHash = hashPassword(trimmed, salt).toString("hex");
  const sessionSecret = randomBytes(32).toString("hex");

  const payload: AdminCredentialFile = {
    version: 1,
    passwordHash,
    salt,
    sessionSecret,
    updatedAt: new Date().toISOString(),
  };

  const filePath = getCredentialsPath();
  try {
    ensureDirForFile(filePath);
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), {
      mode: 0o600,
    });
  } catch (e) {
    return {
      ok: false,
      error: `写入失败: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  return { ok: true };
}
