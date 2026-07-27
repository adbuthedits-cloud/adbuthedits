// List of known disposable/temporary email provider domains
const DISPOSABLE_DOMAINS = new Set([
    'mailinator.com', 'tempmail.com', '10minutemail.com', 'yopmail.com',
    'guerrillamail.com', 'trashmail.com', 'dispostable.com', 'getnada.com',
    'temp-mail.org', 'fakemail.net', 'sharklasers.com', 'crazymailing.com',
    'disposable.com', 'mohmal.com', 'generator.email', 'tempmailo.com',
    'inboxkitten.com', 'maildrop.cc', 'throwawaymail.com', 'tempmail.net',
    'emailondrop.com', 'burnermail.io', 'mailnesia.com', 'byom.de',
    'disposable.com', 'mytemp.email', 'tmail.ws', 'tmpmail.org',
    'tmpmail.net', 'anonymbox.com', 'bupmail.com', 'dropmail.me'
]);

/**
 * Checks if an email address belongs to a disposable/temporary email provider.
 * @param {string} email 
 * @returns {boolean} true if disposable, false otherwise
 */
function isDisposableEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const parts = email.trim().toLowerCase().split('@');
    if (parts.length !== 2) return false;
    const domain = parts[1];
    return DISPOSABLE_DOMAINS.has(domain);
}

module.exports = { isDisposableEmail, DISPOSABLE_DOMAINS };
