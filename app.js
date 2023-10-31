const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const path = require('path');
const contactsRouter = require('./routes/api/contacts');
const authRouter = require('./routes/api/auth');
const app = express();
const formatsLogger = app.get('env') === 'development' ? 'dev' : 'combined';

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());

app.use('/avatars', express.static(path.join(__dirname, 'public', 'avatars')));

app.use('/contacts', contactsRouter);
app.use('/auth', authRouter);

app.use((_, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.use((err, req, res, next) => {
  const { status = 500, message = 'Server error' } = err;
  res.status(status).json({ message });
});

module.exports = app;
