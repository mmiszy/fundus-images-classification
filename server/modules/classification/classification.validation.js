const Joi = require('joi');

export const classification = {
    payload: {
        image: Joi.string().required(),
        name: Joi.string().required()
    }
};
