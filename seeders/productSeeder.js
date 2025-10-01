require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('MongoDB connected for seeding');
    }
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const getProductData = (categories, adminUser) => [
  // Electronics - Mobile Phones - Smartphones
  {
    name: 'iPhone 15 Pro Max',
    shortDescription: 'Latest iPhone with titanium design and A17 Pro chip',
    description: 'The iPhone 15 Pro Max features a stunning titanium design, powerful A17 Pro chip, and advanced camera system. Perfect for photography enthusiasts and power users.',
    price: 449999,
    comparePrice: 499999,
    categorySlug: 'smartphones',
    brand: 'Apple',
    sku: 'IPH15PM-256-TB',
    images: [
      { url: '/uploads/products/iphone-15-pro-max-1.jpg', alt: 'iPhone 15 Pro Max front view', isPrimary: true },
      { url: '/uploads/products/iphone-15-pro-max-2.jpg', alt: 'iPhone 15 Pro Max back view', isPrimary: false },
      { url: '/uploads/products/iphone-15-pro-max-3.jpg', alt: 'iPhone 15 Pro Max side view', isPrimary: false }
    ],
    stock: {
      quantity: 50,
      lowStockThreshold: 10,
      status: 'in_stock'
    },
    variants: [
      {
        name: 'Color',
        options: [
          { value: 'Natural Titanium', price: 0 },
          { value: 'Blue Titanium', price: 0 },
          { value: 'White Titanium', price: 0 }
        ]
      },
      {
        name: 'Storage',
        options: [
          { value: '256GB', price: 0 },
          { value: '512GB', price: 50000 },
          { value: '1TB', price: 100000 }
        ]
      }
    ],
    specifications: [
      { name: 'Display', value: '6.7-inch Super Retina XDR display' },
      { name: 'Chip', value: 'A17 Pro chip with 6-core GPU' },
      { name: 'Camera', value: '48MP Main | 12MP Ultra Wide | 12MP Telephoto' },
      { name: 'Battery', value: 'Up to 29 hours video playback' },
      { name: 'Storage', value: '256GB, 512GB, 1TB' },
      { name: 'Connectivity', value: '5G, Wi-Fi 6E, Bluetooth 5.3' }
    ],
    tags: ['smartphone', 'apple', 'iphone', '5g', 'premium'],
    weight: { value: 221, unit: 'g' },
    dimensions: { length: 16.0, width: 7.7, height: 0.83, unit: 'cm' },
    seo: {
      metaTitle: 'iPhone 15 Pro Max - Latest Apple Smartphone | Modern Shop',
      metaDescription: 'Buy iPhone 15 Pro Max with titanium design, A17 Pro chip, and advanced cameras. Free delivery in Pakistan.',
      keywords: ['iPhone 15 Pro Max', 'Apple smartphone', 'titanium iPhone', 'A17 Pro chip']
    },
    isFeatured: true
  },

  {
    name: 'Samsung Galaxy S24 Ultra',
    shortDescription: 'Premium Android flagship with S Pen and AI features',
    description: 'Samsung Galaxy S24 Ultra combines cutting-edge AI technology with the precision of S Pen. Features include a 200MP camera, titanium frame, and all-day battery life.',
    price: 399999,
    comparePrice: 449999,
    categorySlug: 'smartphones',
    brand: 'Samsung',
    sku: 'SGS24U-256-TB',
    images: [
      { url: '/uploads/products/galaxy-s24-ultra-1.jpg', alt: 'Galaxy S24 Ultra front view', isPrimary: true },
      { url: '/uploads/products/galaxy-s24-ultra-2.jpg', alt: 'Galaxy S24 Ultra with S Pen', isPrimary: false }
    ],
    stock: { quantity: 75, lowStockThreshold: 15, status: 'in_stock' },
    variants: [
      {
        name: 'Color',
        options: [
          { value: 'Titanium Gray', price: 0 },
          { value: 'Titanium Black', price: 0 },
          { value: 'Titanium Violet', price: 0 }
        ]
      }
    ],
    specifications: [
      { name: 'Display', value: '6.8-inch Dynamic AMOLED 2X' },
      { name: 'Processor', value: 'Snapdragon 8 Gen 3' },
      { name: 'Camera', value: '200MP Main | 50MP Periscope | 12MP Ultra Wide' },
      { name: 'S Pen', value: 'Built-in S Pen included' },
      { name: 'RAM', value: '12GB' },
      { name: 'Storage', value: '256GB' }
    ],
    tags: ['samsung', 'galaxy', 's24 ultra', 'android', 's pen', 'ai'],
    isFeatured: true
  },

  // Electronics - Laptops
  {
    name: 'MacBook Pro 16-inch M3 Max',
    shortDescription: 'Professional laptop with M3 Max chip and Liquid Retina XDR display',
    description: 'The ultimate pro laptop with M3 Max chip delivers exceptional performance for demanding workflows. Features stunning Liquid Retina XDR display and all-day battery life.',
    price: 899999,
    comparePrice: 999999,
    categorySlug: 'laptops',
    brand: 'Apple',
    sku: 'MBP16-M3MAX-1TB',
    images: [
      { url: '/uploads/products/macbook-pro-16-1.jpg', alt: 'MacBook Pro 16-inch open view', isPrimary: true },
      { url: '/uploads/products/macbook-pro-16-2.jpg', alt: 'MacBook Pro 16-inch side view', isPrimary: false }
    ],
    stock: { quantity: 25, lowStockThreshold: 5, status: 'in_stock' },
    variants: [
      {
        name: 'Color',
        options: [
          { value: 'Space Black', price: 0 },
          { value: 'Silver', price: 0 }
        ]
      },
      {
        name: 'Memory',
        options: [
          { value: '36GB Unified Memory', price: 0 },
          { value: '48GB Unified Memory', price: 100000 }
        ]
      }
    ],
    specifications: [
      { name: 'Chip', value: 'Apple M3 Max with 16-core CPU' },
      { name: 'Memory', value: '36GB unified memory' },
      { name: 'Storage', value: '1TB SSD' },
      { name: 'Display', value: '16.2-inch Liquid Retina XDR display' },
      { name: 'Battery', value: 'Up to 22 hours video playback' },
      { name: 'Ports', value: '3x Thunderbolt 4, HDMI, SDXC, MagSafe 3' }
    ],
    tags: ['macbook', 'apple', 'laptop', 'm3 max', 'professional', 'creative'],
    weight: { value: 2.14, unit: 'kg' },
    isFeatured: true
  },

  {
    name: 'Dell XPS 13 Plus',
    shortDescription: 'Premium ultrabook with InfinityEdge display and cutting-edge design',
    description: 'Dell XPS 13 Plus redefines premium with its stunning InfinityEdge display, haptic touchpad, and powerful Intel processors. Perfect for professionals and students.',
    price: 299999,
    comparePrice: 349999,
    categorySlug: 'laptops',
    brand: 'Dell',
    sku: 'DXPS13P-I7-512',
    images: [
      { url: '/uploads/products/dell-xps-13-plus-1.jpg', alt: 'Dell XPS 13 Plus front view', isPrimary: true }
    ],
    stock: { quantity: 40, lowStockThreshold: 8, status: 'in_stock' },
    specifications: [
      { name: 'Processor', value: 'Intel Core i7-1360P' },
      { name: 'Memory', value: '16GB LPDDR5' },
      { name: 'Storage', value: '512GB PCIe SSD' },
      { name: 'Display', value: '13.4-inch FHD+ InfinityEdge' },
      { name: 'Graphics', value: 'Intel Iris Xe Graphics' },
      { name: 'Weight', value: '1.26kg' }
    ],
    tags: ['dell', 'xps', 'ultrabook', 'intel', 'premium', 'portable']
  },

  // Fashion - Men's Clothing - Shirts
  {
    name: 'Premium Cotton Dress Shirt',
    shortDescription: 'Classic white dress shirt in premium Egyptian cotton',
    description: 'Expertly tailored dress shirt made from premium Egyptian cotton. Features mother-of-pearl buttons, French seams, and classic fit. Perfect for business and formal occasions.',
    price: 8999,
    comparePrice: 12999,
    categorySlug: 'shirts',
    brand: 'Cambridge',
    sku: 'PCDS-WHT-L',
    images: [
      { url: '/uploads/products/dress-shirt-white-1.jpg', alt: 'White dress shirt front view', isPrimary: true },
      { url: '/uploads/products/dress-shirt-white-2.jpg', alt: 'White dress shirt back view', isPrimary: false }
    ],
    stock: { quantity: 100, lowStockThreshold: 20, status: 'in_stock' },
    variants: [
      {
        name: 'Size',
        options: [
          { value: 'Small', price: 0 },
          { value: 'Medium', price: 0 },
          { value: 'Large', price: 0 },
          { value: 'X-Large', price: 0 },
          { value: 'XX-Large', price: 500 }
        ]
      },
      {
        name: 'Color',
        options: [
          { value: 'White', price: 0 },
          { value: 'Light Blue', price: 0 },
          { value: 'Light Pink', price: 0 }
        ]
      }
    ],
    specifications: [
      { name: 'Material', value: '100% Egyptian Cotton' },
      { name: 'Fit', value: 'Classic Fit' },
      { name: 'Collar', value: 'Spread Collar' },
      { name: 'Cuff', value: 'Button Cuff' },
      { name: 'Care', value: 'Machine Washable' }
    ],
    tags: ['dress shirt', 'formal', 'cotton', 'mens', 'business', 'classic']
  },

  // Fashion - Women's Clothing - Dresses
  {
    name: 'Elegant Maxi Dress',
    shortDescription: 'Flowy maxi dress perfect for summer occasions',
    description: 'Beautiful flowy maxi dress crafted from premium chiffon fabric. Features elegant print, comfortable fit, and versatile styling. Perfect for summer parties and casual outings.',
    price: 15999,
    comparePrice: 19999,
    categorySlug: 'dresses',
    brand: 'Zara',
    sku: 'EMD-FLR-M',
    images: [
      { url: '/uploads/products/maxi-dress-floral-1.jpg', alt: 'Floral maxi dress front view', isPrimary: true },
      { url: '/uploads/products/maxi-dress-floral-2.jpg', alt: 'Floral maxi dress side view', isPrimary: false }
    ],
    stock: { quantity: 60, lowStockThreshold: 12, status: 'in_stock' },
    variants: [
      {
        name: 'Size',
        options: [
          { value: 'Small', price: 0 },
          { value: 'Medium', price: 0 },
          { value: 'Large', price: 0 },
          { value: 'X-Large', price: 0 }
        ]
      },
      {
        name: 'Pattern',
        options: [
          { value: 'Floral Print', price: 0 },
          { value: 'Solid Navy', price: 0 },
          { value: 'Polka Dots', price: 500 }
        ]
      }
    ],
    specifications: [
      { name: 'Material', value: '100% Chiffon' },
      { name: 'Length', value: 'Maxi Length' },
      { name: 'Sleeve', value: 'Sleeveless' },
      { name: 'Closure', value: 'Back Zipper' },
      { name: 'Lining', value: 'Fully Lined' }
    ],
    tags: ['maxi dress', 'summer', 'chiffon', 'elegant', 'womens', 'party']
  },

  // Home & Garden - Furniture - Living Room
  {
    name: 'Modern L-Shape Sofa Set',
    shortDescription: 'Comfortable 6-seater L-shape sofa in premium fabric',
    description: 'Contemporary L-shape sofa set designed for modern living rooms. Features high-quality foam cushions, durable fabric upholstery, and solid wood frame construction.',
    price: 189999,
    comparePrice: 229999,
    categorySlug: 'living-room',
    brand: 'Interwood',
    sku: 'MLSS-GRY-6S',
    images: [
      { url: '/uploads/products/l-shape-sofa-1.jpg', alt: 'L-shape sofa in living room', isPrimary: true },
      { url: '/uploads/products/l-shape-sofa-2.jpg', alt: 'L-shape sofa detail view', isPrimary: false }
    ],
    stock: { quantity: 15, lowStockThreshold: 3, status: 'in_stock' },
    variants: [
      {
        name: 'Color',
        options: [
          { value: 'Charcoal Gray', price: 0 },
          { value: 'Navy Blue', price: 5000 },
          { value: 'Beige', price: 0 }
        ]
      },
      {
        name: 'Configuration',
        options: [
          { value: 'Left Facing', price: 0 },
          { value: 'Right Facing', price: 0 }
        ]
      }
    ],
    specifications: [
      { name: 'Seating Capacity', value: '6 People' },
      { name: 'Frame Material', value: 'Solid Wood' },
      { name: 'Upholstery', value: 'Premium Fabric' },
      { name: 'Cushion Fill', value: 'High Density Foam' },
      { name: 'Warranty', value: '2 Years' }
    ],
    tags: ['sofa', 'l-shape', 'living room', 'furniture', '6-seater', 'modern'],
    weight: { value: 120, unit: 'kg' },
    dimensions: { length: 280, width: 180, height: 85, unit: 'cm' },
    isFeatured: true
  },

  // Sports & Fitness - Fitness Equipment
  {
    name: 'Adjustable Dumbbell Set',
    shortDescription: 'Space-saving adjustable dumbbells for home workouts',
    description: 'Premium adjustable dumbbell set that replaces multiple weights. Quick weight adjustment from 5kg to 24kg per dumbbell. Perfect for home gym setups.',
    price: 45999,
    comparePrice: 54999,
    categorySlug: 'strength-training',
    brand: 'PowerTech',
    sku: 'ADS-24KG-PR',
    images: [
      { url: '/uploads/products/adjustable-dumbbells-1.jpg', alt: 'Adjustable dumbbells set', isPrimary: true },
      { url: '/uploads/products/adjustable-dumbbells-2.jpg', alt: 'Dumbbell weight adjustment', isPrimary: false }
    ],
    stock: { quantity: 30, lowStockThreshold: 6, status: 'in_stock' },
    variants: [
      {
        name: 'Weight Range',
        options: [
          { value: '5-24kg per dumbbell', price: 0 },
          { value: '5-32kg per dumbbell', price: 15000 }
        ]
      }
    ],
    specifications: [
      { name: 'Weight Range', value: '5kg - 24kg per dumbbell' },
      { name: 'Material', value: 'Cast Iron with Rubber Coating' },
      { name: 'Handle', value: 'Ergonomic Grip' },
      { name: 'Adjustment', value: 'Quick-Select Dial' },
      { name: 'Space Required', value: 'Minimal Storage Space' }
    ],
    tags: ['dumbbells', 'adjustable', 'home gym', 'strength training', 'fitness', 'weights']
  },

  // Books & Media - Books - Fiction
  {
    name: 'The Seven Husbands of Evelyn Hugo',
    shortDescription: 'Bestselling novel by Taylor Jenkins Reid',
    description: 'A captivating novel about the reclusive Hollywood icon Evelyn Hugo who finally decides to tell her life story. A tale of love, ambition, and the price of fame.',
    price: 2999,
    comparePrice: 3499,
    categorySlug: 'fiction',
    brand: 'Atria Books',
    sku: 'TSHOEH-PB-EN',
    images: [
      { url: '/uploads/products/evelyn-hugo-book-1.jpg', alt: 'The Seven Husbands of Evelyn Hugo book cover', isPrimary: true }
    ],
    stock: { quantity: 200, lowStockThreshold: 50, status: 'in_stock' },
    variants: [
      {
        name: 'Format',
        options: [
          { value: 'Paperback', price: 0 },
          { value: 'Hardcover', price: 1500 }
        ]
      }
    ],
    specifications: [
      { name: 'Author', value: 'Taylor Jenkins Reid' },
      { name: 'Publisher', value: 'Atria Books' },
      { name: 'Language', value: 'English' },
      { name: 'Pages', value: '400 pages' },
      { name: 'ISBN', value: '978-1501161933' },
      { name: 'Genre', value: 'Contemporary Fiction' }
    ],
    tags: ['fiction', 'novel', 'bestseller', 'contemporary', 'taylor jenkins reid', 'book']
  },

  // Electronics - Audio & Video - Headphones
  {
    name: 'Sony WH-1000XM5 Wireless Headphones',
    shortDescription: 'Premium noise-canceling headphones with exceptional sound quality',
    description: 'Industry-leading noise cancellation with exceptional sound quality. 30-hour battery life, quick charge, multipoint connection, and comfortable design for all-day wear.',
    price: 89999,
    comparePrice: 99999,
    categorySlug: 'headphones',
    brand: 'Sony',
    sku: 'WH1000XM5-BLK',
    images: [
      { url: '/uploads/products/sony-wh1000xm5-1.jpg', alt: 'Sony WH-1000XM5 black headphones', isPrimary: true },
      { url: '/uploads/products/sony-wh1000xm5-2.jpg', alt: 'Sony WH-1000XM5 wearing view', isPrimary: false }
    ],
    stock: { quantity: 45, lowStockThreshold: 10, status: 'in_stock' },
    variants: [
      {
        name: 'Color',
        options: [
          { value: 'Midnight Black', price: 0 },
          { value: 'Silver', price: 0 }
        ]
      }
    ],
    specifications: [
      { name: 'Type', value: 'Over-ear, Closed-back' },
      { name: 'Noise Cancellation', value: 'Industry-leading ANC' },
      { name: 'Battery Life', value: '30 hours with ANC' },
      { name: 'Connectivity', value: 'Bluetooth 5.2, NFC' },
      { name: 'Quick Charge', value: '3 min = 3 hours playback' },
      { name: 'Voice Assistant', value: 'Google Assistant, Alexa' }
    ],
    tags: ['headphones', 'sony', 'noise canceling', 'wireless', 'premium', 'bluetooth'],
    weight: { value: 250, unit: 'g' },
    isFeatured: true
  }
];

