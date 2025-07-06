function define(name, value) {
    Object.defineProperty(exports, name, {
        value: value,
        enumerable: true
    });
}
//UI site URL
define("UI_SITE_URL", "localhost:8080");

//Regex
define("EMAIL_REG", /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
define("PHONE_REG", /^\+?([0-9]{2})\)?[-. ]?([0-9]{4})[-. ]?([0-9]{4})|([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/);
define("USERNAME_REG", /^[a-z](?:[a-z\d]|-(?=[a-z\d])){3,31}$/);

//GENDER TYPES
define("GENDER_TYPE_MALE", "Male");
define("GENDER_TYPE_FEMALE", "Female");

//USER ROLES
define("USER_ROLE_SUPER", 1);
define("USER_ROLE_ADMIN", 2);
define("USER_ROLE_USER", 3);
define("USER_ROLE_AGENT", 4);
define("USER_ROLE_STAFF", 5);

//HISTORY UPDATE TYPES
define("DBUPDATE_TYPE_PERMISSION", "PERMISSION");
define("DBUPDATE_TYPE_USER", "USER");
define("DBUPDATE_TYPE_MONEY", "MONEY");
define("DBUPDATE_TYPE_BANKDETAILS", "BANKDETAILS");

//LOTTERY GAME TYPES
define("LOTTERY_GAME_TYPE_THAILAND", 1);
define("LOTTERY_GAME_TYPE_BANGKOK_WEEKLY", 2);
define("LOTTERY_GAME_TYPE_DUBAI_DAILY", 3);
define("LOTTERY_GAME_TYPE_LONDON_WEEKLY", 4);
define("LOTTERY_GAME_TYPE_MEXICO_MONTHLY", 5);

//LOTTERY GAME PLAY TYPES
define("LOTTERY_GAME_PLAY_TYPE_1STPRIZE", "FirstPrize");
define("LOTTERY_GAME_PLAY_TYPE_3UP", "ThreeUp");
define("LOTTERY_GAME_PLAY_TYPE_2UP", "TwoUp");
define("LOTTERY_GAME_PLAY_TYPE_2DN", "TwoDown");
define("LOTTERY_GAME_PLAY_TYPE_3UPSingle", "ThreeUpSingle");
define("LOTTERY_GAME_PLAY_TYPE_2UPSingle", "TwoUpSingle");
define("LOTTERY_GAME_PLAY_TYPE_2DNSingle", "TwoDownSingle");
define("LOTTERY_GAME_PLAY_TYPE_3UPTOTAL", "ThreeUpTotal");
define("LOTTERY_GAME_PLAY_TYPE_2UPTOTAL", "TwoUpTotal");
define("LOTTERY_GAME_PLAY_TYPE_2DNTOTAL", "TwoDownTotal");

//THAI GAME TYPES
define("THAI_GAME_TYPE_1STPRIZE", "FirstPrize");
define("THAI_GAME_TYPE_3UP", "ThreeUp");
define("THAI_GAME_TYPE_2UP", "TwoUp");
define("THAI_GAME_TYPE_2DN", "TwoDown");
define("THAI_GAME_TYPE_3UPSingle", "ThreeUpSingle");
define("THAI_GAME_TYPE_2UPSingle", "TwoUpSingle");
define("THAI_GAME_TYPE_2DNSingle", "TwoDownSingle");
define("THAI_GAME_TYPE_3UPTOTAL", "ThreeUpTotal");
define("THAI_GAME_TYPE_2UPTOTAL", "TwoUpTotal");
define("THAI_GAME_TYPE_2DNTOTAL", "TwoDownTotal");

//GAME STATUS TYPES
define("GAME_STATUS_SUCCESS", "Success");
define("GAME_STATUS_FAIL", "Fail");

//PAYMENT TYPES
define("PAYMENT_TYPE_UPI", "UPI");
define("PAYMENT_TYPE_BANK", "BANK");
define("PAYMENT_TYPE_WesternUnion", "Western Union");
define("PAYMENT_TYPE_MasterCard", "Master Card");
define("PAYMENT_TYPE_VISA", "VISA");
define("PAYMENT_TYPE_PerfectMoney", "Perfect Money");
define("PAYMENT_TYPE_Skrill", "Skrill");
define("PAYMENT_TYPE_EVoucher", "E-Voucher");
define("PAYMENT_TYPE_CryptoCurrency", "Crypto Currency");
define("PAYMENT_TYPE_NeTeller", "NeTeller");
define("PAYMENT_TYPE_STCPay", "Stc Pay");
define("PAYMENT_TYPE_NCB", "NCB");
define("PAYMENT_TYPE_AlRajhiBank", "AlRajhi Bank");

//PAYMENT TYPES
define("BANKCARD_TYPE_UPI", "UPI");
define("BANKCARD_TYPE_BANK", "BANK");

//PAYMENT TYPES
define("PAYMENT_STATUS_TYPE_P", "PENDING");
define("PAYMENT_STATUS_TYPE_A", "APPROVED");
define("PAYMENT_STATUS_TYPE_D", "DECLAINED");

//FEEDBACK TYPES
define("FEEDBACK_TYPE_GENERAL", "GENERAL");
define("FEEDBACK_TYPE_COMPLAINT", "COMPLAINT");
define("FEEDBACK_TYPE_COMPLIMENT", "COMPLIMENT");
define("FEEDBACK_TYPE_SUGGESTION", "SUGGESTION");
define("FEEDBACK_TYPE_HELP", "HELP");

//OFFER TYPES
define("OFFER_TYPE_REFERRAL_BONUS", "REFBONUS");
define("OFFER_TYPE_RECHARGE_BONUS", "RECHARGEBONUS");
define("OFFER_TYPE_PLAY_BONUS", "PLAYBONUS");

//EMAIL DELIVERY TYPES
define("MAIL_DELIVERY_TYPE_GMAIL", "GMAIL");
define("MAIL_DELIVERY_TYPE_SENDINBLUE", "SENDINBLUE");
define("MAIL_DELIVERY_TYPE_MAILJET", "MAILJET");

//APPLICATION AGENT TYPES
define("AGENT_TYPE_WHATSAPP", "WHATSAPP");
define("AGENT_TYPE_TELEGRAM", "TELEGRAM"); 