import mongoose from "mongoose";

const DATABASE_CONNECTION_OPTIONS = {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverSelectionTimeoutMS: 5000,
	socketTimeoutMS: 45000,
};

const validateEnvironmentVariable = () => {
	if (!process.env.MONGO_URL) {
		throw new Error("MONGO_URL environment variable is not defined");
	}
};

const connectDB = async () => {
	try {
		validateEnvironmentVariable();

		await mongoose.connect(process.env.MONGO_URL, DATABASE_CONNECTION_OPTIONS);
		console.log("Database connected successfully");

		mongoose.connection.on("error", (error) => {
			console.error("Database connection error:", error);
		});

		mongoose.connection.on("disconnected", () => {
			console.log("Database disconnected");
		});
	} catch (error) {
		console.error("Database connection failed:", error.message);
		process.exit(1);
	}
};

export default connectDB;
