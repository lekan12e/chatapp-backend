import Chat from "../models/ChatModel.js";
import Message from "../models/MessageModel.js";
import User from "../models/UserModel.js";

export const GetUsers = async (req, res) => {
  const { search } = req.query;
  const users = await User.find().catch((err) => {
    return res.status(404).json({ message: err.message });
  });

  if (search) {
    const filteredUsers = users.filter((user) =>
      user.username.includes(search)
    );

    return res.status(200).json({ users: filteredUsers });
  }

  return res.status(200).json({ users });
};

export const AuthUser = async (req, res) => {
  const user = await User.findById(req.user.user_id);

  return res.status(200).json({
    user: {
      ...req.user,
      username: user.username,
      pinned_chats: user.pinned_chats,
      blocked_users: user.blocked_users,
    },
  });
};

export const createChat = async (req, res) => {
  const { users } = req.body;

  const newChat = new Chat({ users });

  await newChat
    .save()
    .then((response) => {
      return res.status(201).json({ chat: response });
    })
    .catch((err) => {
      return res.status(422).json({ message: err.message });
    });
};

export const SendMesssage = async (req, res) => {
  const { reciever_id, message } = req.body;
  const { chat_id } = req.params;

  if (!(chat_id && reciever_id && message))
    return res
      .status(422)
      .json({ message: "Insufficient amount of parameters" });

  let foundChat = await Chat.findById(chat_id).catch((err) => {
    return res.status(404).json({ message: "Chat was not found" });
  });

  if (!foundChat.users) return;

  if (!foundChat?.users?.includes(req.user.user_id))
    return res
      .status(401)
      .json({ message: "Not authorized to send messagges" });

  const newMessage = new Message({
    chat_id,
    reciever_id,
    message,
    sender_id: req.user.user_id,
    sent_on: Date.now(),
  });

  const savedMessage = await newMessage.save().catch((err) => {
    return res.status(422).json({ message: err.message });
  });

  await Chat.findByIdAndUpdate(chat_id, {
    recent_message: savedMessage,
    last_message_at: savedMessage.sent_on,
  }).catch((err) => {
    return res.status(404).json({ message: err.message });
  });

  return res.status(201).json({ message: savedMessage });
};

export const GetChatMessages = async (req, res) => {
  const { chat_id } = req.params;

  if (!chat_id)
    return res
      .status(422)
      .json({ message: "Insufficient amount of parameters" });

  let foundChat = await Chat.findById(chat_id).catch((err) => {
    return res.status(404).json({ message: "Chat was not found" });
  });

  if (!foundChat.users) return;

  if (!foundChat.users.includes(req.user.user_id))
    return res
      .status(401)
      .json({ message: "not authorized to view messagges" });

  let messages = await Message.find({ chat_id }).catch((err) => {
    return res.status(404).json({ message: err.message });
  });

  const unread = messages.filter((m) => !m.read);
  const owner = unread[0] ? unread[0].sender_id != req.user.user_id : false;

  if (unread.length && owner) {
    await Message.updateMany({ chat_id }, { read: true }).catch((err) => {
      return res.status(422).json({ message: err.message });
    });
  }

  let final_messages = await Message.find({ chat_id }).catch((err) => {
    return res.status(404).json({ message: err.message });
  });

  return res.status(200).json({ messages: final_messages });
};

export const GetChats = async (req, res) => {
  await Chat.find({ users: req.user.user_id })
    .sort({ last_message_at: -1 })
    .exec(async (err, docs) => {
      if (err)
        return res.status(404).json({ message: "Chats where not found" });

      const final_docs = await Promise.all(
        docs.map(async (doc) => {
          let otherUser = doc.users.filter(
            (user) => user._id != req.user.user_id
          );

          let otherUserInfo = await User.findById(otherUser[0]);
          let unreadMessages = await Message.find({
            chat_id: doc._id,
            read: false,
          });

          return { doc, chatInfo: otherUserInfo, unreadMessages };
        })
      );

      return res.status(200).json({ chats: final_docs });
    });
};

export const clearChat = async (req, res) => {
  const { chat_id } = req.params;

  if (!chat_id)
    return res
      .status(422)
      .json({ message: "Insufficient amount of parameters" });

  let foundChat = await Chat.findById(chat_id).catch((err) => {
    return res.status(404).json({ message: "Chat was not found" });
  });

  if (!foundChat.users) return;

  if (!foundChat.users.includes(req.user.user_id))
    return res
      .status(401)
      .json({ message: "not authorized to view messagges" });

  await Message.deleteMany({ chat_id }).catch((err) => {
    return res.status(422).json({ message: err.message });
  });

  return res.status(200).json({ message: "Cleared Chat successfully" });
};

