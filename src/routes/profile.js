const express = require('express');
const User = require("../models/user");
const { userAuth } = require("../middlewares/auth");
const { validateEditProfileData, validatePasswordChangeData } = require("../utils/validation");
const bcrypt = require('bcrypt');

const profileRouter = express.Router();

// ✅ View Profile
profileRouter.get("/profile/view", userAuth, async (req, res) => {
    try {
        const user = req.user;
        res.send(user);
    } catch (err) {
        res.status(400).send("Error: " + err.message);
    }
});

// ✅ Edit Profile
profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
    try {
        // Validate editable fields
        const isEditAllowed = validateEditProfileData(req);
        if (!isEditAllowed) {
            throw new Error("Invalid edit request");
        }

        const user = req.user;

        // Update user fields dynamically
        Object.keys(req.body).forEach(field => {
            user[field] = req.body[field];
        });

        await user.save();
        res.status(200).send(user);
    } catch (err) {
        console.log("Error: " + err.message);
        res.status(400).send("Error: " + err.message);
    }
});

// change password

profileRouter.patch("/profile/password/change", userAuth, async (req,res) => {
    try{
        await validatePasswordChangeData(req);

        const user = req.user;
        const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        res.send({
            message: "Password updated successfully!",
            updateUser: user
        });
    } catch (err){
        console.log("Error: " + err.message);
        res.status(400).send("Error: " + err.message);
    }
});

module.exports = profileRouter;
