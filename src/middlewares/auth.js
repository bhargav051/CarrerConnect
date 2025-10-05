const jwt = require("jsonwebtoken");
const User = require("../models/user");

const userAuth = async (req, res, next) => {
    try {
        const cookies = req.cookies;
        const { token } = cookies;
        if(!token){
            throw new Error("TOken is not valid !!");
        }
        const decodedMessage = await jwt.verify(token, "xyz@131");
        const { _id } = decodedMessage;

        const user = await User.findById(_id);
        if (!user) {
            throw new Error("User not found");
        }
        // if user present then call next
        req.user = user;
        next();
    } catch (err) {
        res.status(400).send("Error: " + err.message);
    }
}

module.exports = {
    userAuth,
};