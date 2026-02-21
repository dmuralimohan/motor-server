/*
    User schemas for validation
*/

const Joi = require('joi');

const userRegisterSchema = Joi.object({
  username: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  phonenumber: Joi.string().min(10).max(15).required(),
  password: Joi.string().min(6).required(),
  activationcode: Joi.string().required(),
}).options({ presence: 'required' });

const baseUserSchema = Joi.object({
  username: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phonenumber: Joi.string().optional(),
  password: Joi.string().min(6).optional(),
  activationcode: Joi.string().optional(),
  authToken: Joi.string().optional(),
  devices: Joi.object().optional(),
  pushToken: Joi.string().optional(),
}).options({ presence: 'optional' });

const signInSchema = Joi.object({
  phonenumber: Joi.string().min(10).required(),
  password: Joi.string().optional(),
  mode: Joi.string().valid('otp', 'password').default('otp'),
});

const validateOTPSchema = Joi.object({
  phonenumber: Joi.string().min(10).required(),
  otp: Joi.number().integer().min(1000).max(9999).required(),
});

module.exports = {
  userRegisterSchema,
  baseUserSchema,
  signInSchema,
  validateOTPSchema,
};