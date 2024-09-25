const express = require('express');
const translate = require('node-google-translate-skidz');
const path = require('path');
const app = express();
const port = 3000;

// Middleware para servir archivos estáticos desde el directorio 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para parsear cuerpos de solicitudes JSON
app.use(express.json());

// Ruta para manejar la traducción
app.post('/translate', (req, res) => {
    const { text, targetLang } = req.body;

    translate({
        text,
        source: 'en',
        target: targetLang
    }, function(result) {
        if (result && result.translation) {
            res.json({ translatedText: result.translation });
        } else {
            res.status(500).json({ error: 'Error en la traducción' });
        }
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/index.html'));
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});