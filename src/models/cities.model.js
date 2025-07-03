// models/cities.model.js
const pool = require('../config/db.config');

const Cities = {
  // CREATE
  async create(data) {
    try {
     const query = 'INSERT INTO cities (name, image) VALUES (?, ?)';
      const [result] = await pool.execute(query, [data.name, data.image]);
      return { insertId: result.insertId };
    } catch (error) {
      console.error('Error in Cities.create:', error);
      return { error: error.message };
    }
  },

  // READ ALL
  async findAll() {
    try {
      const query = 'SELECT * FROM cities ORDER BY id DESC';
      const [rows] = await pool.execute(query);
      return { data: rows };
    } catch (error) {
      console.error('Error in Cities.findAll:', error);
      return { error: error.message };
    }
  },

  // READ BY ID
  async findByPk(id) {
    try {
      console.log('Fetching city id:', id);
      const query = 'SELECT * FROM cities WHERE id = ?';
      const [rows] = await pool.execute(query, [id]);
      return { data: rows[0] || null };
    } catch (error) {
      console.error('Error in Cities.findByPk:', error);
      return { error: error.message };
    }
  },

  // UPDATE
  async updateCity(id, updateData) {
  try {
    const fields = [];
    const values = [];

    if (updateData.name) {
      fields.push('name = ?');
      values.push(updateData.name);
    }

    if (updateData.image) {
      fields.push('image = ?');
      values.push(updateData.image);
    }

    // If no fields to update, return early
    if (fields.length === 0) {
      return { message: 'No fields to update' };
    }

    const query = `UPDATE cities SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id); // ID goes last
    console.log('Updating city id:', id, 'with data:', updateData);

    const [result] = await pool.execute(query, values);
    return { affectedRows: result.affectedRows };
  } catch (error) {
    console.error('Error updating city:', error);
    return { error: error.message };
  }
},

  // DELETE
  async destroy(id) {
    try {
      const query = 'DELETE FROM cities WHERE id = ?';
      const [result] = await pool.execute(query, [id]);
      return { affectedRows: result.affectedRows };
    } catch (error) {
      console.error('Error in Cities.destroy:', error);
      return { error: error.message };
    }
  },
};

module.exports = Cities;
