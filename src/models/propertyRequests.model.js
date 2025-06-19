const pool = require('../config/db.config');

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
      return { error: error.message };
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
      return { error: error.message };
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
      return { error: error.message };
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
      return { error: error.message };
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
      return { error: error.message };
    }
  },
};

module.exports = PropertyRequests;
