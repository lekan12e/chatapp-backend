import express from "express";
import verifyToken from "../middlewares/auth.js";
import {
  AuthUser,
  BlockUser,
  clearChat,
  createChat,
  GetChatInfo,
  GetChatMessages,
  GetChats,
  GetUserByEmail,
  GetUsers,
  PinChat,
  ReadMessage,
  SendMesssage,
  TogglePresence,
  UpdateUser,
} from "./Handlers.js";

const appRouter = express.Router();

appRouter.get("/users", verifyToken, GetUsers);
appRouter.get("/authUser", verifyToken, AuthUser);
appRouter.post("/chat", verifyToken, createChat);
appRouter.get("/chats", verifyToken, GetChats);
appRouter.post("/chat/:chat_id/message", verifyToken, SendMesssage);
appRouter.get("/chat/:chat_id/message", verifyToken, GetChatMessages);
appRouter.get("/chat/:chat_id", verifyToken, GetChatInfo);
appRouter.get("/chat/:chat_id/clear", verifyToken, clearChat);
appRouter.get("/message/:message_id/read", verifyToken, ReadMessage);
appRouter.get("/chat/:chat_id/pinChat", verifyToken, PinChat);

appRouter.get("/user/:user_id/lastSeen", TogglePresence);
appRouter.post("/user", GetUserByEmail);
appRouter.get("/user/:user_id/blockUser", verifyToken, BlockUser);
appRouter.post("/user/updateData", verifyToken, UpdateUser);

export default appRouter;
