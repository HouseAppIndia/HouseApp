const pool = require('../config/db.config');
const ApiError =require('../utils/ApiError')

function createStaticModel(tableName) {
  return {
    // CREATE
  async createOrUpdate(data) {
 try {
    // Convert undefined to null
    const title = data.title ?? null;
    const content = data.content ?? null;
    const status = data.status ?? true;
  console.log(data,tableName)
    const query = `
      INSERT INTO ${tableName} (id, title, content, status)
      VALUES (1, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        title = VALUES(title), 
        content = VALUES(content), 
        status = VALUES(status),
        updated_at = CURRENT_TIMESTAMP;
    `;

    const [result] = await pool.execute(query, [title, content, status]);
    return { success: true };
  } catch (error) {
    console.error('Error in terms_and_conditions.createOrUpdate:', error);
     throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
},

    // READ ALL
    async findAll() {
      try {
        const query = `SELECT * FROM ${tableName} ORDER BY id DESC`;
        const [rows] = await pool.execute(query);
        return { data: rows };
      } catch (error) {
        console.error(`Error in ${tableName}.findAll:`, error);
        throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
      }
    },

    // READ BY ID
    async findByPk(id) {
      try {
        const query = `SELECT * FROM ${tableName} WHERE id = ?`;
        const [rows] = await pool.execute(query, [id]);
        return { data: rows[0] || null };
      } catch (error) {
        console.error(`Error in ${tableName}.findByPk:`, error);
         throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
      }
    },

    // UPDATE
    async update(id, data) {
      try {
        const { title, content, status } = data;
        const query = `UPDATE ${tableName} SET title = ?, content = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        const [result] = await pool.execute(query, [title, content, status, id]);
        return { affectedRows: result.affectedRows };
      } catch (error) {
        console.error(`Error in ${tableName}.update:`, error);
         throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
      }
    },

    // DELETE
    async destroy(id) {
      try {
        const query = `DELETE FROM ${tableName} WHERE id = ?`;
        const [result] = await pool.execute(query, [id]);
        return { affectedRows: result.affectedRows };
      } catch (error) {
        console.error(`Error in ${tableName}.destroy:`, error);
         throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
      }
    },
  };
}

module.exports = {
  AboutUs: createStaticModel('about_us'),
  PrivacyPolicies: createStaticModel('privacy_policies'),
  TermsConditions: createStaticModel('terms_and_conditions'),
  ContactUs: createStaticModel('contact_us'),
};
