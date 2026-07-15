const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return;
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Atlas connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);

    throw error; // jangan process.exit()
  }
};

module.exports = connectDB;
