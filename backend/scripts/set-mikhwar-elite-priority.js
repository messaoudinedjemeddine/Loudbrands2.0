/**
 * Set displayPriority on Mikhwar Elite products so they appear first on
 * /products and /loud-styles/products. Run once after deploy.
 *
 * On Heroku (production DB):
 *   heroku run npm run set-mikhwar-priority --app loudbrands-backend-eu
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Mikhwar Elite product slugs to show first (order = displayPriority 1, 2, 3, ...)
const MIKHWAR_ELITE_SLUGS = [
  'mikhwar-elite-bleu-nuit',
  'mikhwar-elite-vert-olive',
  'mikhwar-elite-bordeau',
  'mikhwar-elite-noir',
  'mikhwar-elite-aubergine'
];

async function setMikhwarElitePriority() {
  try {
    console.log('Setting display priority for Mikhwar Elite products (Loud Styles)...');

    const brand = await prisma.brand.findUnique({
      where: { slug: 'loud-styles' }
    });

    if (!brand) {
      console.error('Brand "loud-styles" not found.');
      process.exit(1);
    }

    for (let i = 0; i < MIKHWAR_ELITE_SLUGS.length; i++) {
      const slug = MIKHWAR_ELITE_SLUGS[i];
      const priority = i + 1;

      const product = await prisma.product.findFirst({
        where: {
          brandId: brand.id,
          slug
        }
      });

      if (product) {
        await prisma.product.update({
          where: { id: product.id },
          data: { displayPriority: priority }
        });
        console.log(`  Priority ${priority}: ${slug} (${product.name})`);
      } else {
        console.warn(`  Skipped (not found): ${slug}`);
      }
    }

    console.log('\nDone. Mikhwar Elite products will appear first on the products page and Loud Styles page.');
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  setMikhwarElitePriority();
}

module.exports = setMikhwarElitePriority;
