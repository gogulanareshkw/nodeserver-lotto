const mongoose = require('mongoose');

const lotteryGameResultSchema = new mongoose.Schema({
  lotteryGameType: {
    type: Number,
    required: true,
    enum: [1, 2, 3, 4, 5] // 1: Thai, 2: Bangkok Weekly, 3: Dubai Daily, 4: London Weekly, 5: Mexico Monthly
  },
  lotteryGameResult: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Validate format: "1,2,3,4,5,6"
        const numbers = v.split(',').map(num => parseInt(num.trim()));
        return numbers.length === 6 && numbers.every(num => !isNaN(num) && num >= 1 && num <= 99);
      },
      message: 'Lottery result must be 6 numbers between 1-99 separated by commas'
    }
  },
  drawDate: {
    type: Date,
    required: true
  },
  drawNumber: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalWinnings: {
    type: Number,
    default: 0
  },
  totalTickets: {
    type: Number,
    default: 0
  },
  winningTickets: {
    type: Number,
    default: 0
  },
  createdDateTime: {
    type: Date,
    default: Date.now
  },
  updatedDateTime: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Indexes for better performance
lotteryGameResultSchema.index({ lotteryGameType: 1, drawDate: -1 });
lotteryGameResultSchema.index({ isActive: 1 });
lotteryGameResultSchema.index({ createdDateTime: -1 });

// Pre-save middleware
lotteryGameResultSchema.pre('save', function(next) {
  this.updatedDateTime = new Date();
  next();
});

// Instance methods
lotteryGameResultSchema.methods.getResultNumbers = function() {
  return this.lotteryGameResult.split(',').map(num => parseInt(num.trim()));
};

lotteryGameResultSchema.methods.isWinningNumber = function(number) {
  const resultNumbers = this.getResultNumbers();
  return resultNumbers.includes(number);
};

// Static methods
lotteryGameResultSchema.statics.getLatestResult = function(gameType) {
  return this.findOne({ 
    lotteryGameType: gameType, 
    isActive: true 
  }).sort({ drawDate: -1 });
};

lotteryGameResultSchema.statics.getResultsByDateRange = function(gameType, startDate, endDate) {
  return this.find({
    lotteryGameType: gameType,
    drawDate: {
      $gte: startDate,
      $lte: endDate
    },
    isActive: true
  }).sort({ drawDate: -1 });
};

lotteryGameResultSchema.statics.getResultsByGameType = function(gameType, limit = 10) {
  return this.find({ 
    lotteryGameType: gameType, 
    isActive: true 
  })
  .sort({ drawDate: -1 })
  .limit(limit);
};

module.exports = mongoose.model('LotteryGameResult', lotteryGameResultSchema); 