// models/areas.model.js
const pool = require('../config/db.config');
const ApiError =require('../utils/ApiError')

const Areas = {
  // CREATE
  async create(name, city_id) {
    try {
      console.log(name,city_id,"difohhuhhh")
      const query = 'INSERT INTO areas (name, city_id) VALUES (?, ?)';
      const [result] = await pool.execute(query, [name, city_id]);
      return { insertId: result.insertId };
    } catch (error) {
      console.error('Error in Areas.create:', error);
      return { error: error.message };
    }
  },

  // READ ALL
  async findAll() {
    console.log("hello")
    try {
      const query = `
        SELECT a.*, c.name AS city_name 
        FROM areas a 
        LEFT JOIN cities c ON a.city_id = c.id 
        ORDER BY a.id DESC`;
      const [rows] = await pool.execute(query);
      return { data: rows };
    } catch (error) {
      console.error('Error in Areas.findAll:', error);
      return { error: error.message };
    }
  },

  // READ BY ID
  async findByPk(id) {
    console.log("hhhehh")
    try {
      const query = `
        SELECT a.*, c.name AS city_name 
        FROM areas a 
        LEFT JOIN cities c ON a.city_id = c.id 
        WHERE a.id = ?`;
      const [rows] = await pool.execute(query, [id]);
      console.log(rows,"jj")
      return { data: rows[0] || null };
    } catch (error) {
      console.error('Error in Areas.findByPk:', error);
      throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
    }
  },

  // UPDATE
  async update(id, data) {
    try {
      console.log('Updating area id:', id);
      const name = data?.name;
      const city_id = data?.cityId;
      console.log('New values →', { name, city_id });

      const query = 'UPDATE areas SET name = ?, city_id = ? WHERE id = ?';
      const [result] = await pool.execute(query, [name, city_id, id]);
      return { affectedRows: result.affectedRows };
    } catch (error) {
      console.error('Error in Areas.update:', error);
      throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
    }
  },

  async getAreaId(city_id) {
    try {
      console.log("ff")
      const query = 'SELECT * FROM areas WHERE city_id = ?';
      const [rows] = await pool.execute(query, [city_id]);
      return { data: rows };
    } catch (error) {
      console.error('Error in Areas.getAreaId:', error);
       throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
    }
  },

  // DELETE
  async destroy(id) {
    try {
      const query = 'DELETE FROM areas WHERE id = ?';
      const [result] = await pool.execute(query, [id]);
      return { affectedRows: result.affectedRows };
    } catch (error) {
      console.error('Error in Areas.destroy:', error);
       throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
    }
  },
};

module.exports = Areas;
