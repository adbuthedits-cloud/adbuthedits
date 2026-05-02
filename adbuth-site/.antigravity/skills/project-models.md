# Skill: Project Models (Sequelize)

Comprehensive understanding of the Adbuth project's database models and their relationships. Use this skill when designing features that involve database interactions, migrations, or data integrity.

## Core Models

### 1. User & Admin
- **User**: Customers of the site. `user_id`, `email`, `password`, etc.
- **Admin**: Staff/Employees. `admin_id`, `role_id`, `email`.
- **Role**: Permissions and roles for admins.
- **AdminSession**: Tracks active admin logins.

### 2. Product & Catalog
- **Product**: The main sellable item. 
  - Fields: `title`, `price`, `summary`, `tags`, `thumbnail`, `images`, `video`.
  - Master Data FKs: `parent_category_id`, `asset_type_id`, `asset_variant_id`, `asset_category_id`, `asset_sub_category_id`, `asset_orientation_id`.
  - Hierarchy: Digital Invitations/Greetings -> Asset Category -> Asset Sub Category.
  - Sku Pattern: `JAP-PO-WI-PE-AN-HOR-1001`.
- **Category / SubCategory**: Legacy structure and blog categories.
- **Asset...**: Master data tables for specific product attributes (Type, Variant, Category, etc.).

### 3. Order & Fulfillment
- **Order**: Customer orders.
  - Statuses: `pending`, `paid`, `placed`, `inprocessing`, `delivered`, `cancelled`.
  - Internal Status: `unassigned`, `assigned`, `in_progress`, `delivered`, `completed`.
  - Assignments: `assigned_to` (FK to Admin).
- **OrderItem**: Individual products in an order.
  - `customization`: JSON data from user forms.
  - `delivery_link`: S3/R2 link for finished files.
  - `download_expires_at`: Enforces the 30-day window.
- **OrderTimeline**: Audit trail for order status changes and actions.

### 4. Support & Marketing
- **Coupon**: Discount codes with `usage_limit`, `per_user_limit`, and `min_order_value`.
- **CouponUsage**: Tracks which user used which coupon on which order.
- **Payment**: Razorpay transaction details linked to orders.
- **Review**: Customer feedback on products.
- **Blog**: Content management.
- **Enquiry**: Contact form submissions.

## Key Relationships
- `Order.hasMany(OrderItem)`
- `Product.hasMany(OrderItem)`
- `User.hasMany(Order)`
- `Order.belongsTo(Admin, { as: 'assignedEmployee' })`
- `Category.hasMany(AssetCategory)`
- `AssetCategory.hasMany(AssetSubCategory)`

## Design Patterns
- **Soft Deletes**: Not explicitly used, check `paranoid: true` in models if needed.
- **JSON Fields**: Heavily used for `customization`, `images`, and `tags`.
- **Audit Trails**: Managed via `OrderTimeline` and `AuditLog`.
