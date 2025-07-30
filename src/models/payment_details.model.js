const pool = require('../config/db.config');
const ApiError =require('../utils/ApiError')

const PaymentDetails = {
  // CREATE

  // CREATE OR UPDATE
  async createOrUpdateByBankAccountNumber(data) {
  try {
    console.log()
    const checkQuery = 'SELECT id FROM payment_details WHERE bank_account_number = ?';
    const [existing] = await pool.execute(checkQuery, [data.bank_account_number]);

    if (existing.length > 0) {
      // 🔁 UPDATE
      const id = existing[0].id;
      const fields = [];
      const values = [];

      if (data.qr_code_url !== undefined) {
        fields.push('qr_code_url = ?');
        values.push(data.qr_code_url);
      }

      if (data.ifsc_code !== undefined) {
        fields.push('ifsc_code = ?');
        values.push(data.ifsc_code);
      }

      if (data.bank_name !== undefined) {
        fields.push('bank_name = ?');
        values.push(data.bank_name);
      }

      if (data.account_holder_name !== undefined) {
        fields.push('account_holder_name = ?');
        values.push(data.account_holder_name);
      }

      // No need to update bank_account_number itself since it’s used for lookup

      if (fields.length === 0) {
        return { message: 'No fields to update' };
      }

      const updateQuery = `UPDATE payment_details SET ${fields.join(', ')} WHERE id = ?`;
      values.push(id);

      const [result] = await pool.execute(updateQuery, values);
      return { action: 'updated', affectedRows: result.affectedRows,data };
    } else {
      // ➕ INSERT
      const insertQuery = `
        INSERT INTO payment_details (
          bank_account_number, qr_code_url,
          ifsc_code, bank_name, account_holder_name
        ) VALUES (?, ?, ?, ?, ?)
      `;
      const values = [
        data.bank_account_number || null,
        data.qr_code_url || null,
        data.ifsc_code || null,
        data.bank_name || null,
        data.account_holder_name || null
      ];

      const [result] = await pool.execute(insertQuery, data);
      return { action: 'inserted', insertId: result.insertId };
    }
  } catch (error) {
    console.error('Error in createOrUpdateByBankAccountNumber:', error);
     throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
},


  // READ ALL
  async findAll() {
    try {
      const query = 'SELECT * FROM payment_details ORDER BY id DESC';
      const [rows] = await pool.execute(query);
      return { data: rows };
    } catch (error) {
      console.log("hhh")
      console.error('Error in PaymentDetails.findAll:', error);
       throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
    }
  },

  // READ BY ID
  async findByPk(id) {
    try {
      const query = 'SELECT * FROM payment_details WHERE id = ?';
      const [rows] = await pool.execute(query, [id]);
      return { data: rows[0] || null };
    } catch (error) {
      console.error('Error in PaymentDetails.findByPk:', error);
       throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
    }
  },



  // DELETE
  async destroy(id) {
    try {
      const query = 'DELETE FROM payment_details WHERE id = ?';
      const [result] = await pool.execute(query, [id]);
      return { affectedRows: result.affectedRows };
    } catch (error) {
      console.error('Error in PaymentDetails.destroy:', error);
       throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
    }
  }
};

module.exports = PaymentDetails;
