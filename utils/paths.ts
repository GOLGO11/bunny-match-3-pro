/**
 * 获取资源路径，自动处理 GitHub Pages 的 base 路径
 */
export function getAssetPath(path: string): string {
  // 移除开头的斜杠（如果有）
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  // 获取 base URL（Vite 会自动注入）
  const base = import.meta.env.BASE_URL || '/';
  // 确保 base 以斜杠结尾
  const baseWithSlash = base.endsWith('/') ? base : `${base}/`;
  return `${baseWithSlash}${cleanPath}`;
}

