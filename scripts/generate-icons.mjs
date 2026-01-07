import sharp from 'sharp';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [192, 512];
const publicDir = join(__dirname, '..', 'public');

async function generateIcons() {
  try {
    // Read the SVG file
    const svgPath = join(publicDir, 'icon.svg');
    const svgBuffer = await fs.readFile(svgPath);

    // Generate icons for each size
    for (const size of sizes) {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(join(publicDir, `icon-${size}.png`));

      console.log(`✓ Generated icon-${size}.png`);
    }

    // Also generate favicon
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(join(publicDir, 'favicon.png'));

    console.log('✓ Generated favicon.png');

    // Generate apple-touch-icon
    await sharp(svgBuffer)
      .resize(180, 180)
      .png()
      .toFile(join(publicDir, 'apple-touch-icon.png'));

    console.log('✓ Generated apple-touch-icon.png');

    console.log('\n✅ All PWA icons generated successfully!');
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
