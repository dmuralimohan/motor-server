/*
    user schemas based on the user details and token generation process
*/

const Joi = require('joi');

const userRegisterSchema = Joi.object({
  firstname: Joi.string().required(),
  lastname: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  dob: Joi.date().required(),
  country: Joi.string().required(),
  verifyCode: Joi.number().required(),
  authToken: Joi.string().optional(),
  devices: Joi.object().optional()
}).options({ presence: 'required' });

const baseUserSchema = Joi.object({
  firstname: Joi.string().optional(),
  lastname: Joi.string().optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).optional(),
  dob: Joi.date().optional(),
  country: Joi.string().optional(),
  verifyCode: Joi.number().optional(),
  authToken: Joi.string().optional()
}).options({ presence: 'optional' });

const passwordSchema = baseUserSchema.fork(['password'], (schema) => schema.required());

const dobSchema = baseUserSchema.fork(['dob'], (schema) => schema.required());

const countrySchema = baseUserSchema.fork(['country'], (schema) => schema.required());

module.exports = {
  userRegisterSchema,
  passwordSchema,
  dobSchema,
  countrySchema
};