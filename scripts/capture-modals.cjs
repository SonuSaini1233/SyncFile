const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function waitForServer(url, timeout = 10000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function check() {
      const req = http.get(url, (res) => {
        if (res.statusCode === 200) resolve();
        else setTimeout(check, 300);
      });
      req.on('error', () => {
        if (Date.now() - start > timeout) reject(new Error(`Timeout waiting for ${url}`));
        else setTimeout(check, 300);
      });
    }
    check();
  });
}

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9248;
  const tempDir = process.env.TEMP + '\\cdp-modals-id-' + Date.now();

  const vite = spawn('npx.cmd', ['vite', 'preview', '--port', '4178', '--host', '127.0.0.1', '--strictPort'], {
    cwd: path.resolve(__dirname, '..'),
    shell: true,
  });

  await waitForServer('http://127.0.0.1:4178/');

  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempDir}`,
    '--disable-gpu',
    '--no-first-run',
    'about:blank'
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  http.get(`http://127.0.0.1:${port}/json/list`, (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', async () => {
      const list = JSON.parse(data);
      const pageTarget = list.find((t) => t.type === 'page') || list[0];
      const wsUrl = pageTarget.webSocketDebuggerUrl;
      const ws = new WebSocket(wsUrl);
      let id = 1;
      const callbacks = new Map();

      function send(method, params = {}) {
        return new Promise((resolve, reject) => {
          const msgId = id++;
          callbacks.set(msgId, { resolve, reject });
          ws.send(JSON.stringify({ id: msgId, method, params }));
        });
      }

      ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);
        if (callbacks.has(msg.id)) {
          const { resolve, reject } = callbacks.get(msg.id);
          callbacks.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };

      ws.onopen = async () => {
        await send('Page.enable');
        await send('Runtime.enable');
        await send('DOM.enable');
        await send('Emulation.setDeviceMetricsOverride', {
          width: 1440,
          height: 900,
          deviceScaleFactor: 1,
          mobile: false,
        });

        await send('Page.navigate', { url: 'http://127.0.0.1:4178/' });
        await new Promise((r) => setTimeout(r, 1500));

        // Sign in
        await send('Runtime.evaluate', {
          expression: `
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Continue with Google'));
            if (btn) btn.click();
          `,
        });
        await new Promise((r) => setTimeout(r, 1500));

        async function capture(fileName) {
          const { data: b64 } = await send('Page.captureScreenshot', { format: 'png' });
          const filePath = path.resolve(__dirname, '..', fileName);
          fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));
          console.log(`Saved screenshot: ${fileName}`);
        }

        // 1. Click Upload Modal via #nav-upload
        console.log('Clicking #nav-upload...');
        await send('Runtime.evaluate', {
          expression: `
            const b = document.getElementById('nav-upload');
            if (b) b.click();
          `,
        });
        await new Promise((r) => setTimeout(r, 1000));
        await capture('screenshot_03_upload_modal.png');

        // Close upload modal
        await send('Runtime.evaluate', {
          expression: `
            const closeBtn = document.querySelector('button[aria-label="Close dialog"]');
            if (closeBtn) closeBtn.click();
          `,
        });
        await new Promise((r) => setTimeout(r, 600));

        // 2. Click Settings Modal via #nav-settings
        console.log('Clicking #nav-settings...');
        await send('Runtime.evaluate', {
          expression: `
            const b = document.getElementById('nav-settings');
            if (b) b.click();
          `,
        });
        await new Promise((r) => setTimeout(r, 1000));
        await capture('screenshot_06_settings_modal.png');

        console.log('All screenshots completed successfully!');
        ws.close();
        chrome.kill();
        vite.kill();
        process.exit(0);
      };
    });
  });
}

main().catch(console.error);