export const TogglePresence = async (req, res) => {
  const { user_id } = req.params;

  await User.findByIdAndUpdate(user_id, { last_seen: Date.now() }).catch(
    (err) => {
      return res.status(422).json({ message: err.message });
    }
  );

  return res.status(200).json({ message: "success" });
};

export const GetUserByEmail = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email }).catch((err) => {
    return res.status(404).json({ message: "user was not found" });
  });

  return res.status(200).json({ user });
};

export const GetChatInfo = async (req, res) => {
  const { chat_id } = req.params;

  if (!chat_id)
    return res.status(422).json({ message: "id of the Chat is required" });

  const chat = await Chat.findById(chat_id).catch((err) => {
    return res.status(404).json({
      message: "Chat was not found, check if you provided the correct Id",
    });
  });

  if (!chat._id) return;

  let otherUser = chat.users.filter((user) => user != req.user.user_id);
  let otherUserInfo = await User.findById(otherUser[0]);
  let unreadMessages = await Message.find({ chat_id: chat._id, read: false });

  return res
    .status(200)
    .json({ doc: chat, chatInfo: otherUserInfo, unreadMessages });
};

export const ReadMessage = async (req, res) => {
  const { message_id } = req.params;

  if (!message_id)
    return res.status(422).json({ message: "Id of the message is required" });

  const foundMessage = await Message.findById(message_id);

  if (!foundMessage._id)
    return res.status(404).json({ message: "Message not found" });

  if (foundMessage.sender_id === req.user.user_id)
    return res.status(422).json({ message: "User cannot read what you sent" });

  const message = await Message.findByIdAndUpdate(message_id, {
    read: true,
  }).catch((err) => {
    return res.status(404).json({ message: "Message not found" });
  });

  if (!message._id) return;

  return res.status(200).json({ message: "updated Message Successfully" });
};

export const PinChat = async (req, res) => {
  const { chat_id } = req.params;

  if (!chat_id)
    return res.status(422).json({ message: "ID of the chat is required" });

  const currentUser = await User.findById(req.user.user_id);

  if (currentUser.pinned_chats?.includes(chat_id)) {
    await User.findByIdAndUpdate(
      req.user.user_id,
      {
        $pull: { pinned_chats: chat_id },
      },
      { multi: true }
    )
      .then((_) => {
        return res.status(200).json({ message: "Unpinned Chat successfully" });
      })
      .catch((err) => {
        return res.status(422).json({ message: err.message });
      });
  } else {
    await User.findByIdAndUpdate(
      req.user.user_id,
      {
        $push: { pinned_chats: chat_id },
      },
      { multi: true }
    )
      .then((_) => {
        return res.status(200).json({ message: "Pinned Chat successfully" });
      })
      .catch((err) => {
        return res.status(422).json({ message: err.message });
      });
  }
};

export const BlockUser = async (req, res) => {
  const { user_id } = req.params;

  if (!user_id)
    return res.status(422).json({ message: "ID of the user is required" });

  const currentUser = await User.findById(req.user.user_id);

  if (currentUser.blocked_users?.includes(user_id)) {
    await User.findByIdAndUpdate(
      req.user.user_id,
      {
        $pull: { blocked_users: user_id },
      },
      { multi: true }
    )
      .then((_) => {
        return res.status(200).json({ message: "Unblocked user successfully" });
      })
      .catch((err) => {
        return res.status(422).json({ message: err.message });
      });
  } else {
    await User.findByIdAndUpdate(
      req.user.user_id,
      {
        $push: { blocked_users: user_id },
      },
      { multi: true }
    )
      .then((_) => {
        return res.status(200).json({ message: "Blocked user successfully" });
      })
      .catch((err) => {
        return res.status(422).json({ message: err.message });
      });
  }
};

export const UpdateUser = async (req, res) => {
  const { avatar, username } = req.body;

  if (avatar && !username) {
    const saved_user = await User.findByIdAndUpdate(req.user.user_id, {
      avatar,
    });

    if (!saved_user._id)
      return res.status(422).json({ message: "Failed to update avatar" });
    return res
      .status(200)
      .json({ message: "Your avatar was updated successfully" });
  } else if (!avatar && username) {
    const saved_user = await User.findByIdAndUpdate(req.user.user_id, {
      username,
    });

    if (!saved_user._id)
      return res.status(422).json({ message: "Failed to update username" });
    return res
      .status(200)
      .json({ message: "Your username was updated successfully" });
  } else if (username && avatar) {
    const saved_user = await User.findByIdAndUpdate(req.user.user_id, {
      username,
      avatar,
    });

    if (!saved_user._id)
      return res
        .status(422)
        .json({ message: "Failed to update username and avatar" });
    return res
      .status(200)
      .json({ message: "Your username and avatar was updated successfully" });
  } else {
    return res
      .status(400)
      .json({ message: "Failed to perform update operation" });
  }
};
