const cron = require("node-cron");
const pool = require("../config/db.config");
const moment = require("moment");

cron.schedule("*/8 * * * *", async () => {
  const now = moment().format("YYYY-MM-DD HH:mm:ss");
  console.log(now,"hello")
  await pool.execute("DELETE FROM otps WHERE expires_at < ? OR verified = FALSE", [now]);
});



cron.schedule("*/8 * * * *", async () => {
  const now = moment().format("YYYY-MM-DD HH:mm:ss");
  console.log(`${now} – Checking for expired banners...`);

  try {
    const [result] = await pool.execute(`
      UPDATE banners
      SET is_active = FALSE
      WHERE end_time < ? AND is_active = TRUE
    `, [now]);

    console.log(`Deactivated ${result.affectedRows} expired banners.`);
  } catch (error) {
    console.error("Error deactivating expired banners:", error);
  }
});
