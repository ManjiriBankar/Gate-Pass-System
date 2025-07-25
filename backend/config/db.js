const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB with URI:", process.env.MONGO_URI ? "[URI exists]" : "[MISSING URI]");
    
    if (!process.env.MONGO_URI) {
      throw new Error("MongoDB connection URI is missing. Check your .env file");
    }
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Print available models and collections
    console.log("Available models:", Object.keys(mongoose.models));
    console.log("Connection ready state:", mongoose.connection.readyState);
    
    // Check if LeaveRequest model exists
    if (mongoose.models.LeaveRequest) {
      console.log("LeaveRequest model is registered and available");
      
      // Count documents to verify database access
      try {
        const count = await mongoose.models.LeaveRequest.countDocuments({});
        console.log(`Total LeaveRequest documents in database: ${count}`);
      } catch (countErr) {
        console.error("Error counting LeaveRequest documents:", countErr.message);
      }
    } else {
      console.warn("WARNING: LeaveRequest model is not registered");
    }
    
    return conn;
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
