const pool = require('../config/db.config');
const ApiError =require('../utils/ApiError')

const Sponsorships = {
  // CREATE
 async create(data) {
  try {
    if (!data.locality_id) {
      throw new Error('locality_id is required');
    }

    const query = `
      INSERT INTO sponsorships (agent_id, locality_id, start_date, end_date)
      VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 MONTH))
      ON DUPLICATE KEY UPDATE
        start_date = CURDATE(),
        end_date = DATE_ADD(CURDATE(), INTERVAL 1 MONTH)
    `;

    const insertedIds = [];

    if (Array.isArray(data.locality_id)) {
      for (const localityId of data.locality_id) {
        const [result] = await pool.execute(query, [data.agent_id, localityId]);
        insertedIds.push(result.insertId || `updated:${data.agent_id}_${localityId}`);
      }
    } else {
      const [result] = await pool.execute(query, [data.agent_id, data.locality_id]);
      insertedIds.push(result.insertId || `updated:${data.agent_id}_${data.locality_id}`);
    }

    return { insertedIds };

  } catch (error) {
    console.error('Error in Sponsorships.create:', error);
     throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
},

  // READ ALL
  async findAll() {
    try {
      const query = 'SELECT * FROM sponsorships ORDER BY id DESC';
      const [rows] = await pool.execute(query);
      return { data: rows };
    } catch (error) {
      console.error('Error in Sponsorships.findAll:', error);
       throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
    }
  },

  // READ BY ID
  async findByPk(id) {
    try {
      const query = 'SELECT * FROM sponsorships WHERE id = ?';
      const [rows] = await pool.execute(query, [id]);
      return { data: rows[0] || null };
    } catch (error) {
      console.error('Error in Sponsorships.findByPk:', error);
       throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
    }
  },

  // UPDATE
  async update(id, data) {
    try {
      const query = `
        UPDATE sponsorships
        SET agent_id = ?, sponsor_id = ?, locality_id = ?
        WHERE id = ?
      `;
      const [result] = await pool.execute(query, [data.agent_id, data.sponsor_id, data.locality_id, id]);
      return { affectedRows: result.affectedRows };
    } catch (error) {
      console.error('Error in Sponsorships.update:', error);
       throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
    }
  },

  // DELETE
  async destroy(id) {
    try {
      const query = 'DELETE FROM sponsorships WHERE id = ?';
      const [result] = await pool.execute(query, [id]);
      return { affectedRows: result.affectedRows };
    } catch (error) {
      console.error('Error in Sponsorships.destroy:', error);
      throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
    }
  },
};

module.exports = Sponsorships;
