const fs = require('fs');
const file = 'routes/adminRoutes.js';
let c = fs.readFileSync(file, 'utf8');

// Find the dashboard block start and end precisely
const START = `        let responseData = { stats: {}, recentOrders: [] };`;
const END_MARKER = `        // Recent Orders (Recent activity)`;

const startIdx = c.indexOf(START);
const endIdx = c.indexOf(END_MARKER);

if (startIdx === -1) { console.log('ERROR: START not found'); process.exit(1); }
if (endIdx === -1)   { console.log('ERROR: END not found');   process.exit(1); }

console.log(`Replacing lines from idx ${startIdx} to ${endIdx}`);

const newBlock = `        let responseData = { stats: {}, recentOrders: [] };
        const { role_id, permissions = {} } = req.user;
        const isSuperAdmin = role_id === 1;

        // Check if user has permission on module (ID-based, no role name strings)
        const can = (module, action = 'view') =>
            isSuperAdmin || (Array.isArray(permissions[module]) && permissions[module].includes(action));

        const stats = {};

        // Orders
        if (can('orders')) {
            stats.totalOrders = await Order.count();
            const currentMonthOrders = await Order.count({ where: { createdAt: { [Op.gte]: firstDayCurrentMonth } } });
            const lastMonthOrders = await Order.count({ where: { createdAt: { [Op.gte]: firstDayLastMonth, [Op.lte]: lastDayLastMonth } } });
            stats.orderGrowth = calcGrowth(currentMonthOrders, lastMonthOrders).toFixed(1);
            stats.totalPendingOrders = await Order.count({
                where: { status: 'paid' },
                include: [{ model: OrderItem, as: 'items', where: { delivery_status: { [Op.ne]: 'delivered' } }, required: true }],
                distinct: true
            });
        }

        // Revenue
        if (can('payments')) {
            stats.revenue = await Order.sum('total_amount') || 0;
            const curRevenue = await Order.sum('total_amount', { where: { createdAt: { [Op.gte]: firstDayCurrentMonth } } }) || 0;
            const lastRevenue = await Order.sum('total_amount', { where: { createdAt: { [Op.gte]: firstDayLastMonth, [Op.lte]: lastDayLastMonth } } }) || 0;
            stats.revenueGrowth = calcGrowth(curRevenue, lastRevenue).toFixed(1);
        }

        // Users
        if (can('users')) {
            stats.totalUsers = await User.count();
            const curUsers = await User.count({ where: { createdAt: { [Op.gte]: firstDayCurrentMonth } } });
            const lastUsers = await User.count({ where: { createdAt: { [Op.gte]: firstDayLastMonth, [Op.lte]: lastDayLastMonth } } });
            stats.userGrowth = calcGrowth(curUsers, lastUsers).toFixed(1);
        }

        // Products
        if (can('products')) {
            stats.totalProducts = await Product.count();
            stats.lowStockCount = await Product.count({ where: { resource_file: null } });
        }

        // Marketing / Coupons
        if (can('marketing')) {
            stats.activeCoupons = await Coupon.count({ where: { is_active: true } });
            const mktOrders = stats.totalOrders ?? await Order.count();
            const mktUsers  = stats.totalUsers  ?? await User.count();
            stats.conversionRate = mktUsers > 0 ? ((mktOrders / mktUsers) * 100).toFixed(2) + '%' : '0%';
        }

        // Support / Inquiries
        if (can('reviews')) {
            stats.recentInquiriesCount = await Enquiry.count({ where: { status: { [Op.ne]: 'closed' } } });
        }

        responseData.stats = stats;

        `;

const before = c.substring(0, startIdx);
const after  = c.substring(endIdx);
c = before + newBlock + after;
fs.writeFileSync(file, c, 'utf8');

// Verify
console.log('Done! Verifying...');
console.log('role_id check present:', c.includes('role_id === 1'));
console.log('can() helper present:', c.includes("const can = "));
console.log('Old role === admin gone:', !c.includes("role === 'admin'"));
console.log('Recent Orders marker still present:', c.includes('Recent Orders (Recent activity)'));
