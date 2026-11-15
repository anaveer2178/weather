import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const saveToCache = mutation({
  args: {
    key: v.string(),
    city: v.string(),
    country: v.string(),
    lat: v.number(),
    lon: v.number(),
    data: v.any(),
    ttlMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("weatherCache")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    const now = Date.now();
    const ttl = args.ttlMs ?? 10 * 60 * 1000; // 10 minutes default

    if (existing) {
      await ctx.db.patch(existing._id, {
        city: args.city,
        country: args.country,
        lat: args.lat,
        lon: args.lon,
        data: args.data,
        updatedAt: now,
        ttlMs: ttl,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("weatherCache", {
        key: args.key,
        city: args.city,
        country: args.country,
        lat: args.lat,
        lon: args.lon,
        data: args.data,
        updatedAt: now,
        ttlMs: ttl,
      });
    }
  },
});

export const addRecentSearch = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    country: v.string(),
    lat: v.number(),
    lon: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("recentSearches")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Check if already in recent searches
    const duplicate = existing.find(
      (item) => Math.abs(item.lat - args.lat) < 0.05 && Math.abs(item.lon - args.lon) < 0.05
    );

    if (duplicate) {
      await ctx.db.patch(duplicate._id, { searchedAt: Date.now() });
      return duplicate._id;
    }

    // Keep max 8 recent searches
    if (existing.length >= 8) {
      const oldest = existing.sort((a, b) => a.searchedAt - b.searchedAt)[0];
      if (oldest) await ctx.db.delete(oldest._id);
    }

    return await ctx.db.insert("recentSearches", {
      userId: args.userId,
      name: args.name,
      country: args.country,
      lat: args.lat,
      lon: args.lon,
      searchedAt: Date.now(),
    });
  },
});

export const clearRecentSearches = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("recentSearches")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const item of items) {
      await ctx.db.delete(item._id);
    }
  },
});
