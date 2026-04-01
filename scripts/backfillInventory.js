const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Product = require("../Models/Product");
const { Inventory } = require("../Models/Inventory");

dotenv.config();

const DEFAULT_LOW_STOCK_THRESHOLD = 10;

async function backfillInventory() {
  await mongoose.connect(process.env.DB_URL);

  const products = await Product.find({ is_deleted: false }).select("_id").lean();

  for (const product of products) {
    await Inventory.findOneAndUpdate(
      { product: product._id },
      {
        $setOnInsert: {
          product: product._id,
          quantity: 0,
          low_stock_threshold: DEFAULT_LOW_STOCK_THRESHOLD,
          updated_by: null,
        },
      },
      { upsert: true, new: true }
    );
  }

  console.log(`Inventory backfill done for ${products.length} products.`);
}

backfillInventory()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error);

    try {
      await mongoose.disconnect();
    } catch {
      // Ignore disconnect failures after a connection error.
    }

    process.exit(1);
  });
