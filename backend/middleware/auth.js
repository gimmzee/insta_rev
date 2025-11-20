const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ success: false, message: '인증 필요' });
        
        const decoded = jwt.verify(token, process.env.JWT_Secret);
        const user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
        
        if (!user) return res.status(401).json({ success: false, message: '유효하지 않은 토큰' });
        
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: '인증 실패' });
    }
};

module.exports = { authMiddleware };
