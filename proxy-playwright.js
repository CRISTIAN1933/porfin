// proxy-playwright.js
const express = require('express');
const cors = require('cors');
const { chromium } = require('playwright');

const app = express();
app.use(cors());

app.get('/activar', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Debes enviar ?url=...' });

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    let getRequest = null;
    let postRequest = null;
    let activated = false;

    // Capturamos todas las peticiones
    page.on('requestfinished', async (request) => {
      try {
        const response = await request.response();
        if (!response) return;

        if (request.method() === 'GET' && request.url().includes('activar.php')) {
          getRequest = {
            url: request.url(),
            method: request.method(),
            status: response.status(),
            headers: request.headers(),
            ok: response.ok()
          };
        }

        if (request.method() === 'POST' && request.url().includes('activar.php')) {
          const postData = request.postData();
          postRequest = {
            url: request.url(),
            method: request.method(),
            status: response.status(),
            headers: request.headers(),
            body: postData,
            ok: response.ok,
            activated: postData?.includes('activar=1') || false
          };
        }
      } catch (e) {
        console.log('Error capturando request:', e.message);
      }
    });

    // Abrimos la página
    await page.goto(url, { waitUntil: 'networkidle' });

    // Hacemos click en el botón "Activar"
    await page.click('#activar-form .button-activar');

    // Esperamos a que aparezca el div de confirmación
    try {
      await page.waitForSelector('#mensaje .enlace-box', { timeout: 5000 });
      activated = true;
    } catch {
      activated = false;
    }

    res.json({
      ok: true,
      message: 'Botón activado',
      activated,
      getRequest,
      postRequest
    });

  } catch (error) {
    res.json({ ok: false, message: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

// Puerto dinámico para Render
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Proxy corriendo en http://localhost:${port}`));
