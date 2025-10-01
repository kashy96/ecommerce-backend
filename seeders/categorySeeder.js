require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

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

const categoryData = [
  // Top Level Categories
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Latest electronic devices, gadgets, and accessories',
    image: '/uploads/categories/electronics.jpg',
    sortOrder: 1,
    level: 0,
    parentId: null,
    isActive: true,
    children: [
      {
        name: 'Mobile Phones',
        slug: 'mobile-phones',
        description: 'Smartphones, feature phones, and accessories',
        image: '/uploads/categories/mobile-phones.jpg',
        sortOrder: 1,
        level: 1,
        children: [
          {
            name: 'Smartphones',
            slug: 'smartphones',
            description: 'Latest smartphones from top brands',
            sortOrder: 1,
            level: 2
          },
          {
            name: 'Phone Cases',
            slug: 'phone-cases',
            description: 'Protective cases and covers',
            sortOrder: 2,
            level: 2
          },
          {
            name: 'Chargers & Cables',
            slug: 'chargers-cables',
            description: 'Mobile chargers and charging cables',
            sortOrder: 3,
            level: 2
          }
        ]
      },
      {
        name: 'Laptops & Computers',
        slug: 'laptops-computers',
        description: 'Laptops, desktops, and computer accessories',
        image: '/uploads/categories/laptops.jpg',
        sortOrder: 2,
        level: 1,
        children: [
          {
            name: 'Laptops',
            slug: 'laptops',
            description: 'Gaming, business, and personal laptops',
            sortOrder: 1,
            level: 2
          },
          {
            name: 'Desktop Computers',
            slug: 'desktop-computers',
            description: 'Complete desktop systems and components',
            sortOrder: 2,
            level: 2
          },
          {
            name: 'Computer Accessories',
            slug: 'computer-accessories',
            description: 'Keyboards, mice, monitors, and more',
            sortOrder: 3,
            level: 2
          }
        ]
      },
      {
        name: 'Audio & Video',
        slug: 'audio-video',
        description: 'Headphones, speakers, and entertainment devices',
        image: '/uploads/categories/audio-video.jpg',
        sortOrder: 3,
        level: 1,
        children: [
          {
            name: 'Headphones',
            slug: 'headphones',
            description: 'Wireless, wired, and gaming headphones',
            sortOrder: 1,
            level: 2
          },
          {
            name: 'Speakers',
            slug: 'speakers',
            description: 'Bluetooth speakers and sound systems',
            sortOrder: 2,
            level: 2
          }
        ]
      }
    ]
  },
  {
    name: 'Fashion & Clothing',
    slug: 'fashion-clothing',
    description: 'Trendy clothing and fashion accessories for all',
    image: '/uploads/categories/fashion.jpg',
    sortOrder: 2,
    level: 0,
    parentId: null,
    isActive: true,
    children: [
      {
        name: "Men's Clothing",
        slug: 'mens-clothing',
        description: 'Stylish clothing for men',
        image: '/uploads/categories/mens-clothing.jpg',
        sortOrder: 1,
        level: 1,
        children: [
          {
            name: 'Shirts',
            slug: 'mens-shirts',
            description: 'Casual and formal shirts',
            sortOrder: 1,
            level: 2
          },
          {
            name: 'Pants & Jeans',
            slug: 'mens-pants',
            description: 'Trousers, jeans, and casual pants',
            sortOrder: 2,
            level: 2
          },
          {
            name: "Men's Shoes",
            slug: 'mens-shoes',
            description: 'Formal and casual footwear for men',
            sortOrder: 3,
            level: 2
          }
        ]
      },
      {
        name: "Women's Clothing",
        slug: 'womens-clothing',
        description: 'Fashionable clothing for women',
        image: '/uploads/categories/womens-clothing.jpg',
        sortOrder: 2,
        level: 1,
        children: [
          {
            name: 'Dresses',
            slug: 'womens-dresses',
            description: 'Casual and formal dresses',
            sortOrder: 1,
            level: 2
          },
          {
            name: 'Tops & Blouses',
            slug: 'womens-tops',
            description: 'Stylish tops and blouses',
            sortOrder: 2,
            level: 2
          },
          {
            name: "Women's Shoes",
            slug: 'womens-shoes',
            description: 'Heels, flats, and casual footwear for women',
            sortOrder: 3,
            level: 2
          }
        ]
      },
      {
        name: 'Accessories',
        slug: 'fashion-accessories',
        description: 'Fashion accessories and jewelry',
        image: '/uploads/categories/accessories.jpg',
        sortOrder: 3,
        level: 1,
        children: [
          {
            name: 'Bags & Purses',
            slug: 'bags-purses',
            description: 'Handbags, backpacks, and purses',
            sortOrder: 1,
            level: 2
          },
          {
            name: 'Jewelry',
            slug: 'jewelry',
            description: 'Rings, necklaces, and bracelets',
            sortOrder: 2,
            level: 2
          },
          {
            name: 'Watches',
            slug: 'watches',
            description: 'Smart watches and traditional timepieces',
            sortOrder: 3,
            level: 2
          }
        ]
      }
    ]
  },
  {
    name: 'Home & Garden',
    slug: 'home-garden',
    description: 'Everything for your home and garden',
    image: '/uploads/categories/home-garden.jpg',
    sortOrder: 3,
    level: 0,
    parentId: null,
    isActive: true,
    children: [
      {
        name: 'Furniture',
        slug: 'furniture',
        description: 'Indoor and outdoor furniture',
        image: '/uploads/categories/furniture.jpg',
        sortOrder: 1,
        level: 1,
        children: [
          {
            name: 'Living Room',
            slug: 'living-room-furniture',
            description: 'Sofas, coffee tables, and entertainment units',
            sortOrder: 1,
            level: 2
          },
          {
            name: 'Bedroom',
            slug: 'bedroom-furniture',
            description: 'Beds, wardrobes, and nightstands',
            sortOrder: 2,
            level: 2
          },
          {
            name: 'Office',
            slug: 'office-furniture',
            description: 'Office chairs, desks, and storage',
            sortOrder: 3,
            level: 2
          }
        ]
      },
      {
        name: 'Kitchen & Dining',
        slug: 'kitchen-dining',
        description: 'Kitchen appliances and dining essentials',
        image: '/uploads/categories/kitchen.jpg',
        sortOrder: 2,
        level: 1,
        children: [
          {
            name: 'Cookware',
            slug: 'cookware',
            description: 'Pots, pans, and cooking utensils',
            sortOrder: 1,
            level: 2
          },
          {
            name: 'Small Appliances',
            slug: 'small-appliances',
            description: 'Blenders, toasters, and coffee makers',
            sortOrder: 2,
            level: 2
          }
        ]
      },
      {
        name: 'Garden & Outdoor',
        slug: 'garden-outdoor',
        description: 'Gardening tools and outdoor equipment',
        image: '/uploads/categories/garden.jpg',
        sortOrder: 3,
        level: 1,
        children: [
          {
            name: 'Garden Tools',
            slug: 'garden-tools',
            description: 'Shovels, rakes, and gardening equipment',
            sortOrder: 1,
            level: 2
          },
          {
            name: 'Outdoor Furniture',
            slug: 'outdoor-furniture',
            description: 'Patio sets and garden furniture',
            sortOrder: 2,
            level: 2
          }
        ]
      }
    ]
  },
  {
    name: 'Sports & Fitness',
    slug: 'sports-fitness',
    description: 'Sports equipment and fitness gear',
    image: '/uploads/categories/sports.jpg',
    sortOrder: 4,
    level: 0,
    parentId: null,
    isActive: true,
    children: [
      {
        name: 'Fitness Equipment',
        slug: 'fitness-equipment',
        description: 'Home gym and workout equipment',
        sortOrder: 1,
        level: 1,
        children: [
          {
            name: 'Cardio Equipment',
            slug: 'cardio-equipment',
            description: 'Treadmills, bikes, and cardio machines',
            sortOrder: 1,
            level: 2
          },
          {
            name: 'Strength Training',
            slug: 'strength-training',
            description: 'Weights, resistance bands, and strength gear',
            sortOrder: 2,
            level: 2
          }
        ]
      },
      {
        name: 'Sports Gear',
        slug: 'sports-gear',
        description: 'Equipment for various sports',
        sortOrder: 2,
        level: 1,
        children: [
          {
            name: 'Cricket',
            slug: 'cricket-gear',
            description: 'Cricket bats, balls, and protective gear',
            sortOrder: 1,
            level: 2
          },
          {
            name: 'Football',
            slug: 'football-gear',
            description: 'Footballs, boots, and training equipment',
            sortOrder: 2,
            level: 2
          }
        ]
      }
    ]
  },
  {
    name: 'Books & Media',
    slug: 'books-media',
    description: 'Books, magazines, and educational materials',
    image: '/uploads/categories/books.jpg',
    sortOrder: 5,
    level: 0,
    parentId: null,
    isActive: true,
    children: [
      {
        name: 'Books',
        slug: 'books',
        description: 'Fiction, non-fiction, and educational books',
        sortOrder: 1,
        level: 1,
        children: [
          {
            name: 'Fiction',
            slug: 'fiction-books',
            description: 'Novels and fiction literature',
            sortOrder: 1,
            level: 2
          },
          {
            name: 'Non-Fiction',
            slug: 'non-fiction-books',
            description: 'Biography, history, and factual books',
            sortOrder: 2,
            level: 2
          },
          {
            name: 'Educational',
            slug: 'educational-books',
            description: 'Textbooks and learning materials',
            sortOrder: 3,
            level: 2
          }
        ]
      },
      {
        name: 'Stationery',
        slug: 'stationery',
        description: 'Office and school supplies',
        sortOrder: 2,
        level: 1,
        children: [
          {
            name: 'Pens & Pencils',
            slug: 'pens-pencils',
            description: 'Writing instruments and accessories',
            sortOrder: 1,
            level: 2
          },
          {
            name: 'Notebooks',
            slug: 'notebooks',
            description: 'Notebooks, journals, and planners',
            sortOrder: 2,
            level: 2
          }
        ]
      }
    ]
  }
];

