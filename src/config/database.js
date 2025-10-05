const mongoose = require('mongoose');

const URL = "mongodb+srv://NamasteDev:PcOVGO20CAHvKipp@namastenode.blwzvmw.mongodb.net/devTinder";

const connectDB = async () => {
    await mongoose.connect(
        URL
    );
};

module.exports = connectDB;