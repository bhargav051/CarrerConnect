const express = require('express');
const app = express();
const connectDB = require("./config/database");

const cookieParser = require('cookie-parser');

const PORT = process.env.PORT || 3000;

app.use(express.json());  //middleware to read and access json data 
app.use(cookieParser());  // middleware to read and parse cookies

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




