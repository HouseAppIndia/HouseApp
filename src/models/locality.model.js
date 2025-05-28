// models/localities.model.js
const pool = require('../config/db.config');
const localities = {
  // CREATE
  async create(data) {
    try {
      const name = data.name;
      const city_id = data.city_id;
      const area_id = data.area_id !== undefined ? data.area_id : null;
      console.log('Creating locality →', { name, city_id, area_id });
      const query = 'INSERT INTO localities (name, city_id, area_id) VALUES (?, ?, ?)';
      const [result] = await pool.execute(query, [name, city_id, area_id]);
      return { insertId: result.insertId };
    } catch (error) {
      console.error('Error in Localities.create:', error);
      return { error: error.message };
    }
  },

  // READ ALL
  async findAll() {
    try {
      const query = `
        SELECT a.*, 
               c.name AS city_name, 
               parent.name AS parent_area_name 
        FROM localities a
        LEFT JOIN cities c ON a.city_id = c.id
        LEFT JOIN localities parent ON a.area_id = parent.id
        ORDER BY a.id DESC`;
      const [rows] = await pool.execute(query);
      return { data: rows };
    } catch (error) {
      console.error('Error in Localities.findAll:', error);
      return { error: error.message };
    }
  },

  // READ BY ID
  async findByPk(id) {
    try {
      console.log('Fetching locality id:', id);
      const query = `
        SELECT a.*, 
               c.name AS city_name, 
               parent.name AS parent_area_name 
        FROM localities a
        LEFT JOIN cities c ON a.city_id = c.id
        LEFT JOIN localities parent ON a.area_id = parent.id
        WHERE a.id = ?`;
      const [rows] = await pool.execute(query, [id]);
      return { data: rows[0] || null };
    } catch (error) {
      console.error('Error in Localities.findByPk:', error);
      return { error: error.message };
    }
  },

  // UPDATE
  async update(id, data) {
    try {
      console.log('Updating locality id:', id);
      const name = data?.name;
      const city_id = data.cityId;
      const area_id = data.areaId !== undefined ? data.areaId : null;
      console.log('New values →', { name, city_id, area_id });

      const query = 'UPDATE localities SET name = ?, city_id = ?, area_id = ? WHERE id = ?';
      const [result] = await pool.execute(query, [name, city_id, area_id, id]);
      return { affectedRows: result.affectedRows };
    } catch (error) {
      console.error('Error in Localities.update:', error);
      return { error: error.message };
    }
  },

  // DELETE
  async destroy(id) {
    try {
      const query = 'DELETE FROM localities WHERE id = ?';
      const [result] = await pool.execute(query, [id]);
      return { affectedRows: result.affectedRows };
    } catch (error) {
      console.error('Error in Localities.destroy:', error);
      return { error: error.message };
    }
  },

  // FIND LOCALITIES BY CITY OR AREA
  async findlocalities({ city_id = null, area_id = null }) {
    try {
      if (city_id) {
        console.log('Finding localities by city_id:', city_id);
        const [allLocalities] = await pool.execute(
          `SELECT * FROM localities WHERE city_id = ?`,
          [city_id]
        );
        return { data: allLocalities };
      }
      if (area_id) {
        console.log('Finding localities by area_id:', area_id);
        const [subLocalities] = await pool.execute(
          `SELECT * FROM localities WHERE area_id = ?`,
          [area_id]
        );
        return { data: subLocalities };
      }
      return { data: [] };
    } catch (error) {
      console.error('Error in Localities.findlocalities:', error);
      return { error: error.message };
    }
  },
};

module.exports = localities;