const mongoose = require('mongoose');

const calculateProfitMargin = (price, cost) => Number(price || 0) - Number(cost || 0);

const productSchema = new mongoose.Schema(
  {
    name: { 
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    cost: {
      type: Number,
      required: true,
      min: 0,
    },
    profit_margin: {
      type: Number,
      default: 0,
    },
    is_available: {
      type: Boolean,
      default: true,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

productSchema.pre('save', function () {
  this.profit_margin = calculateProfitMargin(this.price, this.cost);
});

productSchema.pre(['findOneAndUpdate', 'updateOne'], async function () {
  const update = this.getUpdate() || {};
  const set = update.$set || {};
  const nextPrice = set.price ?? update.price;
  const nextCost = set.cost ?? update.cost;

  if (nextPrice === undefined && nextCost === undefined) {
    return;
  }

  const current = await this.model.findOne(this.getQuery()).select('price cost').lean();
  const price = nextPrice ?? current?.price ?? 0;
  const cost = nextCost ?? current?.cost ?? 0;

  this.setUpdate({
    ...update,
    $set: {
      ...set,
      profit_margin: calculateProfitMargin(price, cost),
    },
  });
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
