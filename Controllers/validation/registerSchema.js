const joi = require("joi");

const registerSchema = joi.object({
    username: joi.string().min(3).max(30).required(),
    email: joi.string().email().required(),
    password: joi.string().min(6).required(),
    role: joi.string().valid("user", "admin").default("user"), 
});

module.exports = registerSchema;