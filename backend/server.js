const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config({ path: './config/config.env' });

const { sequelize } = require('./models');
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'MariaDB Backend Running' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));

app.use((err, req, res, next) => {
    res.status(500).json({ success: false, message: err.message });
});

const PORT = process.env.PORT || 8000;

sequelize.authenticate()
    .then(() => {
        console.log('✓ MariaDB 연결 성공');
        app.listen(PORT, () => {
            console.log(`✓ 서버 실행: http://localhost:${PORT}`);
            console.log(`✓ Health: http://localhost:${PORT}/api/health`);
        });
    })
    .catch(err => {
        console.error('✗ 연결 실패:', err);
        process.exit(1);
    });
