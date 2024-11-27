import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { required: true, type: String },
  email: { required: true, type: String, unique: true },
  password: { required: true, type: String },
  avatar: Object,
  last_seen: { type: Date, default: Date.now() },
  pinned_chats: [],
  blocked_users: [],
});

const User = mongoose.model("users", UserSchema);
export default User;
