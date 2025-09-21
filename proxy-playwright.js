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

        // Intercepta fetch para capturar la respuesta del POST
        let m3uLink = null;
        page.on('response', async (response) => {
            try {
                const text = await response.text();
                if (text.includes('.m3u')) {
                    const match = text.match(/https?:\/\/[^\s'"]+\.m3u/);
                    if (match) m3uLink = match[0];
                }
            } catch (e) { }
        });

        await page.goto(url, { waitUntil: 'networkidle' });

        // Simula click en el botón "Activar"
        await page.click('.button-activar');

        // Espera que la petición POST se complete
        await page.waitForTimeout(3000);

        res.json({
            ok: !!m3uLink,
            m3u: m3uLink || null,
            html: await page.content()
        });

    } catch (error) {
        res.json({ ok: false, message: error.message });
    } finally {
        if (browser) await browser.close();
    }
});

// Render asigna el puerto en process.env.PORT
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Proxy corriendo en http://localhost:${port}`));
