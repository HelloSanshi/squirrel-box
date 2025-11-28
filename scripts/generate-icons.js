import { createCanvas, loadImage } from 'canvas';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [16, 48, 128];

// Read Source content
const sourcePath = join(__dirname, '../public/icons/logo.png');

async function generateIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Set background to transparent
    ctx.clearRect(0, 0, size, size);

    // Draw the Image
    const img = await loadImage(sourcePath);
    ctx.drawImage(img, 0, 0, size, size);

    // Save as PNG
    const buffer = canvas.toBuffer('image/png');
    const outputPath = join(__dirname, `../public/icons/icon-${size}.png`);
    writeFileSync(outputPath, buffer);
    console.log(`✓ Generated icon-${size}.png`);
}

async function generateAll() {
    console.log('Generating icons from SVG logo...\n');
    for (const size of sizes) {
        await generateIcon(size);
    }
    console.log('\n✓ All icons generated successfully!');
}

generateAll().catch(console.error);
