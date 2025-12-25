import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // GitHub Pages 部署配置
    // 重要：请根据你的 GitHub 仓库名修改这里的 base 路径
    // 如果仓库名是 bunny-match-3，base 就是 '/bunny-match-3/'
    // 如果使用自定义域名，base 应该是 '/'
    // GitHub Actions 会自动从环境变量获取仓库名
    const repoName = process.env.GITHUB_REPOSITORY 
      ? process.env.GITHUB_REPOSITORY.split('/')[1]
      : 'bunny-match-3-pro'; // 默认仓库名，如果不同请修改这里
    
    // 生产环境（GitHub Pages）使用仓库名作为 base，开发环境使用根路径
    const base = (mode === 'production' && process.env.GITHUB_ACTIONS) 
      ? `/${repoName}/`
      : '/';
    
    return {
      base: base,
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        rollupOptions: {
          output: {
            // 添加时间戳到文件名，确保缓存更新
            entryFileNames: `assets/[name].[hash].js`,
            chunkFileNames: `assets/[name].[hash].js`,
            assetFileNames: `assets/[name].[hash].[ext]`
          }
        }
      }
    };
});
