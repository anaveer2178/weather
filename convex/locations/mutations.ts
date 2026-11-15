import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const togglePinLocation = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    country: v.string(),
    lat: v.number(),
    lon: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("pinnedLocations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const matched = existing.find(
      (loc) => Math.abs(loc.lat - args.lat) < 0.05 && Math.abs(loc.lon - args.lon) < 0.05
    );

    if (matched) {
      await ctx.db.delete(matched._id);
      return { pinned: false };
    }

    const order = existing.length;
    await ctx.db.insert("pinnedLocations", {
      userId: args.userId,
      name: args.name,
      country: args.country,
      lat: args.lat,
      lon: args.lon,
      order,
      pinnedAt: Date.now(),
    });

    return { pinned: true };
  },
});

export const removePinnedLocation = mutation({
  args: {
    userId: v.string(),
    locationId: v.id("pinnedLocations"),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.locationId);
    if (item && item.userId === args.userId) {
      await ctx.db.delete(args.locationId);
      return true;
    }
    return false;
  },
});
