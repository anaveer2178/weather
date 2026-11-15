import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  weatherCache: defineTable({
    key: v.string(), // e.g. "coords:51.5074,-0.1278" or "city:london"
    city: v.string(),
    country: v.string(),
    lat: v.number(),
    lon: v.number(),
    data: v.any(), // Normalized weather dataset
    updatedAt: v.number(),
    ttlMs: v.number(), // Cache validity in ms
  }).index("by_key", ["key"]),

  pinnedLocations: defineTable({
    userId: v.string(),
    name: v.string(),
    country: v.string(),
    lat: v.number(),
    lon: v.number(),
    order: v.number(),
    pinnedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_coords", ["userId", "lat", "lon"]),

  recentSearches: defineTable({
    userId: v.string(),
    name: v.string(),
    country: v.string(),
    lat: v.number(),
    lon: v.number(),
    searchedAt: v.number(),
  }).index("by_user", ["userId"]),

  userPreferences: defineTable({
    userId: v.string(),
    unit: v.union(v.literal("metric"), v.literal("imperial")),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
});
