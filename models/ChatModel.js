import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema({
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  date: { type: Date, default: Date.now() },
  recent_message: Object,
  last_message_at: Date,
});

const Chat = mongoose.model("chats", ChatSchema);
export default Chat;
