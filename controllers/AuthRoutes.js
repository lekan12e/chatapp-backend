import express from "express";
import bcrypt from "bcrypt";
import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";
import verifyToken from "../middlewares/auth.js";

const authRouter = express.Router();

authRouter.post("/register", async (req, res) => {
  // Get user input
  const { username, email, password } = req.body;

  // Validate user input
  if (!(email && password && username)) {
    return res.status(400).json({ message: "All inputs are required" });
  }

  // check if user already exist
  // Validate if user exist in our database
  const oldUser = await User.findOne({ email });

  if (oldUser) {
    return res
      .status(409)
      .json({ message: "A User already exist  with this email" });
  }

  //Encrypt user password
  let encryptedPassword = await bcrypt.hash(password, 10);

  // Create user in our database
  const user = await User.create({
    username: username,
    email: email.toLowerCase(), // sanitize: convert email to lowercase
    password: encryptedPassword,
  }).catch((err) => {
    return res.status(400).json({
      message: "Failed to save user to the database...please try again later",
    });
  });

  // Create token
  const token = jwt.sign({ user_id: user._id, email }, process.env.TOKEN_KEY, {
    expiresIn: "2h",
  });
  // save user token
  user.token = token;

  // return new user
  return res.status(201).json({ user, token });
});

// Login
authRouter.post("/login", async (req, res) => {
  // our login logic goes here
  const { email, password } = req.body;

  // Validate user input
  if (!(email && password)) {
    return res.status(400).json({ message: "All Inputs are Required" });
  }
  // Validate if user exist in our database
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    // Create token
    const token = jwt.sign(
      { user_id: user._id, email },
      process.env.TOKEN_KEY,
      {
        expiresIn: "4h",
      }
    );

    // save user token
    user.token = token;

    // user
    return res.status(200).json({ user, token });
  }

  return res.status(400).json({ message: "Invalid Credentials" });
});

authRouter.post("/updatePassword", verifyToken, async (req, res) => {
  const { old_password, new_password } = req.body;

  if (!(old_password && new_password)) {
    return res.status(422).json({ message: "Invalid Number of Parameters" });
  }

  const user = await User.findById(req.user.user_id);

  if (user && (await bcrypt.compare(old_password, user.password))) {
    let encryptedPassword = await bcrypt.hash(new_password, 10);

    await User.findByIdAndUpdate(user._id, { password: encryptedPassword });

    const token = jwt.sign(
      { user_id: user._id, email: user.email },
      process.env.TOKEN_KEY,
      {
        expiresIn: "4h",
      }
    );

    return res.status(200).json({ token });
  }

  return res.status(401).json({ message: "unauthorized to update password" });
});

export default authRouter;
