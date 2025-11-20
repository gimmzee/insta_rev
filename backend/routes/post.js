const express = require('express');
const router = express.Router();
const { Post, User, Comment, Like, Follow } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { Op } = require('sequelize');

// 홈 피드 (팔로우한 사용자들의 포스트)
router.get('/home', authMiddleware, async (req, res) => {
    try {
        console.log('=== 홈 피드 요청 ===');
        console.log('User ID:', req.user.id);

        // 내가 팔로우한 사용자들의 ID 가져오기
        const followings = await Follow.findAll({
            where: { follower_id: req.user.id },
            attributes: ['following_id']
        });

        const followingIds = followings.map(f => f.following_id);
        followingIds.push(req.user.id); // 내 포스트도 포함

        console.log('Following IDs:', followingIds);

        // 팔로우한 사용자들의 포스트 가져오기
        const posts = await Post.findAll({
            where: {
                user_id: {
                    [Op.in]: followingIds
                }
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'profile_picture', 'full_name']
                },
                {
                    model: Comment,
                    as: 'comments',
                    include: {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'username', 'profile_picture']
                    },
                    limit: 3,
                    separate: true,
                    order: [['created_at', 'DESC']]
                },
                {
                    model: Like,
                    as: 'likes',
                    attributes: ['user_id'],
                    separate: true
                }
            ],
            order: [['created_at', 'DESC']],
            limit: 20
        });

        // 각 포스트에 좋아요 여부 추가
        const postsWithLikeStatus = posts.map(post => {
            const postData = post.toJSON();
            const likedByMe = postData.likes.some(like => like.user_id === req.user.id);
            
            return {
                _id: post.id,
                id: post.id,
                caption: post.caption,
                image: post.image_url,
                owner: {
                    _id: postData.user.id,
                    username: postData.user.username,
                    profile: postData.user.profile_picture
                },
                likes: postData.likes.map(like => like.user_id),
                comments: postData.comments.map(comment => ({
                    _id: comment.id,
                    user: comment.user.id,
                    comment: comment.content,
                    createdAt: comment.created_at
                })),
                createdAt: post.created_at,
                liked: likedByMe
            };
        });

        console.log('✓ 홈 피드 조회 완료:', postsWithLikeStatus.length, '개');

        res.json(postsWithLikeStatus);

    } catch (error) {
        console.error('❌ 홈 피드 오류:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 포스트 생성
router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { caption, image } = req.body;

        console.log('=== 포스트 생성 요청 ===');
        console.log('User ID:', req.user.id);
        console.log('Caption:', caption);
        console.log('Image:', image ? 'PROVIDED' : 'MISSING');

        if (!image) {
            return res.status(400).json({
                success: false,
                message: '이미지는 필수입니다'
            });
        }

        // 포스트 생성
        const post = await Post.create({
            user_id: req.user.id,
            caption: caption || '',
            image_url: image
        });

        // 사용자의 포스트 수 증가
        await User.increment('posts_count', {
            where: { id: req.user.id }
        });

        // 생성된 포스트 정보와 사용자 정보
        const fullPost = await Post.findByPk(post.id, {
            include: {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'profile_picture']
            }
        });

        console.log('✓ 포스트 생성 완료:', post.id);

        res.status(201).json({
            _id: fullPost.id,
            id: fullPost.id,
            caption: fullPost.caption,
            image: fullPost.image_url,
            owner: {
                _id: fullPost.user.id,
                username: fullPost.user.username,
                profile: fullPost.user.profile_picture
            },
            likes: [],
            comments: [],
            createdAt: fullPost.created_at
        });

    } catch (error) {
        console.error('❌ 포스트 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 특정 포스트 조회
router.get('/set/:postId', authMiddleware, async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.postId, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'profile_picture', 'full_name']
                },
                {
                    model: Comment,
                    as: 'comments',
                    include: {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'username', 'profile_picture']
                    },
                    order: [['created_at', 'DESC']]
                },
                {
                    model: Like,
                    as: 'likes',
                    attributes: ['user_id']
                }
            ]
        });

        if (!post) {
            return res.status(404).json({
                success: false,
                message: '포스트를 찾을 수 없습니다'
            });
        }

        const postData = post.toJSON();
        const likedByMe = postData.likes.some(like => like.user_id === req.user.id);

        res.json({
            _id: post.id,
            id: post.id,
            caption: post.caption,
            image: post.image_url,
            owner: {
                _id: postData.user.id,
                username: postData.user.username,
                profile: postData.user.profile_picture
            },
            likes: postData.likes.map(like => like.user_id),
            comments: postData.comments.map(comment => ({
                _id: comment.id,
                user: {
                    _id: comment.user.id,
                    username: comment.user.username,
                    profile: comment.user.profile_picture
                },
                comment: comment.content,
                createdAt: comment.created_at
            })),
            createdAt: post.created_at,
            liked: likedByMe
        });

    } catch (error) {
        console.error('❌ 포스트 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 포스트 수정
router.put('/update/:postId', authMiddleware, async (req, res) => {
    try {
        const { caption } = req.body;
        
        const post = await Post.findByPk(req.params.postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: '포스트를 찾을 수 없습니다'
            });
        }

        // 작성자 확인
        if (post.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: '권한이 없습니다'
            });
        }

        if (!caption) {
            return res.status(400).json({
                success: false,
                message: 'Caption required'
            });
        }

        await post.update({ caption });

        console.log('✓ 포스트 수정 완료:', post.id);

        res.json({
            success: true,
            edited: true
        });

    } catch (error) {
        console.error('❌ 포스트 수정 오류:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 포스트 삭제
router.delete('/delete/:postId', authMiddleware, async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: '포스트를 찾을 수 없습니다'
            });
        }

        // 작성자 확인
        if (post.user_id !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'forbidden'
            });
        }

        await post.destroy();

        // 사용자의 포스트 수 감소
        await User.decrement('posts_count', {
            where: { id: req.user.id }
        });

        console.log('✓ 포스트 삭제 완료:', req.params.postId);

        res.status(200).json({
            success: true,
            message: 'done'
        });

    } catch (error) {
        console.error('❌ 포스트 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 좋아요/좋아요 취소
router.put('/handlelike/:postId', authMiddleware, async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post doesn't exist"
            });
        }

        // 이미 좋아요를 눌렀는지 확인
        const existingLike = await Like.findOne({
            where: {
                post_id: req.params.postId,
                user_id: req.user.id
            }
        });

        if (existingLike) {
            // 좋아요 취소
            await existingLike.destroy();
            await Post.decrement('likes_count', {
                where: { id: req.params.postId }
            });

            console.log('✓ 좋아요 취소:', req.params.postId);

            res.json({
                success: true,
                action: 'unliked'
            });
        } else {
            // 좋아요
            await Like.create({
                post_id: req.params.postId,
                user_id: req.user.id
            });
            await Post.increment('likes_count', {
                where: { id: req.params.postId }
            });

            console.log('✓ 좋아요:', req.params.postId);

            res.json({
                success: true,
                action: 'liked'
            });
        }

    } catch (error) {
        console.error('❌ 좋아요 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 댓글 추가
router.post('/addcomment/:postId', authMiddleware, async (req, res) => {
    try {
        const { comment } = req.body;

        if (!comment) {
            return res.status(500).json({
                success: false,
                message: "Cant make an empty comment"
            });
        }

        const post = await Post.findByPk(req.params.postId);

        if (!post) {
            return res.status(400).json({
                success: false,
                message: "Post doesn't exist"
            });
        }

        // 댓글 생성
        const newComment = await Comment.create({
            post_id: req.params.postId,
            user_id: req.user.id,
            content: comment
        });

        // 댓글 수 증가
        await Post.increment('comments_count', {
            where: { id: req.params.postId }
        });

        // 댓글 정보와 사용자 정보
        const fullComment = await Comment.findByPk(newComment.id, {
            include: {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'profile_picture']
            }
        });

        console.log('✓ 댓글 추가:', newComment.id);

        res.json({
            _id: fullComment.id,
            user: fullComment.user.id,
            comment: fullComment.content,
            createdAt: fullComment.created_at
        });

    } catch (error) {
        console.error('❌ 댓글 추가 오류:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 댓글 수정
router.put('/addcomment/:postId', authMiddleware, async (req, res) => {
    try {
        const { comment } = req.body;
        const { commentId } = req.query;

        const commentToUpdate = await Comment.findByPk(commentId);

        if (!commentToUpdate) {
            return res.status(404).json({
                success: false,
                message: '댓글을 찾을 수 없습니다'
            });
        }

        // 작성자 확인
        if (commentToUpdate.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: '권한이 없습니다'
            });
        }

        await commentToUpdate.update({ content: comment });

        console.log('✓ 댓글 수정:', commentId);

        res.json({
            success: true,
            updated: true
        });

    } catch (error) {
        console.error('❌ 댓글 수정 오류:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 댓글 삭제
router.delete('/removecomment/:postId', authMiddleware, async (req, res) => {
    try {
        const { commentId } = req.query;

        const post = await Post.findByPk(req.params.postId);

        if (!post) {
            return res.status(400).json({
                success: false,
                message: "Post doesn't exist"
            });
        }

        const comment = await Comment.findByPk(commentId);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: '댓글을 찾을 수 없습니다'
            });
        }

        // 작성자 또는 포스트 작성자만 삭제 가능
        if (comment.user_id !== req.user.id && post.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: '권한이 없습니다'
            });
        }

        await comment.destroy();

        // 댓글 수 감소
        await Post.decrement('comments_count', {
            where: { id: req.params.postId }
        });

        console.log('✓ 댓글 삭제:', commentId);

        res.json({
            success: true,
            deleted: true
        });

    } catch (error) {
        console.error('❌ 댓글 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 사용자의 포스트 조회
router.get('/userpost/:userId', authMiddleware, async (req, res) => {
    try {
        const posts = await Post.findAll({
            where: { user_id: req.params.userId },
            order: [['created_at', 'DESC']],
            attributes: ['id', 'image_url', 'caption', 'likes_count', 'comments_count', 'created_at']
        });

        const formattedPosts = posts.map(post => ({
            _id: post.id,
            image: post.image_url,
            caption: post.caption,
            likes: post.likes_count,
            comments: post.comments_count,
            createdAt: post.created_at
        }));

        res.json(formattedPosts);

    } catch (error) {
        console.error('❌ 사용자 포스트 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Explore (모든 포스트)
router.get('/get/explore', authMiddleware, async (req, res) => {
    try {
        const posts = await Post.findAll({
            order: [['created_at', 'DESC']],
            limit: 30,
            attributes: ['id', 'image_url', 'likes_count', 'comments_count']
        });

        const formattedPosts = posts.map(post => ({
            _id: post.id,
            image: post.image_url,
            likes: post.likes_count,
            comments: post.comments_count
        }));

        res.json(formattedPosts);

    } catch (error) {
        console.error('❌ Explore 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
