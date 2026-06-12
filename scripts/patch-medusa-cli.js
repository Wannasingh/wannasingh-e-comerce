const fs = require("node:fs");
const path = require("node:path");

const cliPath = path.join(__dirname, "..", "node_modules", "@medusajs", "cli", "cli.js");

if (fs.existsSync(cliPath)) {
  let content = fs.readFileSync(cliPath, "utf8");

  const target = `try {
  require("ts-node").register({})
  require("tsconfig-paths").register({})
} catch (e) {`;

  const replacement = `try {
  require("ts-node").register({})
} catch (e) {
  const isProduction = process.env.NODE_ENV === "production"
  if (!isProduction) {
    console.warn(
      "ts-node cannot be loaded and used, if you are running in production don't forget to set your NODE_ENV to production"
    )
    console.warn(e)
  }
}
try {
  require("tsconfig-paths").register({ baseUrl: ".", paths: {} })
} catch (e) {`;

  if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(cliPath, content, "utf8");
    console.log("Successfully patched @medusajs/cli to prevent tsconfig-paths TypeError");
  } else {
    console.log("@medusajs/cli is already patched or format has changed.");
  }
} else {
  console.log("@medusajs/cli was not found at expected path:", cliPath);
}
