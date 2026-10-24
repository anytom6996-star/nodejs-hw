
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import handlebars from 'handlebars';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import createHttpError from 'http-errors';

import { User } from '../models/user.js';
import { Session } from '../models/session.js';
import {
  createSession,
  setSessionCookies,
} from '../services/auth.js';
import { sendEmail } from '../utils/sendMail.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PASSWORD_RESET_EMAIL_MESSAGE =
  'Password reset email sent successfully';

// Register user
export const registerUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return next(createHttpError(400, 'Email in use'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    const session = await createSession(user._id);

    setSessionCookies(res, session);

    return res.status(201).json({ user });
  } catch (error) {
    return next(error);
  }
};

// Login user
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return next(
        createHttpError(401, 'Invalid email or password'),
      );
    }

    const passwordIsValid = await bcrypt.compare(
      password,
      user.password,
    );

    if (!passwordIsValid) {
      return next(
        createHttpError(401, 'Invalid email or password'),
      );
    }

    await Session.deleteMany({ userId: user._id });

    const session = await createSession(user._id);

    setSessionCookies(res, session);

    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
};

// Refresh user session
export const refreshUserSession = async (req, res, next) => {
  try {
    const { sessionId, refreshToken } = req.cookies;

    if (!sessionId || !refreshToken) {
      return next(createHttpError(401, 'Session not found'));
    }

    const session = await Session.findOne({
      _id: sessionId,
      refreshToken,
    });

    if (!session) {
      return next(createHttpError(401, 'Session not found'));
    }

    if (session.refreshTokenValidUntil <= new Date()) {
      await Session.deleteOne({ _id: session._id });

      res.clearCookie('sessionId');
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      return next(createHttpError(401, 'Session token expired'));
    }

    await Session.deleteOne({ _id: session._id });

    const newSession = await createSession(session.userId);

    setSessionCookies(res, newSession);

    return res.status(200).json({
      message: 'Session refreshed successfully',
    });
  } catch (error) {
    return next(error);
  }
};

// Logout user
export const logoutUser = async (req, res, next) => {
  try {
    const { sessionId } = req.cookies;

    if (sessionId) {
      await Session.deleteOne({ _id: sessionId });
    }

    res.clearCookie('sessionId');
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
};

// Request password reset email
export const requestResetEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        message: PASSWORD_RESET_EMAIL_MESSAGE,
      });
    }

    if (!process.env.JWT_SECRET || !process.env.FRONTEND_DOMAIN) {
      return next(
        createHttpError(500, 'Server configuration error'),
      );
    }

    const token = jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '15m',
      },
    );

    const frontendDomain = process.env.FRONTEND_DOMAIN.replace(
      /\/$/,
      '',
    );

    const resetPasswordUrl =
      `${frontendDomain}/reset-password?token=${encodeURIComponent(token)}`;

    const templatePath = path.resolve(
      __dirname,
      '../templates/reset-password-email.html',
    );

    const templateHtml = await fs.readFile(templatePath, 'utf8');

    const template = handlebars.compile(templateHtml);

    const html = template({
      username: user.username || user.email,
      resetPasswordUrl,
    });

    try {
      await sendEmail({
        from: process.env.SMTP_FROM,
        to: user.email,
        subject: 'Password reset',
        html,
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);

      return next(
        createHttpError(
          500,
          'Failed to send the email, please try again later.',
        ),
      );
    }

    return res.status(200).json({
      message: PASSWORD_RESET_EMAIL_MESSAGE,
    });
  } catch (error) {
    return next(error);
  }
};

// Reset password
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    let payload;

    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return next(
        createHttpError(401, 'Invalid or expired token'),
      );
    }

    if (
      typeof payload === 'string' ||
      !payload.sub ||
      !payload.email
    ) {
      return next(
        createHttpError(401, 'Invalid or expired token'),
      );
    }

    const user = await User.findOne({
      _id: payload.sub,
      email: payload.email,
    });

    if (!user) {
      return next(createHttpError(404, 'User not found'));
    }

    user.password = await bcrypt.hash(password, 10);

    await user.save();

    await Session.deleteMany({ userId: user._id });

    res.clearCookie('sessionId');
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return res.status(200).json({
      message: 'Password reset successfully',
    });
  } catch (error) {
    return next(error);
  }
};

export default {
  registerUser,
  loginUser,
  refreshUserSession,
  logoutUser,
  requestResetEmail,
  resetPassword,
};
