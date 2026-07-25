const { createCanvas } = require('@napi-rs/canvas');

function generateRandomPositionText(ctx, text, canvasWidth, canvasHeight) {
    const words = text.split(" ");
    const positions = [];

    words.forEach((word) => {
        let x, y;
        let attempts = 0;
        const maxAttempts = 50;

        do {
            x = Math.random() * (canvasWidth - 100) + 50;
            y = Math.random() * (canvasHeight - 100) + 50;
            attempts++;
        } while (
            attempts < maxAttempts &&
            positions.some((pos) => Math.hypot(pos.x - x, pos.y - y) < 50)
        );

        positions.push({ x, y });
        ctx.fillText(word, x, y);
    });
}

function generateLowQualityImage(text) {
    const width = 500;
    const height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Latar belakang putih
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Pengaturan font - Gunakan 'sans-serif' agar kompatibel di Linux Serverless
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 30px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    // Tulis teks
    generateRandomPositionText(ctx, text, width, height);

    // Efek Pixelated / Low Quality
    const tempCanvas = createCanvas(200, 200);
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCtx.imageSmoothingEnabled = false;
    tempCtx.drawImage(canvas, 0, 0, 200, 200);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tempCanvas, 0, 0, width, height);

    // Hasilkan Buffer PNG
    return canvas.toBuffer('image/png');
}

module.exports = async (req, res) => {
    try {
        // Ambil query text secara aman
        const host = req.headers.host || 'localhost';
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const currentUrl = new URL(req.url, `${protocol}://${host}`);
        const text = currentUrl.searchParams.get('text');

        if (!text) {
            res.setHeader('Content-Type', 'text/plain');
            return res.status(400).send('Parameter "text" diperlukan. Contoh: ?text=hello');
        }

        const imageBuffer = generateLowQualityImage(text);
        
        // Response header eksplisit
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', imageBuffer.length);
        res.setHeader('Cache-Control', 'no-store, max-age=0'); // Matikan cache saat testing
        
        return res.status(200).end(imageBuffer);
    } catch (error) {
        console.error('Error generator:', error);
        res.setHeader('Content-Type', 'text/plain');
        return res.status(500).send('Gagal membuat gambar: ' + error.message);
    }
};
