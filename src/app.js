const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const app = express();
const connectDB = require("./config/database");
const cookieParser = require('cookie-parser');
const cors = require("cors");
require('./utils/cronJobs');

const PORT = process.env.PORT;

// ----------------------
// IMPORT ALL ROUTES FIRST
// ----------------------
const paymentRouter = require("./routes/payment");
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");

// ----------------------
// WEBHOOK FIRST (RAW BODY)
// ----------------------
app.use(
  "/payment/webhook",
  express.raw({ type: "application/json" }),
  paymentRouter
);

// ----------------------
// NORMAL MIDDLEWARES
// ----------------------
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://carrer-connect-web.vercel.app"
    ],
    credentials: true,
}));

// ----------------------
// ROUTE MOUNTING
// ----------------------
app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);

// IMPORTANT: Payment router after JSON parsers
// (excluding webhook which is raw)
app.use("/", paymentRouter);

// ----------------------
// START SERVER AFTER DB
// ----------------------
connectDB().then(() => {
    console.log("Database connected successfully !!");

    app.listen(PORT, () => {
        console.log(`Server running on ${PORT}`);
    });
});
