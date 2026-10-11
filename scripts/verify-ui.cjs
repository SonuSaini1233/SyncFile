const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function waitForServer(url, timeout = 10000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function check() {
      const req = http.get(url, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          setTimeout(check, 300);
        }
      });
      req.on('error', () => {
        if (Date.now() - start > timeout) {
          reject(new Error(`Timeout waiting for ${url}`));
        } else {
          setTimeout(check, 300);
        }
      });
    }
    check();
  });
}

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9232;
  const tempDir = process.env.TEMP + '\\cdp-profile-syncfile-' + Date.now();

  console.log('1. Starting Vite preview server...');
  const vite = spawn('npx.cmd', ['vite', 'preview', '--port', '4173', '--host', '127.0.0.1', '--strictPort'], {
    cwd: path.resolve(__dirname, '..'),
    shell: true,
  });

  vite.stdout.on('data', (d) => console.log('[Vite]', d.toString().trim()));
  vite.stderr.on('data', (d) => console.error('[Vite err]', d.toString().trim()));

  console.log('Waiting for Vite preview server at http://127.0.0.1:4173 ...');
  await waitForServer('http://127.0.0.1:4173/');
  console.log('Vite preview is ready!');

  console.log('2. Launching headless Chrome...');
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
      try {
        const list = JSON.parse(data);
        const pageTarget = list.find((t) => t.type === 'page') || list[0];
        const wsUrl = pageTarget.webSocketDebuggerUrl;
        console.log('3. Connecting to CDP Target:', wsUrl);
        await runScreenshots(wsUrl, chrome, vite);
      } catch (err) {
        console.error('Failed to parse CDP target:', err);
        chrome.kill();
        vite.kill();
      }
    });
  }).on('error', (err) => {
    console.error('Failed to connect to Chrome CDP:', err);
    chrome.kill();
    vite.kill();
  });
}

function runScreenshots(wsUrl, chrome, vite) {
  return new Promise((resolve) => {
    const ws = new WebSocket(wsUrl);
    let id = 1;
    const callbacks = new Map();

    function send(method, params = {}) {
      return new Promise((res, rej) => {
        const msgId = id++;
        callbacks.set(msgId, { resolve: res, reject: rej });
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
      console.log('Connected to Chrome DevTools Protocol');
      await send('Page.enable');
      await send('Runtime.enable');
      await send('DOM.enable');

      // Desktop viewport
      await send('Emulation.setDeviceMetricsOverride', {
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false,
      });

      console.log('Navigating to http://127.0.0.1:4173/ ...');
      await send('Page.navigate', { url: 'http://127.0.0.1:4173/' });
      await new Promise((r) => setTimeout(r, 2000));

      async function capture(fileName) {
        const { data: b64 } = await send('Page.captureScreenshot', { format: 'png' });
        const filePath = path.resolve(__dirname, '..', fileName);
        fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));
        console.log(`Saved screenshot: ${fileName}`);
      }

      // Screenshot 1: Login Page
      console.log('Capturing Screenshot 1: Login Page...');
      await capture('screenshot_01_login.png');

      // Click "Continue with Google"
      console.log('Triggering Google Sign In...');
      await send('Runtime.evaluate', {
        expression: `
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Continue with Google'));
          if (btn) btn.click();
        `,
      });

      await new Promise((r) => setTimeout(r, 2000));

      // Screenshot 2: Main Dashboard
      console.log('Capturing Screenshot 2: Main Dashboard...');
      await capture('screenshot_02_dashboard.png');

      // Click "Upload File" button
      console.log('Opening Upload Modal...');
      await send('Runtime.evaluate', {
        expression: `
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Upload File') || b.textContent.includes('Upload'));
          if (btn) btn.click();
        `,
      });

      await new Promise((r) => setTimeout(r, 1000));
      console.log('Capturing Screenshot 3: Upload Modal...');
      await capture('screenshot_03_upload_modal.png');

      // Close modal
      await send('Runtime.evaluate', {
        expression: `
          const closeBtn = document.querySelector('button[aria-label="Close dialog"]');
          if (closeBtn) closeBtn.click();
        `,
      });

      await new Promise((r) => setTimeout(r, 500));

      // Click "Storage" in Sidebar
      console.log('Navigating to Storage View...');
      await send('Runtime.evaluate', {
        expression: `
          const storageBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Storage') && !b.textContent.includes('Quota'));
          if (storageBtn) storageBtn.click();
        `,
      });

      await new Promise((r) => setTimeout(r, 1000));
      console.log('Capturing Screenshot 4: Storage Allocation View...');
      await capture('screenshot_04_storage_view.png');

      // Mobile Viewport
      console.log('Setting mobile viewport (375x812)...');
      await send('Emulation.setDeviceMetricsOverride', {
        width: 375,
        height: 812,
        deviceScaleFactor: 2,
        mobile: true,
      });

      // Switch back to files on mobile
      await send('Runtime.evaluate', {
        expression: `
          const filesBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('My Files'));
          if (filesBtn) filesBtn.click();
        `,
      });

      await new Promise((r) => setTimeout(r, 1000));
      console.log('Capturing Screenshot 5: Mobile View...');
      await capture('screenshot_05_mobile.png');

      console.log('All screenshots captured successfully!');
      ws.close();
      chrome.kill();
      vite.kill();
      resolve();
      process.exit(0);
    };
  });
}

main().catch((err) => {
  console.error('Script failure:', err);
  process.exit(1);
});

