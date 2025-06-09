const pool = require('../config/db.config');

const Bookmarks = {
  // CREATE a bookmark
  async create(data) {
    try {
      const { user_id, agent_id } = data;
      const query = `INSERT INTO bookmarks (user_id, agent_id) VALUES (?, ?)`;
      const [result] = await pool.execute(query, [user_id, agent_id]);
      return { insertId: result.insertId };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return { error: 'Bookmark already exists' };
      }
      console.error('Error in Bookmarks.create:', error);
      return { error: error.message };
    }
  },

  // GET all bookmarks for a user with agent + office address
  async findAllByUser(user_id) {
    try {
      const query = `
        SELECT 
          b.id AS bookmark_id,
          b.created_at,
          a.id AS agent_id,
          a.name AS agent_name,
          a.phone,
          a.whatsapp_number,
          a.image_url,
          a.city,
          a.status AS agent_status,
          o.id AS office_address_id,
          o.address AS office_address,
          o.latitude,
          o.longitude,
          o.status AS office_status
        FROM bookmarks b
        JOIN agents a ON b.agent_id = a.id
        LEFT JOIN office_address o ON a.id = o.agent_id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
      `;
      const [rows] = await pool.execute(query, [user_id]);
      return { data: rows };
    } catch (error) {
      console.error('Error in Bookmarks.findAllByUser:', error);
      return { error: error.message };
    }
  },

  // DELETE a bookmark by user and agent
  async destroy(user_id, agent_id) {
    try {
      const query = `DELETE FROM bookmarks WHERE user_id = ? AND agent_id = ?`;
      const [result] = await pool.execute(query, [user_id, agent_id]);
      return { affectedRows: result.affectedRows };
    } catch (error) {
      console.error('Error in Bookmarks.destroy:', error);
      return { error: error.message };
    }
  },
};

module.exports = Bookmarks;
