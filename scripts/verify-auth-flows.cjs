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
  const port = 9260;
  const tempDir = process.env.TEMP + '\\cdp-auth-flows-' + Date.now();

  const vite = spawn('npx.cmd', ['vite', 'preview', '--port', '4190', '--host', '127.0.0.1', '--strictPort'], {
    cwd: path.resolve(__dirname, '..'),
    shell: true,
  });

  await waitForServer('http://127.0.0.1:4190/');

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

        await send('Page.navigate', { url: 'http://127.0.0.1:4190/' });
        await new Promise((r) => setTimeout(r, 1500));

        async function capture(fileName) {
          const { data: b64 } = await send('Page.captureScreenshot', { format: 'png' });
          const filePath = path.resolve(__dirname, '..', fileName);
          fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));
          console.log(`Saved screenshot: ${fileName}`);
        }

        // 1. Capture Login Page with Email/Password fields
        console.log('1. Capturing Login Page with Email/Password fields...');
        await capture('screenshot_auth_01_login.png');

        // 2. Click "Create an account"
        console.log('2. Navigating to Create Account view...');
        await send('Runtime.evaluate', {
          expression: `
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Create an account'));
            if (btn) btn.click();
          `,
        });
        await new Promise((r) => setTimeout(r, 800));

        // Fill in sample data to show password strength meter
        await send('Runtime.evaluate', {
          expression: `
            const nameInput = document.getElementById('reg-name');
            const emailInput = document.getElementById('reg-email');
            const pwInput = document.getElementById('reg-password');
            if (nameInput) { nameInput.value = 'Jordan Lee'; nameInput.dispatchEvent(new Event('input', { bubbles: true })); }
            if (emailInput) { emailInput.value = 'jordan.lee@oxford.ac.uk'; emailInput.dispatchEvent(new Event('input', { bubbles: true })); }
            if (pwInput) { pwInput.value = 'SyncSecure2026!'; pwInput.dispatchEvent(new Event('input', { bubbles: true })); }
          `,
        });
        await new Promise((r) => setTimeout(r, 500));
        await capture('screenshot_auth_02_register.png');

        // 3. Switch back to login, then to forgot password
        console.log('3. Navigating to Forgot Password view...');
        await send('Runtime.evaluate', {
          expression: `
            const signinBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Sign in');
            if (signinBtn) signinBtn.click();
          `,
        });
        await new Promise((r) => setTimeout(r, 500));

        await send('Runtime.evaluate', {
          expression: `
            const forgotBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Forgot password?'));
            if (forgotBtn) forgotBtn.click();
          `,
        });
        await new Promise((r) => setTimeout(r, 500));

        // Fill in reset email
        await send('Runtime.evaluate', {
          expression: `
            const emailInput = document.getElementById('reset-email');
            if (emailInput) { emailInput.value = 'jordan.lee@oxford.ac.uk'; emailInput.dispatchEvent(new Event('input', { bubbles: true })); }
          `,
        });
        await new Promise((r) => setTimeout(r, 500));
        await capture('screenshot_auth_03_forgot_password.png');

        // 4. Return to sign in, trigger Google login to show "Secure Your Account" view (Section 8)
        console.log('4. Navigating to Sign In and testing Google first-time Secure Your Account...');
        await send('Runtime.evaluate', {
          expression: `
            const backBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Back to Sign In'));
            if (backBtn) backBtn.click();
          `,
        });
        await new Promise((r) => setTimeout(r, 500));

        // Trigger Google sign in (in sandbox mode or if not configured)
        // Let's set a demo session with isGoogle: true and hasPasswordSet: false to inspect the SecureAccountPage
        await send('Runtime.evaluate', {
          expression: `
            const demoGoogle = {
              uid: 'google_student_789',
              displayName: 'Taylor Swift (Student)',
              email: 'taylor.swift@harvard.edu',
              photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              isGoogle: true,
              providerData: [{ providerId: 'google.com' }],
              profile: {
                uid: 'google_student_789',
                displayName: 'Taylor Swift (Student)',
                email: 'taylor.swift@harvard.edu',
                photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                createdAt: new Date().toISOString(),
                totalStorageUsedBytes: 0,
                storageLimitBytes: 20971520,
                hasPasswordSet: false,
                isStudentVerified: true,
                emailVerified: true
              }
            };
            sessionStorage.setItem('syncfile_use_demo', 'true');
            sessionStorage.setItem('syncfile_demo_user', JSON.stringify(demoGoogle));
            sessionStorage.removeItem('syncfile_skip_pw_google_student_789');
            window.location.reload();
          `,
        });
        await new Promise((r) => setTimeout(r, 2000));

        // Enter password in Secure Account view to show strength meter
        await send('Runtime.evaluate', {
          expression: `
            const pwInput = document.getElementById('setup-password');
            const confirmInput = document.getElementById('setup-confirm-password');
            if (pwInput) { pwInput.value = 'StudentKey2026!'; pwInput.dispatchEvent(new Event('input', { bubbles: true })); }
            if (confirmInput) { confirmInput.value = 'StudentKey2026!'; confirmInput.dispatchEvent(new Event('input', { bubbles: true })); }
          `,
        });
        await new Promise((r) => setTimeout(r, 500));
        await capture('screenshot_auth_04_secure_account.png');

        console.log('All auth flow screenshots captured successfully!');
        ws.close();
        chrome.kill();
        vite.kill();
        process.exit(0);
      };
    });
  });
}

main().catch(console.error);
