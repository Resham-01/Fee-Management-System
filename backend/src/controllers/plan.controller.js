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

// Super Admin: Update plan
exports.updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = planSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const plan = await Plan.findByIdAndUpdate(id, value, { new: true });
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    res.json(plan);
  } catch (err) {
    logger.error('Update plan error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// Super Admin: Delete plan
exports.deletePlan = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await Plan.findByIdAndDelete(id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    res.json({ message: 'Plan deleted successfully' });
  } catch (err) {
    logger.error('Delete plan error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};



