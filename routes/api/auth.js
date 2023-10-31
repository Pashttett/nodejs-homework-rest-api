const express = require('express');
const { register, login, logout, getCurrentUser, updateAvatar } = require('../../controllers/auth');
const { authenticateUser } = require('../../middlewares/authenticate');
const router = express.Router();
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticateUser, logout);
router.get('/current', authenticateUser, getCurrentUser);
router.patch('/avatars', authenticateUser, upload.single('avatar'), updateAvatar);

module.exports = router;
