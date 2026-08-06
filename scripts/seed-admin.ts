import bcrypt from "bcryptjs";
import mongoose from "mongoose";

async function main() {
  const uri = process.env.MONGODB_URI?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD?.trim();
  const name = process.env.ADMIN_NAME?.trim() || "Admin";

  if (!uri) throw new Error("Set MONGODB_URI in .env.local");
  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local");
  }

  await mongoose.connect(uri);

  const users = mongoose.connection.collection("users");
  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();

  const result = await users.updateOne(
    { email },
    {
      $set: {
        email,
        name,
        passwordHash,
        role: "admin",
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true },
  );

  // Remove previous demo admin if present
  await users.deleteMany({
    email: { $ne: email },
    role: "admin",
  });

  if (result.upsertedCount) {
    console.log(`Created admin: ${email}`);
  } else {
    console.log(`Updated admin: ${email}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
