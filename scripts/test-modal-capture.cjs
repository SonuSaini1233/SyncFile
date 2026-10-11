const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9246',
  '--user-data-dir=' + process.env.TEMP + '\\cdp-test-diag-' + Date.now(),
  '--disable-gpu',
  '--no-first-run',
  'about:blank'
]);

setTimeout(() => {
  http.get('http://127.0.0.1:9246/json/list', (res) => {
    let d = '';
    res.on('data', (c) => (d += c));
    res.on('end', async () => {
      const list = JSON.parse(d);
      const ws = new WebSocket(list[0].webSocketDebuggerUrl);
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
        await send('Page.navigate', { url: 'http://127.0.0.1:4176/' });
        await new Promise((r) => setTimeout(r, 1500));

        // Sign in
        await send('Runtime.evaluate', {
          expression: `
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Continue with Google'));
            btn ? btn.click() : null;
          `,
        });
        await new Promise((r) => setTimeout(r, 1500));

        // Click toolbar "+ Upload" button
        const diagBefore = await send('Runtime.evaluate', {
          expression: `
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Upload');
            if (btn) {
              btn.click();
              'Clicked Upload button!';
            } else {
              'Upload button not found';
            }
          `,
          returnByValue: true,
        });
        console.log('Click execution:', diagBefore.result.value);

        await new Promise((r) => setTimeout(r, 800));

        const dialogCheck = await send('Runtime.evaluate', {
          expression: `Boolean(document.querySelector('[role="dialog"]'))`,
          returnByValue: true,
        });
        console.log('Dialog present after click:', dialogCheck.result.value);

        const { data: b64 } = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync('screenshot_upload_modal_confirmed.png', Buffer.from(b64, 'base64'));
        console.log('Saved screenshot_upload_modal_confirmed.png');

        chrome.kill();
        process.exit(0);
      };
    });
  });
}, 2000);

