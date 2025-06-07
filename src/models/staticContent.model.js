const pool = require('../config/db.config');

function createStaticModel(tableName) {
  return {
    // CREATE
  async createOrUpdate(data) {
 try {
    // Convert undefined to null
    const title = data.title ?? null;
    const content = data.content ?? null;
    const status = data.status ?? true;

    const query = `
      INSERT INTO terms_and_conditions (id, title, content, status)
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
    return { error: error.message };
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
        return { error: error.message };
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
        return { error: error.message };
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
        return { error: error.message };
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
        return { error: error.message };
      }
    },
  };
}

module.exports = {
  AboutUs: createStaticModel('about_us'),
  PrivacyPolicies: createStaticModel('privacy_policies'),
  TermsConditions: createStaticModel('terms_and_conditions'),
};
