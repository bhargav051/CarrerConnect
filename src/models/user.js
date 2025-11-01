const mongoose = require('mongoose');
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 50  
    },
    lastName: {
        type: String
    },
    emailId: {
        type: String,
        required: true,
        unique: true, // making a field unique automatically creates a index for that field
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        min: 18,
        max: 100
    },
    gender: {
        type: String,
        //custom validatiom function
        // note - this validate function will only run when you create new document
        // it will run in create user method not in update user method 
        // for path api's need to give options runValidator
        validate(gender){
            if(!["male","female","others"].includes(gender)){
                throw new Error("Please enter valid gender");
            }
        }
    },
    photoUrl: {
        type: String,
        default: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Default-welcomer.png/643px-Default-welcomer.png?20180610185859"
    },
    about: {
        type: String,
        default: "This is a deault about of the user !!"
    },
    skills: {
        type: [String],
    }
},{
    timestamps: true,
});

userSchema.methods.getJWT = async function () {
    const user = this;

    const token = await jwt.sign({ _id: user._id}, "xyz@131", {
        expiresIn: "7d",
    });

    return token;
}

userSchema.methods.validatePassword = async function (passwordInputByUser) {
    const user = this;
    const passwordHash = user.password;

    const isPasswordValid = await bcrypt.compare(passwordInputByUser, passwordHash);
    return isPasswordValid;
}


const User = mongoose.model("User",userSchema);

module.exports = User;