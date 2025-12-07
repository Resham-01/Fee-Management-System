const Joi = require('joi');
const Plan = require('../models/Plan');
const logger = require('../config/logger');

const planSchema = Joi.object({
  name: Joi.string().required(),
  pricePerMonth: Joi.number().required(),
  maxStudents: Joi.number().required(),
  features: Joi.array().items(Joi.string()),
  isActive: Joi.boolean().default(true),
});

// Super Admin: Get all plans
exports.getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.find().sort({ createdAt: -1 });
    res.json(plans);
  } catch (err) {
    logger.error('Get all plans error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// Super Admin: Create plan
exports.createPlan = async (req, res) => {
  try {
    const { error, value } = planSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const plan = await Plan.create(value);
    res.status(201).json(plan);
  } catch (err) {
    logger.error('Create plan error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};



