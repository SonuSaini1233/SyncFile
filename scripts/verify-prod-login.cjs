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
  const port = 9255;
  const tempDir = process.env.TEMP + '\\cdp-prod-login-' + Date.now();

  const vite = spawn('npx.cmd', ['vite', 'preview', '--port', '4185', '--host', '127.0.0.1', '--strictPort'], {
    cwd: path.resolve(__dirname, '..'),
    shell: true,
  });

  await waitForServer('http://127.0.0.1:4185/');

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
      const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
      let id = 1;
      function send(method, params = {}) {
        return new Promise((resolve) => {
          const mid = id++;
          ws.send(JSON.stringify({ id: mid, method, params }));
          const h = (evt) => {
            const m = JSON.parse(evt.data);
            if (m.id === mid) {
              ws.removeEventListener('message', h);
              resolve(m.result);
            }
          };
          ws.addEventListener('message', h);
        });
      }

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

        await send('Page.navigate', { url: 'http://127.0.0.1:4185/' });
        await new Promise((r) => setTimeout(r, 2000));

        const { data: b64 } = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.resolve(__dirname, '..', 'screenshot_01_login.png'), Buffer.from(b64, 'base64'));
        console.log('Updated screenshot_01_login.png with production configuration!');

        ws.close();
        chrome.kill();
        vite.kill();
        process.exit(0);
      };
    });
  });
}

main().catch(console.error);

