const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');

const connectDB = async() => {
    try { 
        await mongoose.connect(db, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false
        });
        console.log("Connected MongoDB");

    }catch(err) {
        console.log(err.message);

        // Exit process with failur
        process.exit(1);
    }
}

module.exports = connectDB;