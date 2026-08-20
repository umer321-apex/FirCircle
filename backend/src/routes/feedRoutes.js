const express = require('express');
const protect = require('../middleware/authMiddleware');
const {
  createPost,
  getFeed,
  toggleLike,
  addComment,
  getComments,
  savePost,
} = require('../controllers/feedController');

const router = express.Router();

router.post('/posts', protect, createPost);
router.get('/feed', protect, getFeed);
router.post('/posts/:id/like', protect, toggleLike);
router.post('/posts/:id/comment', protect, addComment);
router.get('/posts/:id/comments', protect, getComments);
router.post('/posts/:id/save', protect, savePost);

module.exports = router;