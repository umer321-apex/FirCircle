const express = require('express');
const router = express.Router();
const {
  listPlans,
  getPlanById,
  createPlan,
  getMyPlans,
  purchasePlan,
  getMyPurchasedPlans,
} = require('../controllers/coachController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/plans', listPlans);
router.get('/plans/mine', getMyPlans);
router.get('/purchased', getMyPurchasedPlans);
router.get('/plans/:id', getPlanById);
router.post('/plans', createPlan);
router.post('/plans/:id/purchase', purchasePlan);

module.exports = router;