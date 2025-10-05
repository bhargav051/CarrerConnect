const validator = require('validator');

const validateSignUpData = (req) => {
    const {firstName, lastname, emailId, password} = req.body;

    if(!firstName){
        throw new Error("First name is not valid");
    }
    else if(firstName.length<4 || firstName.length>50){
        throw new Error("FIrst Name should be 4-50 Characters"); 
    }
    // using npm validator library to validate email
    else if(!validator.isEmail(emailId)) {
        throw new Error("Email is not valid !!");
    }
    // using npm validator library to check is password is strong enough
    else if(!validator.isStrongPassword(password)){
        throw new Error("please enter a strong password");
    }
}

module.exports = {
    validateSignUpData,
};