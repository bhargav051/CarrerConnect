const mongoose = require('mongoose');

console.log(process.env.DB_CONNECTION_STRING);

const connectDB = async () => {
    await mongoose.connect(process.env.DB_CONNECTION_STRING);
};

module.exports = connectDB;