import { query } from "../_generated/server";
import { v } from "convex/values";

export const getCachedWeather = query({
  args: {
    key: v.string(),
  },
  handler: async (ctx, { key }) => {
    const record = await ctx.db
      .query("weatherCache")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (!record) return null;

    const isExpired = Date.now() - record.updatedAt > record.ttlMs;
    return {
      data: record.data,
      updatedAt: record.updatedAt,
      isExpired,
      city: record.city,
      country: record.country,
    };
  },
});

export const getRecentSearches = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const items = await ctx.db
      .query("recentSearches")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return items.sort((a, b) => b.searchedAt - a.searchedAt);
  },
});
