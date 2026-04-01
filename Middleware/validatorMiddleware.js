// will cut the joi validation part to be done in a middleware in a validator.js and conncet it with the route to avoid code repetition in other routes
// will make it generic to be used in any route and any validation schema
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details.map((err) => err.message),
            });
        }
        req.body = value;
        next();
    };
};

module.exports = { validate };
