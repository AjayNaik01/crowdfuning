const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in the environment variables.');
        }
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`Chatbot DB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Chatbot DB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB; 