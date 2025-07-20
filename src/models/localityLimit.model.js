// models/localityLimits.model.js
const pool = require('../config/db.config');
const ApiError =require('../utils/ApiError')

const LocalityLimits = {
  // CREATE
  async create({ locality_id, data_limit }) {
 try {
    // Step 1: Check if record exists for the locality_id
    const checkQuery = 'SELECT * FROM locality_limits WHERE locality_id = ?';
    const [rows] = await pool.execute(checkQuery, [locality_id]);

    if (rows.length > 0) {
      // Step 2: Record exists → Update it
      const updateQuery = 'UPDATE locality_limits SET data_limit = ? WHERE locality_id = ?';
      await pool.execute(updateQuery, [data_limit, locality_id]);
      return { message: 'Locality limit updated successfully' };
    } else {
      // Step 3: Record doesn't exist → Insert it
      const insertQuery = 'INSERT INTO locality_limits (locality_id, data_limit) VALUES (?, ?)';
      const [result] = await pool.execute(insertQuery, [locality_id, data_limit]);
      return { message: 'Locality limit created successfully', insertId: result.insertId };
    }
  } catch (error) {
    console.error('Error in createOrUpdateLocalityLimit:', error);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }  
},

  // READ ALL
  async findAll() {
    try {
      const query = `
        SELECT ll.*, l.name AS locality_name 
        FROM locality_limits ll
        JOIN localities l ON ll.locality_id = l.id
        ORDER BY ll.id DESC
      `;
      const [rows] = await pool.execute(query);
      return { data: rows };
    } catch (error) {
      console.error('Error in LocalityLimits.findAll:', error);
       throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
    }
  },

  // READ BY ID
  async findByPk(id) {
    try {
      const query = 'SELECT * FROM locality_limits WHERE id = ?';
      const [rows] = await pool.execute(query, [id]);
      return { data: rows[0] || null };
    } catch (error) {
      console.error('Error in LocalityLimits.findByPk:', error);
       throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
    }
  },

  // UPDATE
  async update(id,{ locality_id, data_limit }) {
    try {
      const query = 'UPDATE locality_limits SET locality_id = ?, data_limit = ? WHERE id = ?';
      const [result] = await pool.execute(query, [locality_id, data_limit, id]);
      return { affectedRows: result.affectedRows };
    } catch (error) {
      console.error('Error in LocalityLimits.update:', error);
      throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
    }
  },

  // DELETE
  async destroy(id) {
    try {
      const query = 'DELETE FROM locality_limits WHERE id = ?';
      const [result] = await pool.execute(query, [id]);
      return { affectedRows: result.affectedRows };
    } catch (error) {
      console.error('Error in LocalityLimits.destroy:', error);
       throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
    }
  },
};

module.exports = LocalityLimits;