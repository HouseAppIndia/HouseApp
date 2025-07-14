// models/payment_details.model.js
const pool = require('../config/db.config');

const PaymentDetails = {
  // CREATE
  async create(data) {
    try {
      const query = `
        INSERT INTO payment_details (
          employee_id, qr_code, qr_code_url,
          bank_account_number, ifsc_code,
          bank_name, account_holder_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [
        data.employee_id || null,
        data.qr_code || null,
        data.qr_code_url || null,
        data.bank_account_number || null,
        data.ifsc_code || null,
        data.bank_name || null,
        data.account_holder_name || null
      ];
      const [result] = await pool.execute(query, values);
      return { insertId: result.insertId };
    } catch (error) {
      console.error('Error in PaymentDetails.create:', error);
      return { error: error.message };
    }
  },

  // READ ALL
  async findAll() {
    try {
      const query = 'SELECT * FROM payment_details ORDER BY id DESC';
      const [rows] = await pool.execute(query);
      return { data: rows };
    } catch (error) {
      console.error('Error in PaymentDetails.findAll:', error);
      return { error: error.message };
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
      return { error: error.message };
    }
  },

  // UPDATE
  async update(id, updateData) {
    try {
      const fields = [];
      const values = [];

      if (updateData.employee_id !== undefined) {
        fields.push('employee_id = ?');
        values.push(updateData.employee_id);
      }

      if (updateData.qr_code !== undefined) {
        fields.push('qr_code = ?');
        values.push(updateData.qr_code);
      }

      if (updateData.qr_code_url !== undefined) {
        fields.push('qr_code_url = ?');
        values.push(updateData.qr_code_url);
      }

      if (updateData.bank_account_number !== undefined) {
        fields.push('bank_account_number = ?');
        values.push(updateData.bank_account_number);
      }

      if (updateData.ifsc_code !== undefined) {
        fields.push('ifsc_code = ?');
        values.push(updateData.ifsc_code);
      }

      if (updateData.bank_name !== undefined) {
        fields.push('bank_name = ?');
        values.push(updateData.bank_name);
      }

      if (updateData.account_holder_name !== undefined) {
        fields.push('account_holder_name = ?');
        values.push(updateData.account_holder_name);
      }

      if (fields.length === 0) {
        return { message: 'No fields to update' };
      }

      const query = `UPDATE payment_details SET ${fields.join(', ')} WHERE id = ?`;
      values.push(id); // add id at the end

      const [result] = await pool.execute(query, values);
      return { affectedRows: result.affectedRows };
    } catch (error) {
      console.error('Error in PaymentDetails.update:', error);
      return { error: error.message };
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
      return { error: error.message };
    }
  }
};

module.exports = PaymentDetails;
