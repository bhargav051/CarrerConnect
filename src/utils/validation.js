const validator = require('validator');
const bcrypt = require('bcrypt');

const validateSignUpData = (req) => {
    const { firstName, lastname, emailId, password } = req.body;

    if (!firstName) {
        throw new Error("First name is not valid");
    }
    else if (firstName.length < 4 || firstName.length > 50) {
        throw new Error("FIrst Name should be 4-50 Characters");
    }
    // using npm validator library to validate email
    else if (!validator.isEmail(emailId)) {
        throw new Error("Email is not valid !!");
    }
    // using npm validator library to check is password is strong enough
    else if (!validator.isStrongPassword(password)) {
        throw new Error("please enter a strong password");
    }
}

const validateEditProfileData = (req) => {
    const allowedEditFields = [
        "firstName",
        "lastName",
        "emailId",
        "photoUrl",
        "gender",
        "age",
        "about",
        "skills"
    ];

    // check all keys user is trying to edit are allowed
    const isEditAllowed = Object.keys(req.body).every(field =>
        allowedEditFields.includes(field)
    );

    return isEditAllowed;
};

const validatePasswordChangeData = async (req) => {
    try {
        const { oldPassword, newPassword, confirmPassword } = req.body;

        // ✅ Step 1: Validate allowed fields
        const allowedFields = ["oldPassword", "newPassword", "confirmPassword"];
        const isFieldAllowed = Object.keys(req.body).every(field =>
            allowedFields.includes(field)
        );

        if (!isFieldAllowed) {
            throw new Error("Invalid fields in request. Only oldPassword, newPassword, and confirmPassword are allowed!");
        }

        // ✅ Step 2: Check all required fields exist
        if (!oldPassword || !newPassword || !confirmPassword) {
            throw new Error("All three fields (oldPassword, newPassword, confirmPassword) are required!");
        }

        const user = req.user;

        // ✅ Step 3: Check if old password matches DB password
        const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordMatch) {
            throw new Error("Old password is incorrect!");
        }

        // ✅ Step 5: Check if new password and old password match
        if (newPassword === oldPassword) {
            throw new Error("New password and old password cannot be same !");
        }

        // ✅ Step 5: Check new password and confirm password match
        if (newPassword !== confirmPassword) {
            throw new Error("New password and confirm password do not match!");
        }

        // ✅ Step 6: Check password strength
        if (!validator.isStrongPassword(newPassword)) {
            throw new Error("Please enter a strong password (use uppercase, lowercase, number, and symbol).");
        }

        return true;

    } catch (err) {
        throw new Error(err.message);  
    }
};

module.exports = {
    validateSignUpData,
    validateEditProfileData,
    validatePasswordChangeData
};
