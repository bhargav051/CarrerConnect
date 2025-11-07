
// Load environment variables first so all required modules can use them.
// Explicitly point to the .env in this directory to avoid relying on the current working directory.
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const app = express();
const connectDB = require("./config/database");

const cookieParser = require('cookie-parser');
const cors = require("cors");

const PORT = process.env.PORT;


app.use(express.json());  //middleware to read and access json data 
app.use(cookieParser());  // middleware to read and parse cookies
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));  // credentials true to allow browser to store cookie

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");

connectDB().then(() => {
    console.log("Database connected succefully !!");
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(err => {
    console.error("Database cannot be connected !!", err);
});

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/",userRouter);




