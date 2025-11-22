// Load .env
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
// WEBHOOK MUST COME FIRST
// ----------------------
const paymentRouter = require("./routes/payment");

app.use(
  "/payment/webhook",
  express.raw({ type: "application/json" }),   // raw body ONLY for webhook
  paymentRouter
);

// ----------------------
// NORMAL PARSERS
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

// Other Routers
app.use("/", require("./routes/auth"));
app.use("/", require("./routes/profile"));
app.use("/", require("./routes/request"));
app.use("/", require("./routes/user"));
app.use("/", paymentRouter);  // other payment routes like /payment/create

// ----------------------
// START SERVER AFTER DB CONNECTED
// ----------------------
connectDB().then(() => {
    console.log("Database connected successfully !!");
    app.listen(PORT, () => {
        console.log(`Server running on ${PORT}`);
    });
});
