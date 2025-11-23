const express = require('express');
const paymentRouter = express.Router();
const { userAuth } = require('../middlewares/auth');
const razorpayInstance = require('../utils/razorpay');
const Payment = require('../models/payment');
const User = require('../models/user');
const { PAYMENT_PLANS } = require('../utils/constants');
const { validateWebhookSignature } = require('razorpay/dist/utils/razorpay-utils');

// CREATE ORDER
paymentRouter.post("/payment/create", userAuth, async (req, res) => {
    try {
        const { plan } = req.body;

        if (plan !== "Prime" && plan !== "Boost") {
            return res.status(400).send("Invalid plan selected");
        }

        const amount = PAYMENT_PLANS[plan] * 100;

        const order = await razorpayInstance.orders.create({
            amount,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                userId: req.user._id.toString(),
                membership: plan
            }
        });

        const payment = new Payment({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt,
            status: order.status,
            userId: req.user._id,
            notes: order.notes
        });

        const savedPayment = await payment.save();

        res.json({
            ...savedPayment.toJSON(),
            keyId: process.env.RAZORPAY_KEY_ID
        });

    } catch (err) {
        res.status(400).send("Error: " + err.message);
    }
});

// WEBHOOK
paymentRouter.post("/payment/webhook", async (req, res) => {
    try {
        const rawBody = req.body.toString('utf8');
        const signature = req.get("x-razorpay-signature");

        const isValid = validateWebhookSignature(
            rawBody,
            signature,
            process.env.RAZORPAY_WEBHOOK_SECRET
        );

        if (!isValid) {
            return res.status(400).send("Invalid webhook signature");
        }

        const event = JSON.parse(rawBody);

        if (event.event !== "payment.captured") {
            return res.status(200).send("Ignored event");
        }

        const paymentInfo = event.payload.payment.entity;

        const payment = await Payment.findOne({ orderId: paymentInfo.order_id });
        if (!payment) return res.status(404).send("Payment not found");

        payment.status = "captured";
        payment.paymentId = paymentInfo.id;
        await payment.save();

        const user = await User.findById(payment.userId);

        const membership = payment.notes.membership;

        user.isPremiumUser = true;
        user.membershipPlan = membership;

        user.membershipExpiry =
            membership === "Prime"
                ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

        await user.save();

        res.status(200).send("Webhook processed");

    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
});

// VERIFY PREMIUM
paymentRouter.get("/payment/verify", userAuth, (req, res) => {
    res.json({ isPremiumUser: req.user.isPremiumUser });
});

module.exports = paymentRouter;
