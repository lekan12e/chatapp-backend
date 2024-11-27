import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import appRouter from "./controllers/AppRoutes.js";
import authRouter from "./controllers/AuthRoutes.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { addUser, Online, removeUser } from "./socketKit/utils.js";
import { configDotenv } from "dotenv";

configDotenv();

const app = express();
const PORT = process.env.PORT || 4000;

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const allowedOrigins = [
  "http://localhost:3000",
  "https://lakeschat.netlify.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Check if the request's origin is in the allowedOrigins array
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true); // Allow the request
      } else {
        callback(new Error("Not allowed by CORS")); // Reject the request
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"], // Allow specific HTTP methods
    credentials: true, // Allow cookies or authentication headers
  })
);

app.use("/", appRouter);
app.use("/", authRouter);

//db connection
mongoose
  .connect(process.env.MONGODB_URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("connected to mongodb successfully");
  })
  .catch((err) => {
    console.log(err.message);
  });

//socket.io connection
const httpServer = createServer(app);
const io = new Server(httpServer);

io.on("connection", (socket) => {
  socket.on("Joined", (data) => {
    socket.join(data);
  });

  socket.on("message", (data) => {
    io.to(data.chatId).emit("message", data);
  });

  socket.on("Online", (data) => {
    addUser(data);
    io.emit("CheckStatus", Online);
  });

  socket.on("newMessageToUser", (data) => {
    console.log("new Message");
    socket.broadcast.to(data.socketId).emit("newMessage", data);
  });

  socket.on("disconnect", () => {
    console.log(socket.id + "has left the app");
    removeUser(socket.id);
    io.emit("CheckStatus", Online);
  });
});

httpServer.listen(PORT, () => {
  console.log("socket is active," + " listening on port " + PORT);
});
