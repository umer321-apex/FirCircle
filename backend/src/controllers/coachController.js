const CoachPlan = require('../models/CoachPlan');
const User = require('../models/User');

const COMMISSION_RATE = 0.20; // FitCircle takes 20% per sale (FR-10.2)

// GET /api/coach/plans  — browse all active plans
const listPlans = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { isActive: true };
    if (type) filter.type = type;

    const plans = await CoachPlan.find(filter)
      .populate('coachUserId', 'name profilePhotoUrl')
      .select('-purchases')
      .sort({ createdAt: -1 });

    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch plans', error: error.message });
  }
};

// GET /api/coach/plans/:id — single plan detail
const getPlanById = async (req, res) => {
  try {
    const plan = await CoachPlan.findById(req.params.id)
      .populate('coachUserId', 'name profilePhotoUrl')
      .select('-purchases');

    if (!plan || !plan.isActive) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const alreadyPurchased = await CoachPlan.exists({
      _id: req.params.id,
      'purchases.buyerId': req.user._id,
    });

    res.status(200).json({ ...plan.toObject(), alreadyPurchased: !!alreadyPurchased });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch plan', error: error.message });
  }
};

// POST /api/coach/plans — coach creates a listing (FR-10.1)
const createPlan = async (req, res) => {
  try {
    const { title, description, type, priceUSD, coverImageUrl } = req.body;

    if (!title || !description || !type || priceUSD === undefined) {
      return res.status(400).json({ message: 'title, description, type, and priceUSD are required' });
    }
    if (!['workout', 'meal'].includes(type)) {
      return res.status(400).json({ message: 'type must be workout or meal' });
    }
    if (priceUSD < 0) {
      return res.status(400).json({ message: 'priceUSD cannot be negative' });
    }

    const plan = await CoachPlan.create({
      coachUserId: req.user._id,
      title,
      description,
      type,
      priceUSD,
      coverImageUrl: coverImageUrl || null,
    });

    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create plan', error: error.message });
  }
};

// GET /api/coach/plans/mine — coach views their own listings + sales
const getMyPlans = async (req, res) => {
  try {
    const plans = await CoachPlan.find({ coachUserId: req.user._id }).sort({ createdAt: -1 });

    const withStats = plans.map((p) => {
      const totalSales = p.purchases.length;
      const totalEarningsUSD = p.purchases.reduce((sum, pu) => sum + pu.coachEarningsUSD, 0);
      return { ...p.toObject(), totalSales, totalEarningsUSD };
    });

    res.status(200).json(withStats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch your plans', error: error.message });
  }
};

// POST /api/coach/plans/:id/purchase — buyer purchases a plan (FR-10.3)
const purchasePlan = async (req, res) => {
  try {
    const plan = await CoachPlan.findById(req.params.id);

    if (!plan || !plan.isActive) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    if (plan.coachUserId.equals(req.user._id)) {
      return res.status(400).json({ message: 'You cannot purchase your own plan' });
    }

    const alreadyPurchased = plan.purchases.some((pu) => pu.buyerId.equals(req.user._id));
    if (alreadyPurchased) {
      return res.status(400).json({ message: 'You already purchased this plan' });
    }

    const commissionUSD = Number((plan.priceUSD * COMMISSION_RATE).toFixed(2));
    const coachEarningsUSD = Number((plan.priceUSD - commissionUSD).toFixed(2));

    plan.purchases.push({
      buyerId: req.user._id,
      priceUSD: plan.priceUSD,
      commissionUSD,
      coachEarningsUSD,
    });
    await plan.save();

    // NOTE: this records the purchase in our own DB. Real payment capture (charging the
    // buyer's card/wallet) is out of scope for MVP — wire in a payment processor before
    // launch. This endpoint assumes payment has already been authorized client-side.

    res.status(200).json({
      message: 'Purchase successful',
      planId: plan._id,
      priceUSD: plan.priceUSD,
      commissionUSD,
      coachEarningsUSD,
    });
  } catch (error) {
    res.status(500).json({ message: 'Purchase failed', error: error.message });
  }
};

// GET /api/coach/purchased — buyer's own purchased plans (for "access purchased plans from profile")
const getMyPurchasedPlans = async (req, res) => {
  try {
    const plans = await CoachPlan.find({ 'purchases.buyerId': req.user._id })
      .populate('coachUserId', 'name profilePhotoUrl')
      .select('-purchases.commissionUSD -purchases.coachEarningsUSD');

    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch purchased plans', error: error.message });
  }
};

module.exports = {
  listPlans,
  getPlanById,
  createPlan,
  getMyPlans,
  purchasePlan,
  getMyPurchasedPlans,
};