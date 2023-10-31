const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const ctrlWrapper = require('../helpers/ctrlWrapper');
const multer = require('multer');
const jimp = require('jimp');
const path = require('path');
const fs = require('fs/promises');
const gravatar = require('gravatar');

const storage = multer.memoryStorage();
const upload = multer({ storage });

const register = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user) {
      return res.status(409).json({ message: 'Email is already in use' });
    }

    const avatarURL = gravatar.url(email, { s: '250', r: 'pg', d: 'identicon' });

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({ email, password: hashedPassword, avatarURL });

    await newUser.save();

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ _id: newUser._id, email: newUser.email, subscription: newUser.subscription, createdAt: newUser.createdAt, updatedAt: newUser.updatedAt, token, avatarURL });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Registration failed' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email or password is incorrect' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email or password is incorrect' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    user.token = token;
    await user.save();

    res.json({ _id: user._id, email: user.email, subscription: user.subscription, createdAt: user.createdAt, updatedAt: user.updatedAt, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Login failed' });
  }
};

const logout = async (req, res) => {
  try {
    req.user.token = null;
    await req.user.save();
    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Logout failed' });
  }
};

const getCurrentUser = (req, res) => {
  const { email, subscription } = req.user;
  res.json({
    email,
    subscription,
  });
};

const updateAvatar = async (req, res) => {
  try {
    const { user } = req;
    const avatarData = req.file ? req.file.buffer : null;

    if (!avatarData) {
      return res.status(400).json({ message: 'No file found.' });
    }
    
    const uniqueFilename = `${user._id}-${Date.now()}.png`;
    const tmpAvatarPath = path.join(__dirname, '..', 'tmp', uniqueFilename);
    const avatarPath = path.join(__dirname, '..', 'public', 'avatars', uniqueFilename);

    try {
      await fs.writeFile(tmpAvatarPath, avatarData);
      const jimpImage = await jimp.read(tmpAvatarPath);
      await jimpImage.cover(250, 250);
      await jimpImage.writeAsync(tmpAvatarPath);
      user.avatarURL = `/avatars/${uniqueFilename}`;
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Avatar processing failed', error: error.message });
    }
    await user.save();
    await fs.rename(tmpAvatarPath, avatarPath);
    
    const updatedUser = await User.findByIdAndUpdate(user._id, { avatarURL: user.avatarURL }, { new: true });

    if (!updatedUser) {
      return res.status(500).json({ message: 'Avatar URL update failed' });
    }
    return res.status(200).json({ avatarURL: updatedUser.avatarURL });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Avatar upload failed', error: error.message });
  }
};

module.exports = {
  register: ctrlWrapper(register),
  login: ctrlWrapper(login),
  logout: ctrlWrapper(logout),
  getCurrentUser: ctrlWrapper(getCurrentUser),
  updateAvatar: ctrlWrapper(updateAvatar),
};
