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

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'black';
    ctx.font = 'bold 30px Arial';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    generateRandomPositionText(ctx, text, width, height);

    const tempCanvas = createCanvas(200, 200);
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCtx.imageSmoothingEnabled = false;
    tempCtx.drawImage(canvas, 0, 0, 200, 200);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tempCanvas, 0, 0, width, height);

    return canvas.toBuffer('image/png');
}

module.exports = async (req, res) => {
    // Menggunakan WHATWG URL API standar menggantikan url.parse()
    const host = req.headers.host || 'localhost';
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const currentUrl = new URL(req.url, `${protocol}://${host}`);
    
    // Ambil parameter 'text' dari searchParams
    const text = currentUrl.searchParams.get('text');

    if (!text) {
        return res.status(400).send('Parameter "text" diperlukan.');
    }

    try {
        const imageBuffer = await generateLowQualityImage(text);
        
        res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');
        res.setHeader('Content-Type', 'image/png');
        
        return res.send(imageBuffer);
    } catch (error) {
        console.error('Gagal membuat gambar:', error);
        return res.status(500).send('Gagal membuat gambar.');
    }
};
