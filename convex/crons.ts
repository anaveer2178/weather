import { cronJobs } from "convex/server";

const crons = cronJobs();

// Periodically runs every 30 minutes to ensure fresh weather data for active cities
// crons.interval(
//   "refresh-active-weather-cache",
//   { minutes: 30 },
//   internal.weather.actions.refreshPopularCities
// );

export default crons;
