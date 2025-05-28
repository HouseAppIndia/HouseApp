const cron = require("node-cron");
const pool = require("../config/db.config");
const moment = require("moment");

cron.schedule("*/8 * * * *", async () => {
  const now = moment().format("YYYY-MM-DD HH:mm:ss");
  console.log(now,"hello")
  await pool.execute("DELETE FROM otps WHERE expires_at < ? OR verified = FALSE", [now]);
});