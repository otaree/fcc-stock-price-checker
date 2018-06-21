const mongoose = require("mongoose");

const StockSchema = new mongoose.Schema({
    symbol: {
        type: String,
        required: true,
        unique: true,
        minlength: 1,
        trim: true
    },
    likes: {
        type: Number,
        default: 0
    },
    ips: [String]
});

const Stock = mongoose.model("Stock", StockSchema);

module.exports = { Stock };