const cron = require('cron');
const config = require('../../config');
const dbUpdates = require('../cron/dbUpdates');
const moment = require('moment');

// Game cron jobs for automated lottery management
const gameCronJobs = {
  // Initialize all cron jobs
  init: () => {
    config.logger.info('Initializing game cron jobs...');
    
    // Start all cron jobs
    gameCronJobs.startCurrencyRatesJob();
    gameCronJobs.startThaiLotteryJobs();
    gameCronJobs.startBangkokWeeklyJobs();
    gameCronJobs.startDubaiDailyJobs();
    gameCronJobs.startLondonWeeklyJobs();
    gameCronJobs.startMexicoMonthlyJobs();
    gameCronJobs.startMonthlyBonusJob();
    gameCronJobs.startDatabaseMaintenanceJob();
    
    config.logger.info('All game cron jobs initialized successfully');
  },

  // Currency rates update job
  startCurrencyRatesJob: () => {
    const currencyJob = new cron.CronJob(
      config.GetCurrencyRatesJob,
      async () => {
        try {
          config.logger.info('Starting currency rates update job');
          
          // Import currency service
          const currencyService = require('../services/currencyService');
          await currencyService.updateCurrencyRates();
          
          config.logger.info('Currency rates update job completed');
        } catch (error) {
          config.logger.error({ error }, 'Currency rates update job failed');
        }
      },
      null,
      false,
      'UTC'
    );
    
    currencyJob.start();
    config.logger.info('Currency rates job scheduled:', config.GetCurrencyRatesJob);
  },

  // Thai Lottery Jobs
  startThaiLotteryJobs: () => {
    // Start Thai lottery games
    const startThaiJob = new cron.CronJob(
      config.StartThaiLotteryGameJob,
      async () => {
        try {
          config.logger.info('Starting Thai lottery games');
          await dbUpdates.updateLotteryGameStatus(1, 'ACTIVE');
          config.logger.info('Thai lottery games started');
        } catch (error) {
          config.logger.error({ error }, 'Failed to start Thai lottery games');
        }
      },
      null,
      false,
      'UTC'
    );
    
    // Stop Thai lottery games
    const stopThaiJob = new cron.CronJob(
      config.StopThaiLotteryGameJob,
      async () => {
        try {
          config.logger.info('Stopping Thai lottery games');
          await dbUpdates.updateLotteryGameStatus(1, 'INACTIVE');
          config.logger.info('Thai lottery games stopped');
        } catch (error) {
          config.logger.error({ error }, 'Failed to stop Thai lottery games');
        }
      },
      null,
      false,
      'UTC'
    );
    
    startThaiJob.start();
    stopThaiJob.start();
    config.logger.info('Thai lottery jobs scheduled');
  },

  // Bangkok Weekly Jobs
  startBangkokWeeklyJobs: () => {
    const startBangkokJob = new cron.CronJob(
      config.StartBangkokWeeklyLotteryGameJob,
      async () => {
        try {
          config.logger.info('Starting Bangkok weekly lottery games');
          await dbUpdates.updateLotteryGameStatus(2, 'ACTIVE');
          config.logger.info('Bangkok weekly lottery games started');
        } catch (error) {
          config.logger.error({ error }, 'Failed to start Bangkok weekly lottery games');
        }
      },
      null,
      false,
      'UTC'
    );
    
    const stopBangkokJob = new cron.CronJob(
      config.StopBangkokWeeklyLotteryGameJob,
      async () => {
        try {
          config.logger.info('Stopping Bangkok weekly lottery games');
          await dbUpdates.updateLotteryGameStatus(2, 'INACTIVE');
          config.logger.info('Bangkok weekly lottery games stopped');
        } catch (error) {
          config.logger.error({ error }, 'Failed to stop Bangkok weekly lottery games');
        }
      },
      null,
      false,
      'UTC'
    );
    
    startBangkokJob.start();
    stopBangkokJob.start();
    config.logger.info('Bangkok weekly jobs scheduled');
  },

  // Dubai Daily Jobs
  startDubaiDailyJobs: () => {
    const startDubaiJob = new cron.CronJob(
      config.StartDubaiDailyLotteryGameJob,
      async () => {
        try {
          config.logger.info('Starting Dubai daily lottery games');
          await dbUpdates.updateLotteryGameStatus(3, 'ACTIVE');
          config.logger.info('Dubai daily lottery games started');
        } catch (error) {
          config.logger.error({ error }, 'Failed to start Dubai daily lottery games');
        }
      },
      null,
      false,
      'UTC'
    );
    
    const stopDubaiJob = new cron.CronJob(
      config.StopDubaiDailyLotteryGameJob,
      async () => {
        try {
          config.logger.info('Stopping Dubai daily lottery games');
          await dbUpdates.updateLotteryGameStatus(3, 'INACTIVE');
          config.logger.info('Dubai daily lottery games stopped');
        } catch (error) {
          config.logger.error({ error }, 'Failed to stop Dubai daily lottery games');
        }
      },
      null,
      false,
      'UTC'
    );
    
    startDubaiJob.start();
    stopDubaiJob.start();
    config.logger.info('Dubai daily jobs scheduled');
  },

  // London Weekly Jobs
  startLondonWeeklyJobs: () => {
    const startLondonJob = new cron.CronJob(
      config.StartLondonWeeklyLotteryGameJob,
      async () => {
        try {
          config.logger.info('Starting London weekly lottery games');
          await dbUpdates.updateLotteryGameStatus(4, 'ACTIVE');
          config.logger.info('London weekly lottery games started');
        } catch (error) {
          config.logger.error({ error }, 'Failed to start London weekly lottery games');
        }
      },
      null,
      false,
      'UTC'
    );
    
    const stopLondonJob = new cron.CronJob(
      config.StopLondonWeeklyLotteryGameJob,
      async () => {
        try {
          config.logger.info('Stopping London weekly lottery games');
          await dbUpdates.updateLotteryGameStatus(4, 'INACTIVE');
          config.logger.info('London weekly lottery games stopped');
        } catch (error) {
          config.logger.error({ error }, 'Failed to stop London weekly lottery games');
        }
      },
      null,
      false,
      'UTC'
    );
    
    startLondonJob.start();
    stopLondonJob.start();
    config.logger.info('London weekly jobs scheduled');
  },

  // Mexico Monthly Jobs
  startMexicoMonthlyJobs: () => {
    const startMexicoJob = new cron.CronJob(
      config.StartMexicoMonthlyLotteryGameJob,
      async () => {
        try {
          config.logger.info('Starting Mexico monthly lottery games');
          await dbUpdates.updateLotteryGameStatus(5, 'ACTIVE');
          config.logger.info('Mexico monthly lottery games started');
        } catch (error) {
          config.logger.error({ error }, 'Failed to start Mexico monthly lottery games');
        }
      },
      null,
      false,
      'UTC'
    );
    
    const stopMexicoJob = new cron.CronJob(
      config.StopMexicoMonthlyLotteryGameJob,
      async () => {
        try {
          config.logger.info('Stopping Mexico monthly lottery games');
          await dbUpdates.updateLotteryGameStatus(5, 'INACTIVE');
          config.logger.info('Mexico monthly lottery games stopped');
        } catch (error) {
          config.logger.error({ error }, 'Failed to stop Mexico monthly lottery games');
        }
      },
      null,
      false,
      'UTC'
    );
    
    startMexicoJob.start();
    stopMexicoJob.start();
    config.logger.info('Mexico monthly jobs scheduled');
  },

  // Monthly bonus release job
  startMonthlyBonusJob: () => {
    const monthlyBonusJob = new cron.CronJob(
      config.releaseMonthlyBonusJob,
      async () => {
        try {
          config.logger.info('Starting monthly bonus release job');
          await dbUpdates.updateReferralBonuses();
          config.logger.info('Monthly bonus release job completed');
        } catch (error) {
          config.logger.error({ error }, 'Monthly bonus release job failed');
        }
      },
      null,
      false,
      'UTC'
    );
    
    monthlyBonusJob.start();
    config.logger.info('Monthly bonus job scheduled:', config.releaseMonthlyBonusJob);
  },

  // Database maintenance job
  startDatabaseMaintenanceJob: () => {
    const maintenanceJob = new cron.CronJob(
      '0 2 * * 0', // Every Sunday at 2 AM
      async () => {
        try {
          config.logger.info('Starting database maintenance job');
          await dbUpdates.performDatabaseMaintenance();
          config.logger.info('Database maintenance job completed');
        } catch (error) {
          config.logger.error({ error }, 'Database maintenance job failed');
        }
      },
      null,
      false,
      'UTC'
    );
    
    maintenanceJob.start();
    config.logger.info('Database maintenance job scheduled');
  },

  // Stop all cron jobs
  stopAll: () => {
    config.logger.info('Stopping all game cron jobs...');
    // Note: In a real implementation, you would store references to jobs and stop them
    config.logger.info('All game cron jobs stopped');
  }
};

module.exports = gameCronJobs;
