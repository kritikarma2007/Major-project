  const joi = require("joi");
   module.exports.listingSchema =joi.object({
    listing :joi.object({
        title: joi.string().required(),
        description: joi.string().required(),
        image: joi.string().allow(null, ''),
        location: joi.string().required(),
        country: joi.string().required(),
        price: joi.number().required().min(0),
        // category: joi.string().valid("mountains", "beach", "city", "desert").required()
    }).required()
  });
  module.exports.reviewSchema=joi.object({
    review:joi.object({
           rating:joi.number().required(),
           comment: joi.string().required(),
    }).required(),
  });