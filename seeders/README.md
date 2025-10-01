# Database Seeders

This directory contains database seeder scripts to populate your application with comprehensive e-commerce data.

## Quick Start

Run all seeders in the correct order:

```bash
npm run seed:all
```

This will seed users, categories, and products with all relationships properly established.

## Individual Seeders

### User Seeder

Creates default admin and user accounts for development and testing.

```bash
npm run seed:users
```

#### Seeded Accounts
- **Admin:** admin@modernshop.com / admin123 (Full admin access)
- **User:** user@modernshop.com / user123 (Regular user access)

### Category Seeder

Creates a comprehensive hierarchical category structure.

```bash
npm run seed:categories
```

#### Seeded Categories
- **Electronics** (Mobile Phones, Laptops & Computers, Audio & Video)
- **Fashion & Clothing** (Men's, Women's, Accessories)
- **Home & Garden** (Furniture, Kitchen & Dining, Garden & Outdoor)
- **Sports & Fitness** (Fitness Equipment, Sports Gear)
- **Books & Media** (Books, Stationery)

Total: 6 main categories with 15+ subcategories and 30+ sub-subcategories

### Product Seeder

Creates sample products across all categories with realistic data.

```bash
npm run seed:products
```

#### Featured Products Include
- iPhone 15 Pro Max & Samsung Galaxy S24 Ultra
- MacBook Pro 16" M3 Max & Dell XPS 13 Plus
- Premium clothing and fashion items
- Home furniture and appliances
- Fitness equipment and sports gear
- Books and educational materials
- Audio equipment and accessories

Total: 10+ sample products with variants, specifications, and detailed descriptions

## Seeder Features

### Advanced Product Data
- **Multiple Variants:** Size, color, storage, configuration options
- **Detailed Specifications:** Technical details for each product
- **SEO Optimization:** Meta titles, descriptions, and keywords
- **Inventory Management:** Stock levels and low-stock thresholds
- **Image Galleries:** Multiple product images with alt text
- **Pricing:** Regular prices, compare prices, and variant pricing
- **Categories:** Proper category relationships
- **Tags:** Search-friendly product tags
- **Physical Properties:** Weight, dimensions for shipping

### Category Hierarchy
- **Unlimited Nesting:** Support for deep category structures
- **Parent-Child Relationships:** Properly linked category trees
- **SEO Slugs:** URL-friendly category identifiers
- **Sort Ordering:** Custom category arrangement
- **Active Status:** Enable/disable categories

### User Accounts
- **Role-Based Access:** Admin and user accounts
- **Secure Authentication:** Bcrypt password hashing
- **Complete Profiles:** Names, addresses, contact information
- **Email Verification:** Pre-verified accounts for testing

## Database Relationships

The seeders establish proper relationships between:
- **Products ↔ Categories:** Each product belongs to a specific category
- **Products ↔ Users:** Products are created by admin users
- **Categories ↔ Categories:** Parent-child hierarchical relationships

## Security Features

1. **Role Protection:** Users cannot escalate to admin role
2. **Password Security:** Bcrypt hashing with high salt rounds
3. **Data Validation:** All seeded data follows model validation rules
4. **Clean State:** Seeders clear existing data to prevent conflicts

## Development Workflow

1. **Initial Setup:** `npm run seed:all` to populate fresh database
2. **User Testing:** `npm run seed:users` to reset user accounts
3. **Category Updates:** `npm run seed:categories` to update category structure
4. **Product Testing:** `npm run seed:products` to refresh product catalog

## Production Warning

⚠️ **Important:**
- Change default passwords before production deployment
- Use environment-specific seeding strategies
- Consider data privacy and security implications

## File Structure

```
seeders/
├── README.md           # This documentation
├── index.js           # Main seeder (runs all)
├── userSeeder.js      # User accounts
├── categorySeeder.js  # Category hierarchy
└── productSeeder.js   # Product catalog
```

## Support

The seeded data provides a complete foundation for testing:
- Admin panel functionality
- User shopping experience
- Category navigation
- Product browsing and filtering
- Order placement workflows
- Review and rating systems

Perfect for development, testing, and demonstration purposes!