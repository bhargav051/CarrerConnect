const express = require('express');
const paymentRouter = express.Router();
const { userAuth } = require('../middlewares/auth');
const razorpayInstance = require('../utils/razorpay');
const Payment = require('../models/payment');
const User = require('../models/user');
const { PAYMENT_PLANS } = require('../utils/constants');
const { validateWebhookSignature } = require('razorpay/dist/utils/razorpay-utils');
const sendMail = require('../utils/sendMail');

// ----------------- CREATE ORDER -----------------
paymentRouter.post("/payment/create", userAuth, async (req, res) => {
    try {
        const { plan } = req.body;

        if (plan !== "Prime" && plan !== "Boost") {
            return res.status(400).send("Invalid plan selected");
        }

        const { firstName, lastName, emailId } = req.user;
        const userId = req.user._id;

        const amount = PAYMENT_PLANS[plan] * 100;

        const order = await razorpayInstance.orders.create({
            amount,
            currency: "INR",
            receipt: `receipt_order_${Date.now()}`,
            notes: {
                userId: userId.toString(),
                firstName,
                lastName,
                email: emailId,
                membership: plan
            }
        });

        const payment = new Payment({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt,
            status: order.status,
            userId: userId,
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

// ----------------- WEBHOOK -----------------
paymentRouter.post("/payment/webhook", async (req, res) => {
    try {
        // RAW BODY BUFFER → convert to string
        const webhookBody = req.body.toString('utf8');
        const webhookSignature = req.get("x-razorpay-signature");

        // Verify webhook
        const isValid = validateWebhookSignature(
            webhookBody,
            webhookSignature,
            process.env.RAZORPAY_WEBHOOK_SECRET
        );

        if (!isValid) {
            return res.status(400).send("Invalid webhook signature");
        }

        const event = JSON.parse(webhookBody);

        if (event.event !== "payment.captured") {
            return res.status(200).send("Ignored event");
        }

        const paymentInfo = event.payload.payment.entity;

        const payment = await Payment.findOne({ orderId: paymentInfo.order_id });
        if (!payment) return res.status(404).send("Payment not found");

        payment.status = "captured";
        payment.paymentId = paymentInfo.id;
        await payment.save();

        // Update User Premium Status
        const user = await User.findById(payment.userId);

        const membership = payment.notes.membership;

        user.isPremiumUser = true;
        user.membershipPlan = membership;

        user.membershipExpiry =
            membership === "Prime"
                ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

        await user.save();

        // send mail to the user
        const email = user.emailId;
        const subject = "Membership Activated!";
        const text = `Dear ${payment.notes.firstName},
            Your payment for the ${membership} membership has been successfully processed. Your membership is now active.
            Thank you for choosing DevTinder!
            Best regards,
            DevTinder Team`;

        const mailResponse = await sendMail(email, subject, text, null);
        console.log("Mail response:", mailResponse);

        res.status(200).send("Webhook processed successfully");

    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
});
// ----------------- VERIFY PREMIUM USER -----------------

paymentRouter.get("/payment/verify", userAuth, (req, res) => {
    const user = req.user;
    if (user.isPremiumUser) {
        return res.json({ isPremiumUser: true });
    }
    res.json({ isPremiumUser: false });
});

module.exports = paymentRouter;
