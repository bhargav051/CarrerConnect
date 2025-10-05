const express = require('express');
const app = express();
const connectDB = require("./config/database");
const User = require("./models/user");
const validator = require('validator');
const { validateSignUpData } = require("./utils/validation");
const jwt = require("jsonwebtoken");
const { userAuth } = require("./middlewares/auth");

const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');

const PORT = process.env.PORT || 3000;

app.use(express.json());  //middleware to read and access json data 
app.use(cookieParser());  // middleware to read and parse cookies

connectDB().then(() => {
    console.log("Database connected succefully !!");
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(err => {
    console.error("Database cannot be connected !!", err);
});

app.post("/signup", async (req, res) => {

    try {
        // validation of data
        validateSignUpData(req);

        // encrypt the password
        const { firstName, lastName, emailId, password } = req.body;
        // check if the email already exsists
        const existingUser = await User.findOne({ emailId });
        if (existingUser) {
            throw new Error("Email already registered. Please use another email.")
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(hashedPassword);

        //  creating new instance of user model
        const user = new User({
            firstName,
            lastName,
            emailId,
            password: hashedPassword,
        });
        await user.save();
        res.send("User created successfully !!");
    } catch (err) {
        res.status(400).send("Error : " + err.message);
    }

});

app.post("/signin", async (req, res) => {
    try {
        const { emailId, password } = req.body;

        if (!validator.isEmail(emailId)) {
            throw new Error("Invalid credentials");
        }

        const existingUser = await User.findOne({ emailId: emailId });
        if (!existingUser) {
            throw new Error("Invalid credentials");
        }
        const isPasswordValid = await existingUser.validatePassword(password);

        if (isPasswordValid) {

            // create a JWT token
            const token = await existingUser.getJWT();
            console.log(token);

            // Add the token to cookie and send the response back to the user
            res.cookie("token", token);

            res.status(200).send("login successfull !!");
        } else {
            res.status(400).send("Invalid credentials");
        }
    } catch (err) {
        res.status(400).send("Error : " + err.message);
    }
});

app.get("/profile", userAuth, async (req, res) => {
    try {
        const user = req.user;
        res.send(user);
    } catch (err) {
        res.status(400).send("Error: "+ err.message);
    }
})

app.post("/sendConnectionRequest", userAuth, async(req,res) => {
    const user = req.user;

    console.log("sending a connection request");

    res.send(user.firstName + " sent you the connection request");
})



