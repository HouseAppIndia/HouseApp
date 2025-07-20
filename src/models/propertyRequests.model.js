const pool = require('../config/db.config');
const ApiError =require('../utils/ApiError')

const PropertyRequests = {
  // CREATE
  async create(data) {
    try {
      const query = `
        INSERT INTO property_requests 
        (user_id, you_want_to, property_type, residential_type, location_id, your_requirements) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const values = [
        data.user_id,
        data.you_want_to,
        data.property_type,
        data.residential_type || null,
        data.location_id || null,
        data.your_requirements || null
      ];
      const [result] = await pool.execute(query, values);
      return { insertId: result.insertId };
    } catch (error) {
      console.error('Error in PropertyRequests.create:', error);
       throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
    }
  },

  // READ ALL
  async findAll() {
    try {
      const query = `
        SELECT * FROM property_requests ORDER BY id DESC
      `;
      const [rows] = await pool.execute(query);
      return { data: rows };
    } catch (error) {
      console.error('Error in PropertyRequests.findAll:', error);
       throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
    }
  },

  // READ BY ID
  async findByPk(id) {
    try {
      const query = `
        SELECT * FROM property_requests WHERE id = ?
      `;
      const [rows] = await pool.execute(query, [id]);
      return { data: rows[0] || null };
    } catch (error) {
      console.error('Error in PropertyRequests.findByPk:', error);
       throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
    }
  },

  // UPDATE
  async update(id, updateData) {
    try {
      const query = `
        UPDATE property_requests 
        SET 
          you_want_to = ?, 
          property_type = ?, 
          residential_type = ?, 
          location_id = ?, 
          your_requirements = ?
        WHERE id = ?
      `;
      const values = [
        updateData.you_want_to,
        updateData.property_type,
        updateData.residential_type || null,
        updateData.location_id || null,
        updateData.your_requirements || null,
        id
      ];
      const [result] = await pool.execute(query, values);
      return { affectedRows: result.affectedRows };
    } catch (error) {
      console.error('Error in PropertyRequests.update:', error);
      throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
    }
  },

  // DELETE
  async destroy(id) {
    try {
      const query = `
        DELETE FROM property_requests WHERE id = ?
      `;
      const [result] = await pool.execute(query, [id]);
      return { affectedRows: result.affectedRows };
    } catch (error) {
      console.error('Error in PropertyRequests.destroy:', error);
      throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
    }
  },
};

module.exports = PropertyRequests;
