// Подключение зависимостей
require('dotenv').config();

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');

// Инициализация
const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Валидация данных
const validateLogin = (login) => /^[a-zA-Z0-9]{6,}$/.test(login);
const validatePassword = (password) => password.length >= 8;
const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);
const validatePhone = (phone) => /^[\d+\-\s()]{10,}$/.test(phone);

const hashPassword = async (pwd) => bcrypt.hash(pwd, 10);
const comparePassword = async (pwd, hash) => bcrypt.compare(pwd, hash);

const sendError = (res, status, message) => 
  res.status(status).json({ error: message });

// Валидация регистрации
const validateRegistration = (data) => {
  const errors = [];
  if (!validateLogin(data.login)) errors.push('Логин: 6+ символов, латиница и цифры');
  if (!validatePassword(data.password)) errors.push('Пароль: минимум 8 символов');
  if (!validateEmail(data.email)) errors.push('Некорректный email');
  if (!validatePhone(data.phone)) errors.push('Некорректный телефон');
  return errors;
};

// JWT-аутентификация для пользователей
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return sendError(res, 401, 'Требуется авторизация (Bearer Token)');
  }
  
  const token = authHeader.slice(7);
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    
    if (payload.userId === 'admin_demo') {
      req.user = {
        id: 'admin_demo',
        login: payload.login,
        fullName: 'Администратор',
        role: 'ADMIN',
        email: 'admin@conf.ru',
        phone: '+7 (000) 000-00-00'
      };
      return next();
    }
    
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    
    if (!user) return sendError(res, 401, 'Пользователь не найден');
    
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Сессия истекла');
    }
    return sendError(res, 401, 'Неверный токен');
  }
};

// Админ-мидлвар (демо-режим)
const adminMiddleware = async (req, res, next) => {
  const { login, password } = req.headers;
  if (login === process.env.ADMIN_LOGIN && password === process.env.ADMIN_PASSWORD) {
    req.admin = true;
    req.user = { id: 'admin_demo', login, role: 'ADMIN' };
    return next();
  }
  
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      
      if (payload.role === 'ADMIN' || payload.userId === 'admin_demo') {
        req.admin = true;
        req.user = { 
          id: payload.userId, 
          login: payload.login, 
          role: 'ADMIN',
          fullName: 'Администратор'
        };
        return next();
      }
    } catch (err) {
    }
  }
  
  return sendError(res, 403, 'Доступ запрещён');
};

// Роуты аутентификации
app.post('/api/register', async (req, res) => {
  try {
    const { login, password, fullName, phone, email } = req.body;
    
    const errors = validateRegistration({ login, password, email, phone });
    if (errors.length > 0) {
      return sendError(res, 400, errors[0]);
    }
    
    const exists = await prisma.user.findUnique({ where: { login } });
    if (exists) return sendError(res, 409, 'Логин уже занят');
    
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: { login, password: hashedPassword, fullName, phone, email }
    });
    
    res.status(201).json({ message: 'Пользователь зарегистрирован', userId: user.id });
  } catch (err) {
    console.error('[REGISTER] Error:', err);
    sendError(res, 500, 'Ошибка сервера');
  }
});

// Вход в систему
app.post('/api/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    
    if (login === process.env.ADMIN_LOGIN && password === process.env.ADMIN_PASSWORD) {
      const adminPayload = {
        userId: 'admin_demo',
        login: process.env.ADMIN_LOGIN,
        role: 'ADMIN'
      };
      
      const token = jwt.sign(
        adminPayload,
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      return res.json({ 
        message: 'Успешный вход (демо-админ)',
        token,
        user: { 
          id: 'admin_demo', 
          login: process.env.ADMIN_LOGIN, 
          fullName: 'Администратор', 
          role: 'ADMIN',
          email: 'admin@conf.ru',
          phone: '+7 (000) 000-00-00'
        }
      });
    }
    
    const user = await prisma.user.findUnique({ where: { login } });
    
    if (!user || !(await comparePassword(password, user.password))) {
      return sendError(res, 401, 'Неверный логин или пароль');
    }
    
    const token = jwt.sign(
      { userId: user.id, login: user.login, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ 
      message: 'Успешный вход',
      token,
      user: { id: user.id, login: user.login, fullName: user.fullName, role: user.role }
    });
  } catch (err) {
    console.error('[LOGIN] Error:', err);
    sendError(res, 500, 'Ошибка сервера');
  }
});

// Роуты помещений
app.get('/api/rooms', async (req, res) => {
  try {
    const { type } = req.query;
    const where = type ? { type } : {};
    const rooms = await prisma.room.findMany({ where, orderBy: { name: 'asc' } });
    res.json(rooms);
  } catch (err) {
    console.error('[ROOMS] Error:', err);
    sendError(res, 500, 'Ошибка сервера');
  }
});

