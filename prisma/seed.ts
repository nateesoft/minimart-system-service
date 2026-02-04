import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool, { schema: 'minimart' });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding categories...');

  const categories = [
    { slug: 'drink', name: 'เครื่องดื่ม', icon: '🥤', sortOrder: 1 },
    { slug: 'snack', name: 'ขนม', icon: '🍪', sortOrder: 2 },
    { slug: 'food', name: 'อาหาร', icon: '🍚', sortOrder: 3 },
    { slug: 'household', name: 'ของใช้', icon: '🧴', sortOrder: 4 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  // Get category IDs by slug
  const allCats = await prisma.category.findMany();
  const catMap: Record<string, number> = {};
  for (const c of allCats) {
    catMap[c.slug] = c.id;
  }

  console.log('Category IDs:', catMap);
  console.log('Seeding products...');

  const products = [
    // เครื่องดื่ม
    { name: 'น้ำดื่ม 600ml', category: 'drink', price: 8, barcode: '8851234560001', stock: 150, image: '💧', unit: 'ขวด' },
    { name: 'โค้ก 325ml', category: 'drink', price: 15, barcode: '8851234560002', stock: 80, image: '🥤', unit: 'กระป๋อง' },
    { name: 'เป็ปซี่ 325ml', category: 'drink', price: 15, barcode: '8851234560003', stock: 75, image: '🥤', unit: 'กระป๋อง' },
    { name: 'น้ำส้ม 100%', category: 'drink', price: 25, barcode: '8851234560004', stock: 45, image: '🍊', unit: 'กล่อง' },
    { name: 'กาแฟกระป๋อง', category: 'drink', price: 18, barcode: '8851234560005', stock: 60, image: '☕', unit: 'กระป๋อง' },
    { name: 'ชาเขียว', category: 'drink', price: 12, barcode: '8851234560006', stock: 90, image: '🍵', unit: 'ขวด' },
    { name: 'น้ำอัดลม Sprite', category: 'drink', price: 15, barcode: '8851234560023', stock: 65, image: '🥤', unit: 'กระป๋อง' },
    { name: 'น้ำแร่', category: 'drink', price: 10, barcode: '8851234560024', stock: 120, image: '💧', unit: 'ขวด' },
    // ขนม
    { name: 'มาม่า ต้มยำกุ้ง', category: 'snack', price: 7, barcode: '8851234560007', stock: 200, image: '🍜', unit: 'ซอง' },
    { name: 'เลย์ รสต้นตำรับ', category: 'snack', price: 20, barcode: '8851234560008', stock: 55, image: '🥔', unit: 'ถุง' },
    { name: 'โปเต้โก้ หมูสับ', category: 'snack', price: 6, barcode: '8851234560009', stock: 120, image: '🍪', unit: 'ถุง' },
    { name: 'ปังปอนด์', category: 'snack', price: 38, barcode: '8851234560010', stock: 30, image: '🍰', unit: 'ชิ้น' },
    { name: 'โออิชิ ราเมง', category: 'snack', price: 10, barcode: '8851234560011', stock: 85, image: '🍥', unit: 'ซอง' },
    { name: 'คิทแคท', category: 'snack', price: 35, barcode: '8851234560012', stock: 42, image: '🍫', unit: 'แพ็ค' },
    { name: 'พอกกี้', category: 'snack', price: 10, barcode: '8851234560025', stock: 95, image: '🍫', unit: 'กล่อง' },
    { name: 'ดอริโต้ส', category: 'snack', price: 25, barcode: '8851234560026', stock: 48, image: '🌽', unit: 'ถุง' },
    // ของใช้
    { name: 'ถุงดำ 5kg', category: 'household', price: 25, barcode: '8851234560013', stock: 95, image: '🛍️', unit: 'ม้วน' },
    { name: 'ทิชชู่ 10 แผ่น', category: 'household', price: 15, barcode: '8851234560014', stock: 110, image: '📄', unit: 'แพ็ค' },
    { name: 'แชมพูซันซิล', category: 'household', price: 89, barcode: '8851234560015', stock: 28, image: '🧴', unit: 'ขวด' },
    { name: 'ยาสีฟัน', category: 'household', price: 45, barcode: '8851234560016', stock: 38, image: '🪥', unit: 'หลอด' },
    { name: 'สบู่ล้างมือ', category: 'household', price: 35, barcode: '8851234560017', stock: 52, image: '🧼', unit: 'ขวด' },
    { name: 'ผงซักฟอก 1kg', category: 'household', price: 65, barcode: '8851234560018', stock: 25, image: '🧺', unit: 'ถุง' },
    { name: 'น้ำยาล้างจาน', category: 'household', price: 42, barcode: '8851234560027', stock: 35, image: '🧴', unit: 'ขวด' },
    { name: 'กระดาษชำระ', category: 'household', price: 55, barcode: '8851234560028', stock: 8, image: '🧻', unit: 'แพ็ค' },
    // อาหาร
    { name: 'ข้าวสาร 5kg', category: 'food', price: 185, barcode: '8851234560019', stock: 40, image: '🌾', unit: 'ถุง' },
    { name: 'ไข่ไก่ 10 ฟอง', category: 'food', price: 65, barcode: '8851234560020', stock: 35, image: '🥚', unit: 'ถาด' },
    { name: 'นมกล่อง 1L', category: 'food', price: 48, barcode: '8851234560021', stock: 55, image: '🥛', unit: 'กล่อง' },
    { name: 'ขนมปัง', category: 'food', price: 35, barcode: '8851234560022', stock: 48, image: '🍞', unit: 'ถุง' },
    { name: 'น้ำมันพืช 1L', category: 'food', price: 55, barcode: '8851234560029', stock: 42, image: '🫗', unit: 'ขวด' },
    { name: 'น้ำตาล 1kg', category: 'food', price: 38, barcode: '8851234560030', stock: 58, image: '🍬', unit: 'ถุง' },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { barcode: p.barcode },
      update: {},
      create: {
        name: p.name,
        categoryId: catMap[p.category],
        price: p.price,
        costPrice: 0,
        barcode: p.barcode,
        stock: p.stock,
        minStock: 10,
        image: p.image,
        unit: p.unit,
        isActive: true,
      },
    });
  }

  console.log(`Seeded ${categories.length} categories and ${products.length} products`);
}

main()
  .then(() => console.log('Seed complete!'))
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
