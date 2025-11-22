const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        required: true,
    },
    receipt: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
    },
    paymentId: {
        type: String,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    notes: {
        firstName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        membership: {
            type: String,
            required: true,
        },  
    },
}, 
{ timestamps: true });

const payment = mongoose.model('Payment', paymentSchema);

module.exports = payment;