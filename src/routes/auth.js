const express = require("express");
const { validateSignUpData } = require("../utils/validation");
const User = require("../models/user");
const bcrypt = require('bcrypt');
const validator = require("validator");
const sendMail = require("../utils/sendMail");


const authROuter = express.Router();

authROuter.post("/signup", async (req, res) => {

    try {
        // validation of data
        validateSignUpData(req);

        // encrypt the password
        const { firstName, lastName, emailId, password, skills, photoUrl, about } = req.body;
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
            skills,
            about,
            photoUrl    
        });
        const data = await user.save();
        const token = await user.getJWT();
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            expires: new Date(Date.now() + 8 * 60 * 60 * 1000)
        });

        res.json({ message: "User created successfully !!", data: data });
        // after user creation send a welcome mail to the user
        sendMail(emailId, "Welcome to DevTinder", "Thanks for signing up!", "<h1>Welcome to DevTinder</h1><p>Thanks for signing up!</p>");
    } catch (err) {
        res.status(400).json({ error: err.message });
    }

});

authROuter.post("/signin", async (req, res) => {
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
            res.cookie("token", token, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                expires: new Date(Date.now() + 8 * 60 * 60 * 1000)
            });


            res.json({
                message: "Login successfull !!",
                data: existingUser,
                token: token 
            });
        } else {
            res.status(400).send("Invalid credentials");
        }
    } catch (err) {
        res.status(400).send("Error : " + err.message);
    }
});


authROuter.post("/logout", (req, res) => {
    res.cookie("token", null, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        expires: new Date(Date.now())
    });

    res.send("Logut successfull !!");
})

module.exports = authROuter;