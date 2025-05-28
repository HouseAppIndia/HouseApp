const pool = require('../config/db.config'); // MySQL connection pool

const Token = {
  // Create a new token
  async createToken({ token, userId = null, agentId = null, employeeId = null, type, expires, blacklisted = false }) {
    console.log({ token, userId, agentId,employeeId, type, expires, blacklisted, })
    try {
      const [result] = await pool.execute(
        `INSERT INTO tokens (token, userId, agentId, employeeId, type, expires, blacklisted) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [token, userId, agentId, employeeId, type, expires, blacklisted]
      );

      return {
        success: true,
        message: 'Token created successfully',
        data: {
          id: result.insertId,
          token,
          userId,
          agentId,
          employeeId,
          type,
          expires,
          blacklisted,
        },
      };
    } catch (error) {
      console.error('Error in createToken:', error);
      return {
        success: false,
        message: 'Failed to create token',
        error: error.message,
      };
    }
  },

  // Find a token by value and type
  async findToken({ token, type }, blacklisted = false) {
    try {
      if (!token || !type) {
        return {
          success: false,
          message: 'Token and type are required',
        };
      }

      const blacklistedFlag = blacklisted ? 1 : 0;

      const [rows] = await pool.execute(
        `SELECT * FROM tokens WHERE token = ? AND type = ? AND blacklisted = ?`,
        [token, type, blacklistedFlag]
      );

      if (rows.length === 0) {
        return {
          success: false,
          message: 'No matching token found',
        };
      }

      return {
        success: true,
        message: 'Token found',
        data: rows[0],
      };
    } catch (error) {
      console.error('Error in findToken:', error);
      return {
        success: false,
        message: 'Failed to find token',
        error: error.message,
      };
    }
  },

  // Delete a specific token
  async deleteToken({ refreshTokenDoc }) {
    try {
      const [result] = await pool.execute(
        `DELETE FROM tokens WHERE token = ?`,
        [refreshTokenDoc.token]
      );

      return {
        success: true,
        message: 'Token deleted successfully',
        data: result,
      };
    } catch (error) {
      console.error('Error in deleteToken:', error);
      return {
        success: false,
        message: 'Failed to delete token',
        error: error.message,
      };
    }
  },

  // Delete all tokens for a specific user
  async deleteAllTokenByUserId({ refreshTokenDoc }) {
    try {
      const [result] = await pool.execute(
        `DELETE FROM tokens WHERE userId = ?`,
        [refreshTokenDoc.userId]
      );

      return {
        success: true,
        message: 'All tokens for the user deleted successfully',
        data: result,
      };
    } catch (error) {
      console.error('Error in deleteAllTokenByUserId:', error);
      return {
        success: false,
        message: 'Failed to delete user tokens',
        error: error.message,
      };
    }
  },

  // Blacklist a token
  async blacklistToken(token) {
    try {
      const [result] = await pool.execute(
        `UPDATE tokens SET blacklisted = TRUE WHERE token = ?`,
        [token]
      );

      return {
        success: true,
        message: 'Token blacklisted successfully',
        data: result,
      };
    } catch (error) {
      console.error('Error in blacklistToken:', error);
      return {
        success: false,
        message: 'Failed to blacklist token',
        error: error.message,
      };
    }
  },
};

module.exports = Token;
