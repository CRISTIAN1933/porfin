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

        // Va a la página original
        await page.goto(url, { waitUntil: 'networkidle' });

        // Hace click en el botón "Activar"
        await page.click('#activar-form .button-activar');

        // Espera un par de segundos para que el POST se ejecute
        await page.waitForTimeout(3000);

        // Solo respondemos que se ejecutó
        res.json({ ok: true, message: 'Botón Activar presionado' });

    } catch (error) {
        res.json({ ok: false, message: error.message });
    } finally {
        if (browser) await browser.close();
    }
});

// Render da un puerto dinámico, úsalo
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Proxy corriendo en http://localhost:${port}`));
