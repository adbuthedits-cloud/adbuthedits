const { SystemSetting } = require('../models');

const DEFAULT_BRAND_LOGO = 'https://assets.adbuthverse.com/brand/AdbuthVerse%20(1)_1785841733705.png';

/**
 * Fetches the active brand logo URL from SystemSettings table in DB,
 * falling back to the default production logo URL.
 */
async function getBrandLogoUrl() {
    try {
        const setting = await SystemSetting.findByPk('brand_logo');
        if (setting && setting.setting_value) {
            return setting.setting_value;
        }
    } catch (error) {
        console.error('[getBrandLogoUrl Error]', error.message);
    }
    return DEFAULT_BRAND_LOGO;
}

module.exports = {
    getBrandLogoUrl,
    DEFAULT_BRAND_LOGO
};
