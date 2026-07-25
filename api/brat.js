const { createCanvas } = require('@napi-rs/canvas'); // Menggunakan @napi-rs/canvas yang support Vercel

// Fungsi untuk membuat teks dengan posisi acak
function generateRandomPositionText(ctx, text, canvasWidth, canvasHeight) {
    const words = text.split(" ");
    const positions = [];

    // Acak posisi untuk setiap kata
    words.forEach((word) => {
        let x, y;
        let attempts = 0;
        const maxAttempts = 50; // Cegah infinite loop jika teks terlalu panjang

        // Pastikan posisi acak tidak terlalu dekat dengan kata lain
        do {
            x = Math.random() * (canvasWidth - 100) + 50; // Batas aman 50px
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

// Fungsi untuk membuat gambar dengan teks acak dan kualitas rendah
function generateLowQualityImage(text) {
    const width = 500;
    const height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Latar belakang putih
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    // Pengaturan font dan warna teks
    ctx.fillStyle = 'black';
    ctx.font = 'bold 30px Arial';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    // Tulis teks dengan posisi acak
    generateRandomPositionText(ctx, text, width, height);

    // Simulasikan kualitas rendah (resample/pixelated)
    const tempCanvas = createCanvas(200, 200);
    const tempCtx = tempCanvas.getContext('2d');
    
    // Matikan image smoothing agar hasil resize terlihat pixelated/blur
    tempCtx.imageSmoothingEnabled = false;
    tempCtx.drawImage(canvas, 0, 0, 200, 200);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tempCanvas, 0, 0, width, height);

    return canvas.toBuffer('image/png');
}

// Fungsi serverless untuk menangani permintaan
module.exports = async (req, res) => {
    const text = req.query.text;

    if (!text) {
        return res.status(400).send('Parameter "text" diperlukan.');
    }

    try {
        const imageBuffer = await generateLowQualityImage(text);
        
        // Mencegah browser melakukan caching berlebihan jika teks sama
        res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');
        res.setHeader('Content-Type', 'image/png');
        
        return res.send(imageBuffer); // Kirim gambar langsung ke browser
    } catch (error) {
        console.error('Gagal membuat gambar:', error);
        return res.status(500).send('Gagal membuat gambar.');
    }
};
