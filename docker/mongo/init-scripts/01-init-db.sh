#!/usr/bin/env bash
# =============================================================================
# docker/mongo/init-scripts/01-init-db.sh
# Runs inside the mongo container on first start.
# Creates application user and database.
# =============================================================================
set -e

mongosh --username "$MONGO_INITDB_ROOT_USERNAME" \
        --password "$MONGO_INITDB_ROOT_PASSWORD" \
        --authenticationDatabase admin <<'EOF'
// Create application database and user
db = db.getSiblingDB("wannasingh_ecommerce");

db.createUser({
  user: "app_user",
  pwd: "app_password_change_in_production",
  roles: [
    { role: "readWrite", db: "wannasingh_ecommerce" },
    { role: "dbAdmin",   db: "wannasingh_ecommerce" }
  ]
});

// Create initial collections with validation
db.createCollection("products", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "status"],
      properties: {
        title:  { bsonType: "string" },
        status: { enum: ["draft", "published", "archived"] }
      }
    }
  }
});

db.createCollection("orders");
db.createCollection("customers");

print("✅ Database 'wannasingh_ecommerce' initialized successfully.");
EOF
