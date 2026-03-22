const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many requests, please try again later.' }
});

router.post('/api/auth/login', authLimiter, (req, res) => {
  const { username, password } = req.body || {};
  const operatorUsername = process.env.OPERATOR_USERNAME;
  const operatorPassword = process.env.OPERATOR_PASSWORD;
  const jwtSecret = process.env.JWT_SECRET;

  if (!operatorUsername || !operatorPassword || !jwtSecret) {
    res.status(500).json({ error: 'Server misconfiguration: auth env vars not set' });
    return;
  }

  if (username !== operatorUsername || password !== operatorPassword) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign(
    {
      username: operatorUsername,
      role: 'operator'
    },
    jwtSecret,
    {
      expiresIn: '8h'
    }
  );

  res.json({ token });
});

module.exports = router;
