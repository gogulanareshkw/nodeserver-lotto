const config = require('../../config');

// Email verification utilities
const emailVerifier = {
  // Validate email format
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Check if email domain is valid
  validateEmailDomain: (emailOrDomain) => {
    // If it's an email, extract the domain
    const domain = emailOrDomain.includes('@') ? emailOrDomain.replace(/.*@/, "") : emailOrDomain;
    const invalidDomains = ['tempmail.com', 'throwaway.com', 'test.com'];
    return !invalidDomains.includes(domain.toLowerCase());
  },

  // Extract domain from email
  extractDomain: (email) => {
    return email.replace(/.*@/, "");
  },

  // Check if email is disposable
  isDisposableEmail: (email) => {
    const domain = emailVerifier.extractDomain(email);
    const disposableDomains = [
      'tempmail.com', 'throwaway.com', 'test.com', 'example.com',
      'mailinator.com', 'guerrillamail.com', '10minutemail.com'
    ];
    return disposableDomains.includes(domain.toLowerCase());
  }
};

module.exports = emailVerifier;