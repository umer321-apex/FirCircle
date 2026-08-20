const mongoose = require('mongoose');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const MealPlan = require('../models/MealPlan');

const CONTENT_MODEL_BY_TYPE = {
  workout: 'Workout',
  progressPhoto: 'ProgressEntry',
  mealPlan: 'MealPlan',
};

function todayMidnightUTC() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// Two users are "approved friends" if each appears in the other's friends[] —
// symmetric check so a one-sided add doesn't leak a private profile's posts.
function areFriends(userA, userB) {
  const aFriends = (userA.friends || []).map((id) => id.toString());
  const bFriends = (userB.friends || []).map((id) => id.toString());
  return aFriends.includes(userB._id.toString()) && bFriends.includes(userA._id.toString());
}

// POST /api/posts  (FR-7.1)
exports.createPost = async (req, res, next) => {
  try {
    const { type, contentRefId, caption = '' } = req.body;

    if (!type || !CONTENT_MODEL_BY_TYPE[type]) {
      return res.status(400).json({
        message: `type must be one of: ${Object.keys(CONTENT_MODEL_BY_TYPE).join(', ')}`,
      });
    }
    if (!contentRefId || !mongoose.isValidObjectId(contentRefId)) {
      return res.status(400).json({ message: 'A valid contentRefId is required' });
    }

    const contentRefModel = CONTENT_MODEL_BY_TYPE[type];

    // Verify the referenced content actually exists and belongs to this user,
    // so you can't post someone else's workout/progress entry/meal plan.
    const ContentModel = mongoose.model(contentRefModel);
    const contentDoc = await ContentModel.findOne({ _id: contentRefId, userId: req.user._id }).select('_id').lean();
    if (!contentDoc) {
      return res.status(404).json({ message: `${contentRefModel} not found for this user` });
    }

    const post = await Post.create({
      userId: req.user._id,
      type,
      contentRefId,
      contentRefModel,
      caption: caption.trim(),
    });

    return res.status(201).json({ post });
  } catch (error) {
    console.error(`[feedController.createPost] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error creating post' });
  }
};

// GET /api/feed  (FR-7.3 — respects visibility + friendship)
exports.getFeed = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id).select('friends').lean();

    // Fetch a generous recent window, then filter by visibility in-app.
    // At MVP scale this is simpler and safer than trying to encode the
    // friendship check into the Mongo query itself.
    const rawPosts = await Post.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('userId', 'name visibility friends')
      .populate('contentRefId')
      .lean();

    const visiblePosts = rawPosts.filter((post) => {
      const author = post.userId;
      if (!author) return false; // author deleted
      if (author._id.toString() === req.user._id.toString()) return true; // always see your own
      if (author.visibility === 'public') return true;
      // Private author: only visible to approved (mutual) friends
      return areFriends({ _id: req.user._id, friends: currentUser.friends }, author);
    });

    const postsWithLikeState = visiblePosts.map((post) => ({
      _id: post._id,
      type: post.type,
      caption: post.caption,
      content: post.contentRefId,
      author: { _id: post.userId._id, name: post.userId.name },
      likeCount: (post.likes || []).length,
      likedByMe: (post.likes || []).some((id) => id.toString() === req.user._id.toString()),
      savedByMe: (post.savedBy || []).some((id) => id.toString() === req.user._id.toString()),
      commentCount: post.commentCount || 0,
      createdAt: post.createdAt,
    }));

    return res.status(200).json({ posts: postsWithLikeState.slice(0, 50) });
  } catch (error) {
    console.error(`[feedController.getFeed] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error fetching feed' });
  }
};

// POST /api/posts/:id/like  (toggle)
exports.toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const userIdStr = req.user._id.toString();
    const alreadyLiked = post.likes.some((id) => id.toString() === userIdStr);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userIdStr);
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();

    return res.status(200).json({
      liked: !alreadyLiked,
      likeCount: post.likes.length,
    });
  } catch (error) {
    console.error(`[feedController.toggleLike] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error toggling like' });
  }
};

// POST /api/posts/:id/comment
exports.addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = await Comment.create({
      postId: post._id,
      userId: req.user._id,
      text: text.trim(),
    });

    post.commentCount += 1;
    await post.save();

    const populated = await comment.populate('userId', 'name');

    return res.status(201).json({ comment: populated, commentCount: post.commentCount });
  } catch (error) {
    console.error(`[feedController.addComment] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error adding comment' });
  }
};

// GET /api/posts/:id/comments — needed by PostDetailScreen to load the thread
exports.getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ postId: req.params.id })
      .sort({ createdAt: 1 })
      .populate('userId', 'name')
      .lean();

    return res.status(200).json({ comments });
  } catch (error) {
    console.error(`[feedController.getComments] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error fetching comments' });
  }
};

// POST /api/posts/:id/save  (FR-7.2 — saving a meal plan copies it into the viewer's own meal log)
exports.savePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('contentRefId');
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const userIdStr = req.user._id.toString();
    const alreadySaved = post.savedBy.some((id) => id.toString() === userIdStr);

    if (alreadySaved) {
      post.savedBy = post.savedBy.filter((id) => id.toString() !== userIdStr);
      await post.save();
      return res.status(200).json({ saved: false, copiedToMealLog: false });
    }

    post.savedBy.push(req.user._id);
    await post.save();

    let copiedToMealLog = false;

    // FR-7.2: saving a meal plan copies it into the viewer's own meal log
    if (post.type === 'mealPlan' && post.contentRefId) {
      const sourcePlan = post.contentRefId;
      const date = todayMidnightUTC();

      let myPlan = await MealPlan.findOne({ userId: req.user._id, date });
      if (!myPlan) {
        myPlan = new MealPlan({
          userId: req.user._id,
          date,
          targetCalories: sourcePlan.targetCalories || 0,
          targetMacros: sourcePlan.targetMacros || { protein: 0, carbs: 0, fat: 0 },
        });
      }

      // Copy each logged meal from the shared plan as a new entry in the viewer's plan
      for (const meal of sourcePlan.meals || []) {
        myPlan.meals.push({
          slot: meal.slot,
          foodItemId: meal.foodItemId || undefined,
          customEntry: meal.customEntry || undefined,
          servings: meal.servings || 1,
          isCustom: meal.isCustom,
        });
      }

      await myPlan.save();
      copiedToMealLog = true;
    }

    return res.status(200).json({ saved: true, copiedToMealLog });
  } catch (error) {
    console.error(`[feedController.savePost] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error saving post' });
  }
};