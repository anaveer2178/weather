import { query } from "../_generated/server";
import { v } from "convex/values";

export const getPinnedLocations = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const locations = await ctx.db
      .query("pinnedLocations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return locations.sort((a, b) => a.order - b.order);
  },
});

export const isLocationPinned = query({
  args: {
    userId: v.string(),
    lat: v.number(),
    lon: v.number(),
  },
  handler: async (ctx, { userId, lat, lon }) => {
    const existing = await ctx.db
      .query("pinnedLocations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return existing.some(
      (loc) => Math.abs(loc.lat - lat) < 0.05 && Math.abs(loc.lon - lon) < 0.05
    );
  },
});
