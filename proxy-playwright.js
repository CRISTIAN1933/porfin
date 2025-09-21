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

        let m3uLink = null;

        // Captura todas las respuestas buscando el .m3u
        page.on('response', async (response) => {
            try {
                const text = await response.text();
                if (text.includes('.m3u')) {
                    const match = text.match(/https?:\/\/[^\s'"]+\.m3u/);
                    if (match) m3uLink = match[0];
                }
            } catch (e) {}
        });

        // Abre la página
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // 🚀 Simula el mismo POST que hace el formulario
        await page.evaluate(() => {
            const formData = new FormData();
            formData.append('activar', '1');
            return fetch(window.location.pathname, { method: 'POST', body: formData });
        });

        // Espera a que el servidor devuelva la activación
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

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Proxy corriendo en http://localhost:${port}`));
