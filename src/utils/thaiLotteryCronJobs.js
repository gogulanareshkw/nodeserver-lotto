const dbUpdates = require('../cron/dbUpdates');
const config = require('../../config');

// Thai Lottery specific cron jobs
const initiateThaiLotteryCronJobs = () => {
  config.logger.info('Initializing Thai Lottery cron jobs...');
  
  try {
    // This function is called from the main server.js
    // The actual cron job initialization is handled in gameCronJobs.js
    
    config.logger.info('Thai Lottery cron jobs initialized successfully');
  } catch (error) {
    config.logger.error({ error }, 'Failed to initialize Thai Lottery cron jobs');
  }
};

module.exports = initiateThaiLotteryCronJobs;