// Роуты бронирований
app.post('/api/bookings', authMiddleware, async (req, res) => {
  try {
    const { roomId, startDate, paymentMethod } = req.body;
    
    if (!roomId || !startDate || !paymentMethod) {
      return sendError(res, 400, 'Все поля обязательны');
    }
    
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) return sendError(res, 404, 'Помещение не найдено');
    
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      return sendError(res, 400, 'Некорректная дата');
    }
    
    const booking = await prisma.booking.create({
      data: {
        userId: req.user.id,
        roomId,
        startDate: start,
        paymentMethod,
        status: 'NEW'
      }
    });
    
    res.status(201).json({ message: 'Заявка создана', bookingId: booking.id });
  } catch (err) {
    console.error('[BOOKING] Error:', err);
    sendError(res, 500, 'Ошибка сервера');
  }
});

// История заявок пользователя
app.get('/api/bookings/me', authMiddleware, async (req, res) => {
  try {
    const where = req.user.id === 'admin_demo' 
      ? {} 
      : { userId: req.user.id };
    
    const bookings = await prisma.booking.findMany({
      where,
      include: { room: true, review: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bookings);
  } catch (err) {
    console.error('[MY BOOKINGS] Error:', err);
    sendError(res, 500, 'Ошибка сервера');
  }
});

// Роуты отзывов
app.post('/api/reviews', authMiddleware, async (req, res) => {
  try {
    const { bookingId, content, rating } = req.body;
    
    if (!bookingId || rating === undefined) {
      return sendError(res, 400, 'Поля "Заявка" и "Рейтинг" обязательны');
    }
    
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return sendError(res, 400, 'Рейтинг должен быть от 1 до 5');
    }
    
    let contentValue = null;
    if (content && typeof content === 'string') {
      const trimmed = content.trim();
      if (trimmed.length > 0 && trimmed.length < 10) {
        return sendError(res, 400, 'Текст отзыва должен содержать минимум 10 символов');
      }
      contentValue = trimmed.length > 0 ? trimmed : null;
    }
    
    const booking = await prisma.booking.findUnique({ 
      where: { id: bookingId },
      include: { review: true }
    });
    
    if (!booking) return sendError(res, 404, 'Заявка не найдена');
    
    if (booking.userId !== req.user.id) {
      return sendError(res, 403, 'Доступ запрещён');
    }
    
    if (booking.status !== 'COMPLETED') {
      return sendError(res, 400, 'Отзыв можно оставить только после завершения мероприятия');
    }
    
    if (booking.review) {
      return sendError(res, 409, 'Отзыв уже оставлен');
    }
    
    const review = await prisma.review.create({
      data: { 
        bookingId, 
        userId: req.user.id, 
        content: contentValue,
        rating 
      }
    });
    
    res.status(201).json({ message: 'Отзыв добавлен', reviewId: review.id });
    
  } catch (err) {
    console.error('[REVIEW] Error:', err);
    
    if (err.code === 'P2002') {
      return sendError(res, 409, 'Отзыв уже существует');
    }
    if (err.code === 'P2003') {
      return sendError(res, 400, 'Неверные данные заявки');
    }
    
    sendError(res, 500, 'Ошибка сервера');
  }
});

// Админские роуты
app.get('/api/admin/bookings', adminMiddleware, async (req, res) => {
  try {
    const { status, userId, roomId, page = 1, limit = 10, sort = 'createdAt' } = req.query;
    
    const allowedSorts = ['createdAt', 'startDate', 'status'];
    const orderByField = allowedSorts.includes(sort) ? sort : 'createdAt';
    
    const where = {};
    if (status && ['NEW', 'ASSIGNED', 'COMPLETED'].includes(status)) {
      where.status = status;
    }
    if (userId) where.userId = userId;
    if (roomId) where.roomId = roomId;
    
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;
    
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where, 
        include: { user: true, room: true },
        skip, 
        take: limitNum, 
        orderBy: { [orderByField]: 'desc' }
      }),
      prisma.booking.count({ where })
    ]);
    
    res.json({ 
      bookings, 
      pagination: { 
        page: pageNum, 
        limit: limitNum, 
        total, 
        pages: Math.ceil(total / limitNum) 
      } 
    });
  } catch (err) {
    console.error('[ADMIN BOOKINGS] Error:', err);
    sendError(res, 500, 'Ошибка сервера');
  }
});

// Обновление статуса заявки
app.patch('/api/admin/bookings/:id/status', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['NEW', 'ASSIGNED', 'COMPLETED'].includes(status)) {
      return sendError(res, 400, 'Недопустимый статус');
    }
    
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return sendError(res, 404, 'Заявка не найдена');
    
    const updated = await prisma.booking.update({
      where: { id },
      data: { status },
      include: { user: true, room: true }
    });
    
    res.json({ message: 'Статус обновлён', booking: updated });
  } catch (err) {
    console.error('[ADMIN STATUS] Error:', err);
    sendError(res, 500, 'Ошибка сервера');
  }
});

// Health check
app.get('/api/health', (req, res) => res.json({ 
  status: 'ok',
  timestamp: new Date().toISOString()
}));

// Обработчик 404
app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
  console.log(`  Prisma client: ${prisma._clientVersion || 'loaded'}`);
  console.log(` JWT enabled, Admin demo auth: ${process.env.ADMIN_LOGIN}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});