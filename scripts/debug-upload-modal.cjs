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
  const port = 9238;
  const tempDir = process.env.TEMP + '\\cdp-test-' + Date.now();

  const vite = spawn('npx.cmd', ['vite', 'preview', '--port', '4175', '--host', '127.0.0.1', '--strictPort'], {
    cwd: path.resolve(__dirname, '..'),
    shell: true,
  });

  await waitForServer('http://127.0.0.1:4175/');

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

        await send('Page.navigate', { url: 'http://127.0.0.1:4175/' });
        await new Promise((r) => setTimeout(r, 1500));

        // Sign in
        await send('Runtime.evaluate', {
          expression: `
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Continue with Google'));
            btn ? btn.click() : null;
          `,
        });
        await new Promise((r) => setTimeout(r, 1500));

        // Test clicking upload button by checking all buttons text
        const res = await send('Runtime.evaluate', {
          expression: `
            Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim())
          `,
          returnByValue: true
        });
        console.log('Available buttons:', res.result.value);

        // Click the first button with text 'Upload File'
        await send('Runtime.evaluate', {
          expression: `
            const b = Array.from(document.querySelectorAll('button')).find(el => el.textContent.trim() === 'Upload File');
            if (b) {
              b.click();
              'CLICKED UPLOAD FILE';
            } else {
              'NOT FOUND';
            }
          `,
        });

        await new Promise((r) => setTimeout(r, 1000));

        const { data: b64 } = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.resolve(__dirname, '..', 'screenshot_03_upload_modal.png'), Buffer.from(b64, 'base64'));
        console.log('Saved real screenshot_03_upload_modal.png');

        // Now find dialog and check if open
        const dialogCheck = await send('Runtime.evaluate', {
          expression: `Boolean(document.querySelector('[role="dialog"]'))`,
          returnByValue: true
        });
        console.log('Is dialog open:', dialogCheck.result.value);

        ws.close();
        chrome.kill();
        vite.kill();
        process.exit(0);
      };
    });
  });
}

main().catch(console.error);

