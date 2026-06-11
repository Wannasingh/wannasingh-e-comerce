import { createProductsWorkflow } from "@medusajs/core-flows";
import { type ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

// ── Category-Specific Product Image Tags ──────────────────────────────
// Uses tags mapped to categories to fetch unique, contextual photos
const CATEGORY_TAGS: Record<string, string> = {
  Outerwear: "jacket,fashion",
  "Mid-Layer": "fleece,hoodie",
  Bottoms: "pants,trousers",
  "Base Layer": "shirt,fashion",
  Accessories: "backpack,bag",
  Vests: "vest,clothing",
  Footwear: "boots,shoes"
};

// ── Product Category Templates ────────────────────────────────────────

interface ProductTemplate {
  category: string;
  series: string;
  prefix: string;
  names: string[];
  adjectives: string[];
  materials: { label: string; value: string }[];
  features: { icon: string; title: string; desc: string }[];
  specs: { label: string; value: string }[];
  priceRange: [number, number];
  climateClass: string;
}

const categories: ProductTemplate[] = [
  {
    category: "Outerwear", series: "Shell System", prefix: "OW",
    names: ["Storm Parka", "Stealth Shell", "Nebula Jacket", "Apex Hardshell", "Vortex Anorak", "Arctic Parka", "Glacier Shell", "Summit Jacket", "Typhoon Coat", "Blizzard Shell", "Phantom Parka", "Eclipse Jacket", "Horizon Shell", "Nightfall Parka", "Void Jacket", "Tempest Shell", "Zero-G Parka", "Cyclone Jacket", "Quantum Shell", "Abyss Coat", "Drift Parka", "Stratos Jacket", "Nimbus Shell", "Frost Parka", "Ion Jacket", "Vertex Shell", "Polaris Jacket", "Ember Parka", "Nova Shell", "Gravity Jacket", "Obsidian Coat", "Zenith Parka", "Shadow Shell", "Cipher Jacket", "Titan Parka", "Spectre Shell", "Meridian Jacket", "Axiom Parka", "Vector Shell", "Cortex Jacket"],
    adjectives: ["Tactical", "Pro", "Elite", "Ultra", "Advanced", "Stealth", "Arctic", "Alpine", "Urban", "Expedition"],
    materials: [
      { label: "Outer Shell", value: "3L GORE-TEX PRO" }, { label: "Membrane", value: "ePTFE Waterproof" },
      { label: "Backer", value: "20D Micro Scrim" }, { label: "Hardware", value: "YKK Aquaguard®" },
    ],
    features: [
      { icon: "water_drop", title: "Waterproof Shield", desc: "28,000mm hydrostatic head rating with fully taped seams for total weather protection." },
      { icon: "wind_power", title: "Wind Barrier", desc: "100% windproof membrane blocks all wind penetration while maintaining breathability." },
      { icon: "shield", title: "Abrasion Guard", desc: "Reinforced high-wear zones with recycled polymer composites for maximum durability." },
      { icon: "flare", title: "Retro-Reflective", desc: "Integrated retro-reflective elements for low-light visibility." },
    ],
    specs: [{ label: "Waterproof", value: "28,000mm" }, { label: "Breathability", value: "RET < 6" }, { label: "Weight", value: "450g" }, { label: "Warranty", value: "LIFETIME" }],
    priceRange: [55000, 125000], climateClass: "ARCTIC / WET",
  },
  {
    category: "Mid-Layer", series: "Thermal System", prefix: "ML",
    names: ["Kinetic Insulator", "Orbital Fleece", "Core Thermal", "Flux Mid-Layer", "Radiant Jacket", "Thermo Hybrid", "Plasma Fleece", "Helios Mid", "Reactor Jacket", "Dynamo Fleece", "Fusion Mid", "Ignite Thermal", "Synth Layer", "Prism Fleece", "Catalyst Mid", "Photon Jacket", "Proton Fleece", "Neutron Mid", "Electron Thermal", "Quark Fleece", "Muon Mid", "Gluon Thermal", "Boson Fleece", "Higgs Layer", "Sigma Mid", "Delta Fleece", "Omega Mid", "Alpha Thermal", "Beta Fleece", "Gamma Mid", "Lambda Jacket", "Kappa Fleece", "Theta Mid", "Zeta Thermal", "Epsilon Fleece"],
    adjectives: ["Active", "Performance", "Hybrid", "Dynamic", "Technical", "Grid", "Power", "Stretch"],
    materials: [
      { label: "Body", value: "Polartec Power Stretch" }, { label: "Insulation", value: "PrimaLoft Gold Active" },
      { label: "Panels", value: "4-Way Stretch Softshell" }, { label: "Hardware", value: "YKK Coil Zips" },
    ],
    features: [
      { icon: "thermostat", title: "Active Insulation", desc: "Breathes during high-output activities while retaining warmth at rest." },
      { icon: "wind_power", title: "4-Way Stretch", desc: "Power stretch panels deliver unrestricted mobility across full range of motion." },
      { icon: "shield", title: "Moisture Wicking", desc: "Advanced moisture management keeps core temperature regulated." },
      { icon: "flare", title: "Quick Dry", desc: "Rapid-dry fabric technology minimizes moisture retention." },
    ],
    specs: [{ label: "Warmth", value: "0.85 CLO" }, { label: "Weight", value: "280g" }, { label: "Stretch", value: "4-WAY" }, { label: "Dry Time", value: "< 45min" }],
    priceRange: [22000, 55000], climateClass: "ACTIVE / ALPINE",
  },
  {
    category: "Bottoms", series: "Mobility System", prefix: "BT",
    names: ["Neutron Cargo Pant", "Tactical Trouser", "Stealth Jogger", "Combat Pant", "Alpine Trouser", "Utility Pant", "Recon Jogger", "Operative Trouser", "Field Pant", "Patrol Jogger", "Ranger Pant", "Scout Trouser", "Sentinel Jogger", "Guardian Pant", "Nomad Trouser", "Drift Pant", "Summit Trouser", "Ridge Jogger", "Valley Pant", "Mesa Trouser", "Canyon Jogger", "Peak Pant", "Crest Trouser", "Slope Jogger", "Trail Pant", "Terrain Trouser", "Path Jogger", "Route Pant", "Vector Trouser", "Axis Jogger", "Orbit Pant", "Arc Trouser", "Radius Jogger", "Span Pant", "Traverse Trouser"],
    adjectives: ["Tactical", "Urban", "Field", "Stealth", "Dynamic", "Technical", "Articulated", "Ripstop"],
    materials: [
      { label: "Fabric", value: "Ripstop Nylon 6,6" }, { label: "Reinforcement", value: "Cordura® Knee Panels" },
      { label: "Waistband", value: "Elastic + D-Ring Belt" }, { label: "Hardware", value: "YKK Zips / Snaps" },
    ],
    features: [
      { icon: "hiking", title: "Articulated Knees", desc: "Pre-curved knee construction for unrestricted movement." },
      { icon: "shield", title: "Ripstop Build", desc: "High-tenacity ripstop nylon resists tearing and abrasion." },
      { icon: "wind_power", title: "Gusseted Crotch", desc: "Diamond gusset allows full range of motion." },
      { icon: "water_drop", title: "DWR Finish", desc: "Durable water repellent treatment sheds moisture." },
    ],
    specs: [{ label: "Fabric", value: "RIPSTOP 6,6" }, { label: "Weight", value: "320g" }, { label: "Pockets", value: "8 TOTAL" }, { label: "DWR", value: "C6 TREATED" }],
    priceRange: [18000, 45000], climateClass: "ALL-SEASON / FIELD",
  },
  {
    category: "Base Layer", series: "Core System", prefix: "BL",
    names: ["Thermal Crew", "Compression Top", "Merino Base", "Grid Fleece Crew", "Thermal Zip", "Power Dry Top", "Mesh Vent Crew", "Baselayer Pro", "Skin Fit Top", "Core Crew", "Flux Base", "Element Crew", "Origin Top", "Foundation Base", "Prime Crew", "Nexus Top", "Matrix Base", "System Crew", "Protocol Top", "Genesis Base", "Epoch Crew", "Phase Top", "Sequence Base", "Module Crew", "Segment Top", "Node Base", "Link Crew", "Grid Top", "Cell Base", "Unit Crew"],
    adjectives: ["Thermal", "Active", "Merino", "Technical", "Performance", "Grid", "Power", "Lightweight"],
    materials: [
      { label: "Fabric", value: "Merino/Synthetic Blend" }, { label: "Weight", value: "180 GSM" },
      { label: "Treatment", value: "Anti-Microbial" }, { label: "Seams", value: "Flatlock Construction" },
    ],
    features: [
      { icon: "thermostat", title: "Temperature Regulation", desc: "Natural merino fibers regulate body temperature." },
      { icon: "water_drop", title: "Moisture Transport", desc: "Advanced wicking pulls moisture from skin." },
      { icon: "shield", title: "Anti-Odor", desc: "Natural anti-microbial properties resist odor." },
      { icon: "flare", title: "Next-to-Skin", desc: "Ergonomic body-mapped fit for zero-bulk layering." },
    ],
    specs: [{ label: "Fabric", value: "MERINO 180GSM" }, { label: "Weight", value: "145g" }, { label: "Fit", value: "BODY-MAPPED" }, { label: "Odor Control", value: "72HR+" }],
    priceRange: [8500, 18000], climateClass: "ALL-SEASON / CORE",
  },
  {
    category: "Accessories", series: "Utility Module", prefix: "AC",
    names: ["Chronos Balaclava", "Tactical Glove", "Storm Beanie", "Neck Gaiter", "Field Belt", "Utility Pouch", "Tech Sling", "MOLLE Rig", "Cargo Bag", "Thermal Mitt", "Shell Cap", "Visor Guard", "Face Shield", "Wrist Cuff", "Arm Sleeve", "Knee Guard", "Shin Sleeve", "Ankle Wrap", "Compression Sock", "Thermal Sock", "Base Liner", "Grid Glove", "Wind Gaiter", "Rain Cap", "Sun Shield", "Dust Mask", "Ear Warmer", "Head Band", "Arm Band", "Leg Gaiter", "Hip Pack", "Waist Bag", "Cross Sling", "Drop Pouch", "Gear Pouch"],
    adjectives: ["Tactical", "Urban", "Field", "Stealth", "Storm", "Arctic", "Expedition", "EDC"],
    materials: [
      { label: "Body", value: "Cordura® Nylon" }, { label: "Lining", value: "Fleece / Mesh" },
      { label: "Closure", value: "Fidlock® Magnetic" }, { label: "Hardware", value: "Duraflex® Buckles" },
    ],
    features: [
      { icon: "shield", title: "Durable Build", desc: "Military-specification Cordura nylon construction." },
      { icon: "wind_power", title: "Modular Design", desc: "MOLLE-compatible attachment points." },
      { icon: "water_drop", title: "Weather Sealed", desc: "Sealed seams and water-resistant coatings." },
      { icon: "flare", title: "Reflective Details", desc: "Strategic reflective elements for low-light." },
    ],
    specs: [{ label: "Material", value: "CORDURA® 500D" }, { label: "Weight", value: "85g" }, { label: "Attachment", value: "MOLLE" }, { label: "Water Resist", value: "YES" }],
    priceRange: [3500, 16000], climateClass: "ALL-SEASON / UTILITY",
  },
  {
    category: "Vests", series: "Carry System", prefix: "VT",
    names: ["Carrier Vest", "Tactical Rig", "Utility Vest", "Modular Harness", "Load Vest", "Pack Vest", "Recon Rig", "Assault Vest", "Scout Vest", "Ranger Rig", "Guardian Vest", "Sentinel Harness", "Patrol Rig", "Operative Vest", "Field Rig", "Combat Vest", "Stealth Harness", "Shadow Rig", "Phantom Vest", "Spectre Rig", "Ghost Vest", "Cipher Harness", "Apex Rig", "Summit Vest", "Ridge Rig", "Peak Vest", "Crest Harness", "Pinnacle Rig", "Vertex Vest", "Zenith Rig"],
    adjectives: ["Tactical", "Modular", "Stealth", "Urban", "EDC", "Field", "Lite", "Heavy"],
    materials: [
      { label: "Body", value: "Cordura 500D Nylon" }, { label: "Straps", value: "Nylon Webbing 1\"/2\"" },
      { label: "Buckles", value: "Woojin Quick-Deploy" }, { label: "Attachment", value: "MOLLE-II Compatible" },
    ],
    features: [
      { icon: "shield", title: "MOLLE Matrix", desc: "Multi-point MOLLE attachment grid for modular storage." },
      { icon: "wind_power", title: "Load Distribution", desc: "Ergonomic harness distributes weight." },
      { icon: "water_drop", title: "Cordura Build", desc: "Military-spec Cordura nylon for extreme durability." },
      { icon: "flare", title: "Quick-Deploy", desc: "Rapid-access buckle system for fast on/off." },
    ],
    specs: [{ label: "Capacity", value: "4-8L" }, { label: "Attachment", value: "12-POINT MOLLE" }, { label: "Material", value: "CORDURA 500D" }, { label: "Weight", value: "450g" }],
    priceRange: [22000, 48000], climateClass: "ALL-SEASON / TACTICAL",
  },
  {
    category: "Footwear", series: "Ground System", prefix: "FW",
    names: ["Terrain Boot", "Trail Runner", "Urban Walker", "Alpine Boot", "Stealth Runner", "Patrol Boot", "Recon Shoe", "Summit Boot", "Ridge Runner", "Valley Walker", "Canyon Boot", "Peak Runner", "Field Boot", "Scout Shoe", "Ranger Boot", "Navigator Runner", "Pathfinder Boot", "Trailblazer Shoe", "Explorer Boot", "Voyager Runner"],
    adjectives: ["GTX", "Pro", "Elite", "Tactical", "Stealth", "Arctic", "Trail", "Urban"],
    materials: [
      { label: "Upper", value: "Nubuck Leather + Cordura" }, { label: "Membrane", value: "GORE-TEX Lining" },
      { label: "Midsole", value: "EVA + TPU Stabilizer" }, { label: "Outsole", value: "Vibram® Megagrip" },
    ],
    features: [
      { icon: "hiking", title: "Vibram Outsole", desc: "Vibram Megagrip for superior traction." },
      { icon: "water_drop", title: "GTX Waterproof", desc: "GORE-TEX membrane for reliable waterproofing." },
      { icon: "shield", title: "Toe Protection", desc: "Reinforced rubber toe cap." },
      { icon: "flare", title: "Ankle Support", desc: "Structured collar provides stability." },
    ],
    specs: [{ label: "Waterproof", value: "GORE-TEX" }, { label: "Outsole", value: "VIBRAM®" }, { label: "Weight", value: "520g" }, { label: "Drop", value: "10mm" }],
    priceRange: [24000, 58000], climateClass: "ALL-TERRAIN",
  },
];

// ── Product Generation ─────────────────────────────────────────────────
const colorVariants = ["Black", "Carbon", "Olive", "Navy", "Slate", "Shadow", "Midnight", "Granite", "Charcoal", "Smoke"];

// Unique seed run ID to prevent SKU conflicts
const SEED_RUN = Date.now().toString(36).slice(-4); // e.g. "k3a1"

function generateProducts() {
  const products: any[] = [];

  const categoryCounts: Record<string, number> = {
    Outerwear: 60,
    "Mid-Layer": 50,
    Bottoms: 50,
    "Base Layer": 40,
    Accessories: 50,
    Vests: 35,
    Footwear: 20
  };

  for (const cat of categories) {
    const targetCount = categoryCounts[cat.category] ?? 20;

    const catTag = CATEGORY_TAGS[cat.category] || "fashion";

    for (let i = 0; i < targetCount; i++) {
      const nameBase = cat.names[i % cat.names.length]!;
      const adj = cat.adjectives[i % cat.adjectives.length]!;
      const color = colorVariants[i % colorVariants.length]!;
      const version = i < cat.names.length ? "" : ` V${Math.floor(i / cat.names.length) + 1}`;

      const title = `${nameBase.toUpperCase()}${version ? version.toUpperCase() : ""}`;
      const handle = `${nameBase.toLowerCase().replace(/[^a-z0-9]+/g, "-")}${version ? `-v${Math.floor(i / cat.names.length) + 1}` : ""}`;
      // Unique SKU with run ID to prevent inventory conflicts
      const sku = `${SEED_RUN}-${cat.prefix}-${String(i + 1).padStart(3, "0")}`;

      const priceAmount = cat.priceRange[0] + Math.floor(Math.random() * (cat.priceRange[1] - cat.priceRange[0]));
      const roundedPrice = Math.round(priceAmount / 500) * 500;

      // Assign unique dynamic images from LoremFlickr pool (ensures zero duplication)
      const mainImg = `https://loremflickr.com/600/800/${catTag}?random=${cat.prefix}-${i}`;
      const detailImg1 = `https://loremflickr.com/600/800/${catTag}?random=${cat.prefix}-${i + 1000}`;
      const detailImg2 = `https://loremflickr.com/600/800/${catTag}?random=${cat.prefix}-${i + 2000}`;
      const darkImg = `https://loremflickr.com/600/800/${catTag}?random=${cat.prefix}-${i + 3000}`;

      products.push({
        title,
        handle,
        subtitle: `${adj} ${cat.category.toLowerCase()} system. ${color} ${nameBase.toLowerCase()} engineered for ${cat.climateClass.toLowerCase()} performance.`,
        description: `High-performance ${cat.category.toLowerCase()} from the ${cat.series} collection. Engineered with ${cat.materials[0]!.value} construction for maximum durability and performance in demanding conditions.`,
        status: "published",
        options: [{ title: "Size", values: ["S", "M", "L", "XL"] }],
        variants: [
          { title: "S", sku: `${sku}-S`, options: { Size: "S" }, prices: [{ amount: roundedPrice, currency_code: "usd" }] },
          { title: "M", sku: `${sku}-M`, options: { Size: "M" }, prices: [{ amount: roundedPrice, currency_code: "usd" }] },
          { title: "L", sku: `${sku}-L`, options: { Size: "L" }, prices: [{ amount: roundedPrice, currency_code: "usd" }] },
          { title: "XL", sku: `${sku}-XL`, options: { Size: "XL" }, prices: [{ amount: roundedPrice, currency_code: "usd" }] },
        ],
        metadata: {
          series: `${cat.series} ${String(i + 1).padStart(2, "0")}`,
          category: cat.category,
          color,
          price: `$${(roundedPrice / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
          quickSpecs: [
            { label: "Climate Class", value: cat.climateClass },
            { label: "Weight", value: cat.specs.find(s => s.label === "Weight")?.value || "350g" },
            { label: "Warranty", value: "LIFETIME" },
          ],
          images: {
            main: mainImg,
            detail1: detailImg1,
            detail2: detailImg2,
            darkSection: darkImg,
          },
          features: cat.features,
          materialsDescription: `${cat.category} from the ${cat.series} collection. Built with ${cat.materials[0]!.value} for uncompromising performance.`,
          materials: cat.materials,
          specs: cat.specs,
        },
      });
    }
  }

  return products;
}

// ── Seed Execution ─────────────────────────────────────────────────────
export default async function seed({ container }: ExecArgs) {
  const logger = container.resolve("logger");
  logger.info(`Starting product seed (300+ items, run=${SEED_RUN})...`);

  const salesChannelService = container.resolve(Modules.SALES_CHANNEL);
  const productModuleService = container.resolve(Modules.PRODUCT);

  const [salesChannels] = await salesChannelService.listAndCountSalesChannels({});
  if (!salesChannels.length) throw new Error("No sales channels found.");
  const salesChannelId = salesChannels[0]!.id;
  logger.info(`Using sales channel: ${salesChannels[0]!.name} (${salesChannelId})`);

  const productsToSeed = generateProducts();
  logger.info(`Generated ${productsToSeed.length} products to seed.`);

  // Clean up existing products
  const [existingProducts] = await productModuleService.listAndCountProducts({}, { take: 1000 });
  if (existingProducts.length > 0) {
    const ids = existingProducts.map((p: any) => p.id);
    await productModuleService.deleteProducts(ids);
    logger.info(`Cleaned up ${existingProducts.length} existing products.`);
  }

  // Seed in batches
  const BATCH_SIZE = 20;
  let seeded = 0;

  for (let i = 0; i < productsToSeed.length; i += BATCH_SIZE) {
    const batch = productsToSeed.slice(i, i + BATCH_SIZE);
    const productsInput = batch.map((p: any) => ({
      title: p.title, handle: p.handle, subtitle: p.subtitle, description: p.description,
      status: p.status, options: p.options, variants: p.variants,
      sales_channels: [{ id: salesChannelId }], metadata: p.metadata,
    }));

    try {
      const { result } = await createProductsWorkflow(container).run({ input: { products: productsInput } });
      seeded += result.length;
      logger.info(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: Seeded ${result.length} (total: ${seeded}/${productsToSeed.length})`);
    } catch (error: any) {
      logger.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed: ${error.message}`);
    }
  }

  logger.info(`✅ Seed complete! Total: ${seeded} products.`);
}
