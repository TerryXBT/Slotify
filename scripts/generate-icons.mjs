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
    // Read the original Logo.png file (user's design - NO MODIFICATIONS)
    const logoPath = join(publicDir, 'Logo.png');
    const logoBuffer = await fs.readFile(logoPath);

    console.log('Using original Logo.png (no design modifications)...\n');

    // Generate icons for each size
    for (const size of sizes) {
      await sharp(logoBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(join(publicDir, `icon-${size}.png`));

      console.log(`✓ Generated icon-${size}.png`);
    }

    // Generate favicon (32x32)
    await sharp(logoBuffer)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(join(publicDir, 'favicon.png'));

    console.log('✓ Generated favicon.png');

    // Generate apple-touch-icon (180x180)
    await sharp(logoBuffer)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(join(publicDir, 'apple-touch-icon.png'));

    console.log('✓ Generated apple-touch-icon.png');

    console.log('\n✅ All PWA icons generated successfully from Logo.png!');
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
