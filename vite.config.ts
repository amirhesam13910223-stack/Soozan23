import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function preventHmrReloadPlugin(): Plugin {
  return {
    name: 'prevent-hmr-reload',
    transformIndexHtml: {
      order: 'pre',
      handler() {
        return [
          {
            tag: 'script',
            children: `
              // AI Studio Sandbox: Neutralize Vite WebSocket disconnect reload loops
              (function() {
                try {
                  const OrigWebSocket = window.WebSocket;
                  if (OrigWebSocket) {
                    window.WebSocket = function(url, protocols) {
                      const urlStr = String(url || '');
                      const protoStr = String(protocols || '');
                      if (urlStr.includes('vite') || protoStr.includes('vite')) {
                        const target = new EventTarget();
                        target.readyState = 1;
                        target.send = function() {};
                        target.close = function() {};
                        setTimeout(function() {
                          target.dispatchEvent(new Event('open'));
                        }, 10);
                        return target;
                      }
                      return new OrigWebSocket(url, protocols);
                    };
                    window.WebSocket.prototype = OrigWebSocket.prototype;
                  }
                } catch (e) {
                  // ignore
                }
              })();
            `,
            injectTo: 'head-prepend',
          },
        ];
      },
    },
    transform(code, id) {
      if (id.includes('@vite/client') || id.includes('vite/dist/client')) {
        return code.replace(/location\.reload\(\)/g, '/* blocked reload */');
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [preventHmrReloadPlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is strictly disabled in AI Studio iframe to prevent WebSocket timeout reload loops
      hmr: false,
      watch: null,
    },
  };
});

