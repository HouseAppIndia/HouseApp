const pool = require('../config/db.config');
const bcrypt = require('bcryptjs');
const moment = require('moment');

const Client = {
  // Check if phone already exists
  async isMobilePhone(phone, excludeId = null) {
    try {
      let query = 'SELECT 1 FROM user WHERE phone = ?';
      const params = [phone];
      if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
      }
      const [rows] = await pool.execute(query, params);
      return rows.length > 0;
    } catch (error) {
      console.error('Error checking phone existence:', error);
      return { success: false, message: 'Failed to check phone number.' };
    }
  },

  // Create new user
  async create(PHONE_NUMBER) {
    try {
      if (!PHONE_NUMBER) return { success: false, message: 'Phone number is required.' };

      const exists = await this.isMobilePhone(PHONE_NUMBER);
      if (exists) return { success: false, message: 'Phone number already registered.' };

      const [result] = await pool.execute(
        'INSERT INTO user (phone) VALUES (?)',
        [PHONE_NUMBER]
      );

      return {
        success: true,
        id: result.insertId,
        phone: PHONE_NUMBER,
        message: 'User created successfully.',
      };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, message: 'Failed to create user.' };
    }
  },

  // Get user by ID
  async getUserById(user_id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM user WHERE id = ?', [user_id]);
      if (!rows.length) return { success: false, message: 'User not found.' };
      return { success: true, data: rows[0] };
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return { success: false, message: 'Failed to fetch user.' };
    }
  },

  // Get working locations by location ID
  async getLocationsBySearch(locationId) {
    try {
      if (!locationId) return { success: false, message: 'Location ID is required.', data: [] };

      const [rows] = await pool.execute(
        'SELECT * FROM agent_working_locations WHERE location_id = ?',
        [locationId]
      );

      return {
        success: rows.length > 0,
        message: rows.length ? 'Working locations fetched successfully.' : 'No working locations found.',
        data: rows,
      };
    } catch (error) {
      console.error('Error fetching working locations:', error);
      return { success: false, message: 'Failed to fetch locations.', data: [] };
    }
  },

  // Get agents working at a location
  async getAgentsByLocation(locationId, limit = 10, offset = 0) {
    try {
      if (!locationId) return { success: false, message: 'Location ID is required.', data: [] };

      const [location] = await pool.execute(
        'SELECT id, name FROM localities WHERE id = ?',
        [locationId]
      );

      if (!location.length) return { success: false, message: 'Location not found.', data: [] };
      const [rows] = await pool.execute(
        `
    SELECT 
      a.*, 
      l.name AS locality_name,
      1 AS is_primary_location
    FROM agents a
    JOIN agent_working_locations awl ON a.id = awl.agent_id
    JOIN localities l ON awl.location_id = l.id
    WHERE awl.is_approved = TRUE
      AND awl.location_id = ?
    ORDER BY a.rating DESC
    LIMIT ? OFFSET ?
    `,
        [locationId, limit, offset]
      );

      return {
        success: rows.length > 0,
        message: rows.length ? 'Agents fetched successfully.' : 'No agents found.',
        data: rows,
      };
    } catch (error) {
      console.error('Error fetching agents:', error);
      return { success: false, message: 'Failed to fetch agents.', data: [] };
    }
  },


  async updateAgentAverageRating(agent_id) {
    console.log(agent_id,"agent_idagent_id")
    const [[{ avgRating }]] = await pool.execute(
      `SELECT ROUND(AVG(rating), 2) as avgRating FROM user_review WHERE agent_id = ?`,
      [agent_id]
    );
    console.log(avgRating)
    await pool.execute(
      `UPDATE agents SET rating = ? WHERE id = ?`,
      [avgRating || 0, agent_id] // fallback to 0 if no reviews
    );
  },



  // Add a new review
  async createReview({ user_id, agent_id, comment = '', rating }) {
    console.log({ user_id, agent_id, comment, rating },"jdkjsl")
    try {
      const [result] = await pool.execute(
        `INSERT INTO user_review (user_id, agent_id, comment, rating)
         VALUES (?, ?, ?, ?)`,
        [user_id, agent_id, comment, rating]
      );
      console.log("hellllo")
      await this.updateAgentAverageRating(agent_id);
      return { success: true, id: result.insertId, message: 'Review added successfully.' };
    } catch (error) {
      console.error('Error creating review:', error);
      return { success: false, message: 'Failed to add review.' };
    }
  },

  // Update an existing review
  async updateReview({ review_id, comment, rating }) {
    try {
      const [result] = await pool.execute(
        `UPDATE user_review SET comment = ?, rating = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [comment, rating, review_id]
      );
      if (result.affectedRows === 0) return { success: false, message: 'Review not found.' };
      await updateAgentAverageRating(review.agent_id);
      return { success: true, message: 'Review updated successfully.' };
    } catch (error) {
      console.error('Error updating review:', error);
      return { success: false, message: 'Failed to update review.' };
    }
  },

  // Delete a review
  async deleteReview(review_id) {
    try {
      const [result] = await pool.execute('DELETE FROM user_review WHERE id = ?', [review_id]);
      if (result.affectedRows === 0) return { success: false, message: 'Review not found.' };
      await updateAgentAverageRating(review.agent_id);
      return { success: true, message: 'Review deleted successfully.' };
    } catch (error) {
      console.error('Error deleting review:', error);
      return { success: false, message: 'Failed to delete review.' };
    }
  },

  // Get all reviews
  async getAllReviews({ agent_id, user_id } = {}) {
    try {
      let query = `
        SELECT ur.*, 
               a.name AS agent_name, a.email AS agent_email, 
               u.name AS user_name, u.email AS user_email,
               (SELECT COUNT(*) FROM user_review WHERE agent_id = ur.agent_id) AS total_comments
        FROM user_review ur
        JOIN agents a ON ur.agent_id = a.id
        JOIN user u ON ur.user_id = u.id
        WHERE 1=1
      `;
      const params = [];
      if (agent_id) {
        query += ' AND ur.agent_id = ?';
        params.push(agent_id);
      }
      if (user_id) {
        query += ' AND ur.user_id = ?';
        params.push(user_id);
      }

      const [rows] = await pool.execute(query, params);
      return { success: true, data: rows };
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return { success: false, message: 'Failed to fetch reviews.', data: [] };
    }
  },

  // Get single review by ID
  async getReviewById({ review_id }) {
    try {
      const [rows] = await pool.execute('SELECT * FROM user_review WHERE id = ?', [review_id]);
      if (!rows.length) return { success: false, message: 'Review not found.' };
      return { success: true, data: rows[0] };
    } catch (error) {
      console.error('Error fetching review:', error);
      return { success: false, message: 'Failed to fetch review.' };
    }
  },

  // Save OTP to DB
  async isSaveOtp(userId, otp, expiresAt) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO otps (user_id, otp_code, expires_at) VALUES (?, ?, ?)',
        [userId, otp, expiresAt]
      );
      if (result.affectedRows === 0) return { success: false, message: 'OTP not saved.' };
      return { success: true, insertId: result.insertId, userId, otp, expiresAt };
    } catch (error) {
      console.error('Error saving OTP:', error);
      return { success: false, message: 'Failed to save OTP.' };
    }
  },

  // Validate and verify OTP
  async getOtpByUserId(userId, otp) {
    try {
      const now = moment().format('YYYY-MM-DD HH:mm:ss');
      const [otpRows] = await pool.execute(
        `SELECT * FROM otps 
         WHERE user_id = ? AND otp_code = ? AND verified = FALSE AND expires_at > ?`,
        [userId, otp, now]
      );

      if (!otpRows.length) return { success: false, message: 'Invalid or expired OTP.' };

      await pool.execute('UPDATE otps SET verified = TRUE WHERE id = ?', [otpRows[0].id]);
      await pool.execute('UPDATE user SET status = TRUE WHERE id = ?', [userId]);

      return { success: true, message: 'OTP verified successfully.' };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { success: false, message: 'Server error while verifying OTP.' };
    }
  },

  // Get user by phone number
  async getPhoneNumber(phone) {
    try {
      const [[user]] = await pool.execute('SELECT * FROM user WHERE phone = ?', [phone]);
      if (!user) return { success: false, message: 'User not found.' };
      return { success: true, data: user };
    } catch (error) {
      console.error('Error fetching user by phone:', error);
      return { success: false, message: 'Failed to fetch user.' };
    }
  },

  // Update user details
  async updateUserById(userId, updates) {
    console.log(userId,"gg")
    try {
      const fields = [];
      const values = [];

      if (updates.name) {
        fields.push('name = ?');
        values.push(updates.name);
      }

      if (updates.dob) {
        const formattedDob = moment(updates.dob, 'DD/MM/YYYY').format('YYYY-MM-DD');
        fields.push('dob = ?');
        values.push(formattedDob);
      }

      if (updates.location) {
        fields.push('location = ?');
        console.log(JSON.stringify(updates.location))
        values.push(JSON.stringify(updates.location));
      }

      if (!fields.length) return { success: false, message: 'No valid fields provided to update.' };

      // fields.push('updatedAt = CURRENT_TIMESTAMP');
      values.push(userId);

      const [result] = await pool.execute(`UPDATE user SET ${fields.join(', ')} WHERE id = ?`, values);
      if (!result.affectedRows) return { success: false, message: 'User not found or no changes made.' };

      return { success: true, message: 'User profile updated successfully.' };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { success: false, message: 'Failed to update user profile.' };
    }
  },

  // Set user status to false
  async statusUpdate(user_id) {
    try {
      const [result] = await pool.execute('UPDATE user SET status = FALSE WHERE id = ?', [user_id]);
      if (!result.affectedRows) return { success: false, message: 'User not found or already inactive.' };
      return { success: true, message: 'User status updated to inactive.' };
    } catch (error) {
      console.error('Error updating user status:', error);
      return { success: false, message: 'Failed to update user status.' };
    }
  },

    // Get user by ID
  async geAgentsById(agent_id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM agents WHERE id = ?', [agent_id]);
      if (!rows.length) return { success: false, message: 'User not found.' };
      return { success: true, data: rows[0] };
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return { success: false, message: 'Failed to fetch user.' };
    }
  },
};

module.exports = Client;
