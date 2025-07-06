const dotenv = require('dotenv');
const path = require('path');
const logger = require('pino')();

let env = process.env.NODE_ENV || "production";

dotenv.config({
    path: path.resolve(__dirname, `${env}.env`)
});

module.exports = {
    logger: logger,
    NODE_ENV: process.env.NODE_ENV || 'development',
    HOST: process.env.HOST || 'localhost',
    PORT: process.env.PORT || 3001,
    SECURE_APP_KEY: process.env.SECURE_APP_KEY || '68c1b935-1c1f-4c10-b16b-3fd6e3cba270',
    MONGO_DB_URL: process.env.MONGO_DB_URL || 'mongodb://localhost:27017/A2ZLottoDB',
    jwtSecret: process.env.jwtSecret || "a2ZlOtToSeCrEtKeY",
    email: process.env.email || "test@gmail.com",
    emailPassword: process.env.emailPassword || "test@123",
    superadmins: process.env.superadmins || "a2zlottoking@gmail.com;",
    MJ_APIKEY_PUBLIC: process.env.MJ_APIKEY_PUBLIC || "",
    MJ_APIKEY_PRIVATE: process.env.MJ_APIKEY_PRIVATE || "",
    SIB_APIKEY: process.env.SIB_APIKEY || "",
    GEOAPIFY_APIKEY: process.env.GEOAPIFY_APIKEY || "a392dd239779441d849ffb54f9ab0997",
    CLOUDINARY_CLOUDNAME: process.env.CLOUDINARY_CLOUDNAME || "",
    CLOUDINARY_APIKEY: process.env.CLOUDINARY_APIKEY || "",
    CLOUDINARY_APISECRET: process.env.CLOUDINARY_APISECRET || "",
    GetCurrencyRatesJob: process.env.GetCurrencyRatesJob || "1 0 * * *",
    StartThaiLotteryGameJob: process.env.StartThaiLotteryGameJob || "0 0 2,17 * *",
    StopThaiLotteryGameJob: process.env.StopThaiLotteryGameJob || "30 8 1,16 * *",
    StartLastThaiLotteryGameJob: process.env.StartLastThaiLotteryGameJob || "0 0 31 11 *",
    StopLastThaiLotteryGameJob: process.env.StopLastThaiLotteryGameJob || "30 8 30 11 *",
    StartBangkokWeeklyLotteryGameJob: process.env.StartBangkokWeeklyLotteryGameJob || "0 0 * * 6",
    StopBangkokWeeklyLotteryGameJob: process.env.StopBangkokWeeklyLotteryGameJob || "30 8 * * 5",
    StartDubaiDailyLotteryGameJob: process.env.StartDubaiDailyLotteryGameJob || "0 0 * * *",
    StopDubaiDailyLotteryGameJob: process.env.StopDubaiDailyLotteryGameJob || "0 17 * * *",
    StartLondonWeeklyLotteryGameJob: process.env.StartLondonWeeklyLotteryGameJob || "0 0 * * 1",
    StopLondonWeeklyLotteryGameJob: process.env.StopLondonWeeklyLotteryGameJob || "0 17 * * 0",
    StartMexicoMonthlyLotteryGameJob: process.env.StartMexicoMonthlyLotteryGameJob || "0 0 2 * *",
    StopMexicoMonthlyLotteryGameJob: process.env.StopMexicoMonthlyLotteryGameJob || "0 17 1 * *",
    releaseMonthlyBonusJob: process.env.releaseMonthlyBonusJob || "1 1 1 * *",
} 