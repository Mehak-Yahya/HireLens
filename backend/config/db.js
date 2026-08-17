import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);

    console.log(
      `MongoDB connected: ${connection.connection.host}`
    );

    console.log(
      `MongoDB database: ${connection.connection.name}`
    );

    console.log(
      "Jobs currently in database:",
      await mongoose.connection.db
        .collection("jobs")
        .countDocuments()
    );

  } catch (error) {
    console.error(
      "MongoDB connection failed:",
      error.message
    );

    process.exit(1);
  }
};

export default connectDB;