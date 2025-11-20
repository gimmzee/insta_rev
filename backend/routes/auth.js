const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// 회원가입
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, full_name } = req.body;

        console.log('=== 회원가입 요청 ===');
        console.log('전체 Body:', req.body);
        console.log('Username:', username || 'MISSING');
        console.log('Email:', email || 'MISSING');
        console.log('Password:', password ? 'PROVIDED' : 'MISSING');

        // 필수 필드 검증
        if (!username || !email || !password) {
            const missing = [];
            if (!username) missing.push('username');
            if (!email) missing.push('email');
            if (!password) missing.push('password');
            
            console.log('❌ 필수 필드 누락:', missing.join(', '));
            
            return res.status(400).json({
                data: {
                    success: false,
                    message: `다음 필드를 입력해주세요: ${missing.join(', ')}`
                }
            });
        }

        // 기존 사용자 확인
        const existingUser = await User.findOne({
            where: { username }
        });

        if (existingUser) {
            console.log('❌ 이미 존재하는 사용자:', username);
            return res.status(400).json({
                data: {
                    success: false,
                    message: '이미 존재하는 사용자명입니다'
                }
            });
        }

        console.log('✓ 사용자 생성 시작...');

        // 사용자 생성
        const user = await User.create({
            username,
            email,
            password,
            full_name: full_name || username
        });

        console.log('✓ 사용자 생성 완료 - ID:', user.id);

        // JWT 토큰 생성
        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_Secret,
            { expiresIn: '7d' }
        );

        console.log('✓ JWT 토큰 생성 완료');

        const responseData = {
            data: {
                success: true,
                token,
                user: {
                    _id: user.id,
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    full_name: user.full_name,
                    profile_picture: user.profile_picture
                }
            }
        };

        console.log('✓ 응답 전송:', {
            success: true,
            userId: user.id,
            username: user.username
        });

        res.status(201).json(responseData);

    } catch (error) {
        console.error('❌ 회원가입 오류:', error.message);
        console.error('Error name:', error.name);
        console.error('Error stack:', error.stack);
        
        res.status(500).json({
            data: {
                success: false,
                message: error.message || '회원가입 중 오류가 발생했습니다'
            }
        });
    }
});

// 로그인
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        console.log('=== 로그인 요청 ===');
        console.log('Username:', username);

        if (!username || !password) {
            console.log('❌ 입력값 누락');
            return res.status(400).json({
                data: {
                    success: false,
                    message: '사용자명과 비밀번호를 입력해주세요'
                }
            });
        }

        const user = await User.findOne({
            where: { username }
        });

        if (!user) {
            console.log('❌ 사용자를 찾을 수 없음');
            return res.status(401).json({
                data: {
                    success: false,
                    message: '사용자명 또는 비밀번호가 올바르지 않습니다'
                }
            });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            console.log('❌ 비밀번호 불일치');
            return res.status(401).json({
                data: {
                    success: false,
                    message: '사용자명 또는 비밀번호가 올바르지 않습니다'
                }
            });
        }

        console.log('✓ 로그인 성공');

        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_Secret,
            { expiresIn: '7d' }
        );

        res.json({
            data: {
                success: true,
                token,
                user: {
                    _id: user.id,
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    full_name: user.full_name,
                    profile_picture: user.profile_picture
                }
            }
        });

    } catch (error) {
        console.error('❌ 로그인 오류:', error);
        res.status(500).json({
            data: {
                success: false,
                message: error.message
            }
        });
    }
});

module.exports = router;
