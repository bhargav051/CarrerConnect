const express = require('express');
const paymentRouter = express.Router();
const { userAuth } = require('../middlewares/auth');
const razorpayInstance = require('../utils/razorpay');
const Payment = require('../models/payment');
const User = require('../models/user');
const { PAYMENT_PLANS } = require('../utils/constants');
const { validateWebhookSignature } = require('razorpay/dist/utils/razorpay-utils');

paymentRouter.post("/payment/create", userAuth, async (req, res) => {
    try {
        const { plan } = req.body;
        if (plan !== "Prime" && plan !== "Boost") {
            return res.status(400).send("Invalid plan selected");
        }

        const { firstName, lastName, emailId } = req.user;
        const userId = req.user._id;
        const amount = PAYMENT_PLANS[plan] * 100; // convert to smallest currency unit

        const order = await razorpayInstance.orders.create({
            "amount": amount,
            "currency": "INR",
            "receipt": `receipt_order_${Date.now()}`,
            "notes": {
                "userId": userId.toString(),
                "firstName": firstName,
                "lastName": lastName,
                "email": emailId,
                "membership": plan
            }
        });
        // save it in my database

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
        console.log("Payment saved successfully: ", savedPayment);

        // return it back to frontend
        res.json({ ...savedPayment.toJSON(), keyId: process.env.RAZORPAY_KEY_ID });
    } catch (err) {
        res.status(400).send("Error: " + err.message);
    }
});

paymentRouter.post("/payment/webhook", async (req, res) => {
    try {
        // raw body string required
        const webhookBody = req.body;

        const webhookSignature = req.get("x-razorpay-signature");

        const isWebhookValid = validateWebhookSignature(
            webhookBody,
            webhookSignature,
            process.env.RAZORPAY_WEBHOOK_SECRET
        );

        if (!isWebhookValid) {
            return res.status(400).send("Invalid webhook signature");
        }

        const event = JSON.parse(webhookBody);

        const paymentDetails = event.payload.payment.entity;

        const payment = await Payment.findOne({ orderId: paymentDetails.order_id });

        if (!payment) return res.status(404).send("Payment not found");

        payment.status = paymentDetails.status;
        payment.paymentId = paymentDetails.id;
        await payment.save();

        // SUCCESS CASE
        if (event.event === "payment.captured") {
            const user = await User.findById(payment.userId);

            const membership = payment.notes.membership;

            user.isPremiumUser = true;
            user.membershipPlan = membership;

            user.membershipExpiry = membership === "Prime"
                ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 6 months
                : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 3 months

            await user.save();
        }

        res.status(200).send("Webhook received successfully");

    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
});


module.exports = paymentRouter;