import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";
import Service from "../src/models/Service";
import ServicePackage from "../src/models/ServicePackage";
import { initialCataloguePackages, initialCatalogueServices } from "../src/lib/catalogue-seed-data";
import { classifyService } from "../src/lib/domain";

loadEnvConfig(process.cwd());

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Set MONGODB_URI to the intended application database before seeding the catalogue.");
  if (process.env.NODE_ENV === "production" && process.env.CONFIRM_PRODUCTION_CATALOGUE_SEED !== "yes") throw new Error("Production catalogue seeding requires CONFIRM_PRODUCTION_CATALOGUE_SEED=yes.");
  await mongoose.connect(uri);
  try {
    const byName = new Map<string, mongoose.Types.ObjectId>();
    let insertedServices = 0;
    let activatedTemplates = 0;
    for (const [index, item] of initialCatalogueServices.entries()) {
      const existing = await Service.findOne({ name: item.name }).lean();
      const fields = { ...item, image: existing?.image || "/images/hero.jpg", classification: classifyService(item.category, item.name), active: true, displayOrder: existing?.displayOrder ?? index * 10, priceConfirmed: typeof item.price === "number" };
      if (!existing) {
        await Service.create(fields);
        insertedServices += 1;
      } else if (existing.category === "Setup placeholder" && existing.active === false) {
        const $set = { ...fields, ...(typeof item.price === "number" ? { price: item.price } : {}) };
        const $unset = { archivedAt: 1, ...(typeof item.price === "number" ? {} : { price: 1 }) };
        await Service.updateOne({ _id: existing._id, category: "Setup placeholder", active: false }, { $set, $unset });
        activatedTemplates += 1;
      }
      const saved = await Service.findOne({ name: item.name }).select("_id").lean();
      if (saved) byName.set(item.name, saved._id);
    }
    let createdPackages = 0;
    for (const [index, item] of initialCataloguePackages.entries()) {
      const serviceIds = item.serviceNames.map((component) => byName.get(component));
      if (serviceIds.some((id) => !id)) throw new Error(`Package component is missing for ${item.name}.`);
      const result = await ServicePackage.updateOne({ name: item.name }, { $setOnInsert: { name: item.name, serviceIds: serviceIds as mongoose.Types.ObjectId[], description: "A paired manicure and pedicure, priced at the combined service total.", active: true, displayOrder: index * 10, image: "/images/hero.jpg" } }, { upsert: true });
      createdPackages += result.upsertedCount;
    }
    console.log(`Catalogue seed complete: ${insertedServices} service(s) added, ${activatedTemplates} inactive setup template(s) configured, and ${createdPackages} package(s) added. Existing catalogue records were left unchanged.`);
  } finally { await mongoose.disconnect(); }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Catalogue seed failed.");
  process.exitCode = 1;
});
