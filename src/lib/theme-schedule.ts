/** 未手动选主题时：按用户本机时钟（与系统时区一致）决定亮/暗 */
export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 18;

export function getAutoThemeFromLocalTime(): "light" | "dark" {
  const h = new Date().getHours();
  return h >= DAY_START_HOUR && h < DAY_END_HOUR ? "light" : "dark";
}
