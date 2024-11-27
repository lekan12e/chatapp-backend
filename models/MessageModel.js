import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  chat_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "chats",
    required: true,
  },
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  reciever_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  sent_on: { type: Date },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
});

const Message = mongoose.model("messages", MessageSchema);
export default Message;
