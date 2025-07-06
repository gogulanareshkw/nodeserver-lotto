const mongoose = require('mongoose');

const CurrencySchema = mongoose.Schema({
    timestamp: { type: String, default: "" },
    date: { type: Date, default: Date.now },
    usdQuotes: {
        USDINR: { type: Number, default: 0 },   //India
        USDKWD: { type: Number, default: 0 },   //Kuwait
        USDAED: { type: Number, default: 0 },   //Dubai
        USDSAR: { type: Number, default: 0 },   //Saudi
        USDQAR: { type: Number, default: 0 },   //Qatar
        USDLKR: { type: Number, default: 0 },   //SriLanka
        USDPKR: { type: Number, default: 0 },   //Pakistan
        USDBDT: { type: Number, default: 0 },   //Bangladesh
        USDPHP: { type: Number, default: 0 },   //Philippines
        USDNPR: { type: Number, default: 0 },   //Nepal
        USDSGD: { type: Number, default: 0 },   //Singapore
        USDMYR: { type: Number, default: 0 },   //Malaysia
        USDOMR: { type: Number, default: 0 },   //Omna
        USDBHD: { type: Number, default: 0 },   //Bahrain
    },
    createdDateTime: { type: Date, default: Date.now },
    updatedDateTime: { type: Date, default: Date.now }
});

const Currency = mongoose.model('Currency', CurrencySchema)

module.exports = Currency;