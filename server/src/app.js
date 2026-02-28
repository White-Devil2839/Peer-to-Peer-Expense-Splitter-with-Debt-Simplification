const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// --------------- Middleware ---------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    cors({
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true,
    })
);

// --------------- Health Check ---------------
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --------------- Routes ---------------
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/groups', require('./routes/group.routes'));
app.use('/api/expenses', require('./routes/expense.routes'));

// Group-scoped routes
const { protect } = require('./middleware/auth');
const { getGroupExpenses } = require('./controllers/expense.controller');
const { getGroupBalances } = require('./controllers/balance.controller');
app.get('/api/groups/:groupId/expenses', protect, getGroupExpenses);
app.get('/api/groups/:groupId/balances', protect, getGroupBalances);

// --------------- Error Handler ---------------
app.use(errorHandler);

module.exports = app;