const seedProducts = async () => {
  try {
    console.log('🛍️  Starting product seeding...');

    // Get admin user for createdBy field
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      throw new Error('Admin user not found. Please run user seeder first.');
    }

    // Get all categories for reference
    const categories = await Category.find({});
    const categoryMap = categories.reduce((map, cat) => {
      map[cat.slug] = cat._id;
      return map;
    }, {});

    console.log(`📁 Found ${categories.length} categories in database`);

    // Clear existing products
    console.log('Clearing existing products...');
    await Product.deleteMany({});

    const productData = getProductData(categories, adminUser);
    const createdProducts = [];

    for (const productInfo of productData) {
      const { categorySlug, ...productData } = productInfo;

      // Find category by slug
      const categoryId = categoryMap[categorySlug];
      if (!categoryId) {
        console.log(`⚠️  Category not found for slug: ${categorySlug}, skipping product: ${productInfo.name}`);
        continue;
      }

      // Create product
      const product = new Product({
        ...productData,
        category: categoryId,
        createdBy: adminUser._id
      });

      const savedProduct = await product.save();
      createdProducts.push(savedProduct);

      console.log(`✅ Created product: ${savedProduct.name} (${savedProduct.sku})`);
    }

    console.log('\n📊 Product Seeding Summary:');
    console.log('===========================');
    console.log(`✅ Total products created: ${createdProducts.length}`);

    // Count by category
    const categoryCounts = createdProducts.reduce((acc, product) => {
      const category = categories.find(cat => cat._id.toString() === product.category.toString());
      if (category) {
        acc[category.name] = (acc[category.name] || 0) + 1;
      }
      return acc;
    }, {});

    console.log('\n📈 Products by Category:');
    console.log('========================');
    Object.entries(categoryCounts).forEach(([categoryName, count]) => {
      console.log(`• ${categoryName}: ${count} products`);
    });

    // Featured products
    const featuredProducts = createdProducts.filter(p => p.isFeatured);
    console.log(`\n⭐ Featured products: ${featuredProducts.length}`);

    // Price range
    const prices = createdProducts.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    console.log(`\n💰 Price range: Rs. ${minPrice.toLocaleString()} - Rs. ${maxPrice.toLocaleString()}`);

    console.log('\n🎁 Product Features:');
    console.log('====================');
    console.log('• Multiple product variants (size, color, storage, etc.)');
    console.log('• Detailed specifications and descriptions');
    console.log('• SEO-optimized meta data');
    console.log('• Stock management with low stock alerts');
    console.log('• Product images and galleries');
    console.log('• Tags for easy searching and filtering');
    console.log('• Weight and dimensions for shipping');
    console.log('• Compare prices and discount pricing');

  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  }
};

const runSeeder = async () => {
  try {
    await connectDB();
    await seedProducts();
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

// Run seeder if called directly
if (require.main === module) {
  runSeeder();
}

module.exports = { seedProducts, runSeeder };