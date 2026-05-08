const express = require('express');
const router = express.Router();
const { SystemSetting } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// GET /api/settings/public
// Get public settings like maintenance mode (no auth required)
router.get('/public', async (req, res) => {
    try {
        const maintenanceSetting = await SystemSetting.findByPk('maintenance_mode');
        const isMaintenance = maintenanceSetting ? maintenanceSetting.setting_value === true : false;
        
        res.json({
            maintenance_mode: isMaintenance
        });
    } catch (err) {
        console.error('[Public Settings Error]', err.message);
        res.status(500).send('Server error');
    }
});

// GET /api/settings
// Get all settings (Admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const settings = await SystemSetting.findAll();
        res.json(settings);
    } catch (err) {
        console.error('[Get Settings Error]', err.message);
        res.status(500).send('Server error');
    }
});

// PUT /api/settings/:key
// Update a specific setting (Admin only)
router.put('/:key', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { key } = req.params;
        const { value, description } = req.body;

        let setting = await SystemSetting.findByPk(key);
        
        if (setting) {
            setting.setting_value = value;
            if (description) setting.description = description;
            await setting.save();
        } else {
            setting = await SystemSetting.create({
                setting_key: key,
                setting_value: value,
                description: description || `Auto-created setting for ${key}`
            });
        }

        res.json({ msg: 'Setting updated successfully', setting });
    } catch (err) {
        console.error('[Update Setting Error]', err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