const seedCategories = async () => {
  try {
    console.log('🗂️  Starting category seeding...');

    // Clear existing categories
    console.log('Clearing existing categories...');
    await Category.deleteMany({});

    // Function to create categories recursively
    const createCategoriesRecursively = async (categories, parentId = null) => {
      const createdCategories = [];

      for (const categoryData of categories) {
        const { children, ...categoryInfo } = categoryData;

        // Create the main category
        const category = new Category({
          ...categoryInfo,
          parentId
        });

        const savedCategory = await category.save();
        createdCategories.push(savedCategory);

        console.log(`✅ Created category: ${savedCategory.name} (Level ${savedCategory.level})`);

        // Create children if they exist
        if (children && children.length > 0) {
          const childCategories = await createCategoriesRecursively(children, savedCategory._id);
          createdCategories.push(...childCategories);
        }
      }

      return createdCategories;
    };

    // Create all categories
    const allCategories = await createCategoriesRecursively(categoryData);

    console.log('\n📊 Category Seeding Summary:');
    console.log('============================');
    console.log(`✅ Total categories created: ${allCategories.length}`);

    // Count by level
    const levelCounts = allCategories.reduce((acc, cat) => {
      acc[cat.level] = (acc[cat.level] || 0) + 1;
      return acc;
    }, {});

    Object.entries(levelCounts).forEach(([level, count]) => {
      const levelName = level === '0' ? 'Top Level' : level === '1' ? 'Second Level' : 'Third Level';
      console.log(`   ${levelName} categories: ${count}`);
    });

    console.log('\n🏷️  Top Level Categories:');
    console.log('========================');
    const topLevelCategories = allCategories.filter(cat => cat.level === 0);
    topLevelCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (${cat.slug})`);
    });

    console.log('\n💡 Category Features:');
    console.log('====================');
    console.log('• Hierarchical structure with unlimited nesting');
    console.log('• SEO-friendly slugs for all categories');
    console.log('• Sort ordering for custom arrangement');
    console.log('• Active/inactive status control');
    console.log('• Parent-child relationships established');

  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    throw error;
  }
};

const runSeeder = async () => {
  try {
    await connectDB();
    await seedCategories();
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

// Run seeder if called directly
if (require.main === module) {
  runSeeder();
}

module.exports = { seedCategories, runSeeder };