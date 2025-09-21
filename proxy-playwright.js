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

        let postInfo = null;

        // Interceptamos las peticiones
        page.on('requestfinished', async (request) => {
            try {
                if (request.method() === 'POST' && request.url().includes('activar.php')) {
                    const response = await request.response();
                    postInfo = {
                        url: request.url(),
                        method: request.method(),
                        status: response?.status(),
                        headers: request.headers(),
                        body: request.postData(),
                        ok: response?.ok()
                    };
                }
            } catch (e) {
                console.log('Error al capturar request:', e.message);
            }
        });

        // Va a la página original
        await page.goto(url, { waitUntil: 'networkidle' });

        // Hace click en el botón "Activar"
        await page.click('#activar-form .button-activar');

        // Espera un par de segundos para que el POST se ejecute
        await page.waitForTimeout(3000);

        if (postInfo) {
            res.json({ ok: true, message: 'Botón activado', request: postInfo });
        } else {
            res.json({ ok: false, message: 'No se detectó la petición POST al activar' });
        }

    } catch (error) {
        res.json({ ok: false, message: error.message });
    } finally {
        if (browser) await browser.close();
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Proxy corriendo en http://localhost:${port}`));
