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
     console.log(result)
     console.log(result.insertId)
      return {
         
        success: true,
        data:{
         id: result.insertId,
        phone: PHONE_NUMBER,
        },  
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
async getAgentsByLocationwitoutlogin(locationId, limit, offset = 0) {
  console.log(locationId, limit, offset = 0,"hello sir g")
  try {
    if (!locationId) {
      return { success: false, message: 'Location ID is required.', data: [] };
    }

    const query = `
      SELECT
        a.id AS agent_id,
        a.name,
        a.agency_name,
        a.email,
        a.phone,
        a.status,
        a.whatsapp_number,
        a.experience_years,
        a.rating,
        a.languages_spoken,
        oa.address AS office_address,
        MIN(awl.ranking) AS min_ranking,
        (
      SELECT COUNT(*) > 0
      FROM sponsorships s
      WHERE s.agent_id = a.id AND s.locality_id = ${locationId}
    ) AS sponsorship_status,
        
        COALESCE(JSON_ARRAYAGG(img.image_url), JSON_ARRAY()) AS image_urls
      FROM agents a
      LEFT JOIN office_address oa ON a.id = oa.agent_id
      LEFT JOIN agent_working_locations awl 
        ON a.id = awl.agent_id AND awl.location_id = ? AND awl.is_approved = TRUE
      LEFT JOIN agent_images img ON a.id = img.agent_id
      WHERE awl.is_approved = TRUE
      GROUP BY a.id
      ORDER BY min_ranking
      LIMIT 10 OFFSET 0;
    `;

      const values = [locationId];

    const [rows] = await pool.execute(query, values);
    const formatted = rows.map(row => ({
      ...row,
      image_urls: typeof row.image_urls === 'string'
        ? JSON.parse(row.image_urls)
        : row.image_urls
    }));

    return { success: true, data: formatted };

  } catch (error) {
    console.error('Error fetching agents:', error);
    return { success: false, message: 'Failed to fetch agents.', data: [] };
  }
}

,


  async updateAgentAverageRating(agent_id) {
    console.log(agent_id, "agent_idagent_id")
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
  async createReview({ user_id, agent_id, comment = '', rating,imagePaths }) {
    console.log({ user_id, agent_id, comment, rating, imagePaths }, "jdkjsl");
    try {
      const [result] = await pool.execute(
        `INSERT INTO user_review (user_id, agent_id, comment, rating)
         VALUES (?, ?, ?, ?)`,
        [user_id, agent_id, comment, rating]
      );

      const reviewId = result.insertId;

      // Insert review images if available
      if (Array.isArray(imagePaths) && imagePaths.length > 0) {
        const imageInsertQuery = `INSERT INTO review_images (review_id, image_url) VALUES (?, ?)`;

        for (const imgUrl of imagePaths) {
          console.log("Inserting image:", imgUrl);
          await pool.execute(imageInsertQuery, [reviewId, imgUrl]);
        }
      }

      await this.updateAgentAverageRating(agent_id);

      return { success: true, id: reviewId, message: 'Review added successfully.' };
    } catch (error) {
      console.error('Error creating review:', error);
      return { success: false, message: 'Failed to add review.' };
    }
  },

  // Update an existing review
  async updateReview({id, comment, rating }) {
    console.log({id, comment, rating },"ggggggg")
     try {
    // Step 1: Get the review to find the agent_id
    const [reviewRows] = await pool.execute(
      `SELECT agent_id FROM user_review WHERE id = ?`,
      [id]
    );

    if (reviewRows.length === 0) {
      return { success: false, message: 'Review not found.' };
    }

    const agent_id = reviewRows[0].agent_id;

    // Step 2: Update the review
    const [result] = await pool.execute(
      `UPDATE user_review SET comment = ?, rating = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [comment, rating, id]
    );

    if (result.affectedRows === 0) {
      return { success: false, message: 'Failed to update review.' };
    }

    // Step 3: Update agent's average rating
    await this.updateAgentAverageRating(agent_id);

    return { success: true, message: 'Review updated successfully.' };
  } catch (error) {
    console.error('Error updating review:', error);
    return { success: false, message: 'Failed to update review.' };
  }
  },

  // Delete a review
  async deleteReview(review_id) {
    try {
    // Step 1: Fetch the agent_id for the review
    const [reviewRows] = await pool.execute(
      'SELECT agent_id FROM user_review WHERE id = ?',
      [review_id]
    );

    if (reviewRows.length === 0) {
      return { success: false, message: 'Review not found.' };
    }

    const agent_id = reviewRows[0].agent_id;

    // Step 2: Delete the review
    const [result] = await pool.execute(
      'DELETE FROM user_review WHERE id = ?',
      [review_id]
    );

    if (result.affectedRows === 0) {
      return { success: false, message: 'Failed to delete review.' };
    }

    // Step 3: Update the agent's average rating
    await this.updateAgentAverageRating(agent_id);

    return { success: true, message: 'Review deleted successfully.' };
  } catch (error) {
    console.error('Error deleting review:', error);
    return { success: false, message: 'Failed to delete review.' };
  }
  },

  // Get all reviews
async getAllReviews({ agent_id } = {}) {
  try {
  const query = `
  SELECT 
    ur.*, 
    u.name AS user_name,
    a.name AS agent_name,
    COALESCE(JSON_ARRAYAGG(img.image_url), JSON_ARRAY()) AS image_urls,
    (SELECT COUNT(*) FROM user_review WHERE agent_id = ur.agent_id) AS total_comments
  FROM user_review ur
  JOIN agents a ON ur.agent_id = a.id
  JOIN user u ON ur.user_id = u.id
  LEFT JOIN review_images img ON img.review_id = ur.id
  WHERE ur.agent_id = ?
  GROUP BY ur.id
`;


    const [rows] = await pool.execute(query, [agent_id]);

    if (rows.length === 0) {
      return {
        success: true,
        data: [],
        message: 'No reviews found for this agent.',
      };
    }

    return {
      success: true,
      data: rows,
      message: 'Reviews fetched successfully.',
    };
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return {
      success: false,
      data: [],
      message: 'Failed to fetch reviews.',
    };
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
    console.log("hello",userId,otp,expiresAt)
    try {
      const [result] = await pool.execute(
        'INSERT INTO otps (user_id, otp_code, expires_at) VALUES (?, ?, ?)',
        [userId, otp, expiresAt]
      );
      if (result.affectedRows === 0) return { success: false, message: 'OTP not saved.' };
      console.log(result)
      return { success: true, insertId: result.insertId, userId, otp, expiresAt };
    } catch (error) {
      console.error('Error saving OTP:', error);
      return { success: false, message: 'Failed to save OTP.' };
    }
  },

  // Validate and verify OTP
  async getOtpByUserId(userId, otp) {
    try {
      console.log(userId,otp)
      const now = moment().format('YYYY-MM-DD HH:mm:ss');
      const [otpRows] = await pool.execute(
        `SELECT * FROM otps 
         WHERE user_id = ? AND otp_code = ? AND verified = FALSE AND expires_at > ?`,
        [userId, otp, now]
      );
      console.log(otpRows,"jjj")

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
  async updateUserById(userId, updates,imagePaths) {
    console.log(userId,"userId")
    console.log(updates,"updates")
    console.log(imagePaths,"imagePaths")

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
      
      if(imagePaths){
        console.log(imagePaths)
        fields.push('profile = ?');
        values.push(JSON.stringify(imagePaths));
      }

        if(updates.email){
        fields.push('email = ?');
        values.push(JSON.stringify(updates.email));
      }
      if (!fields.length) return { success: false, message: 'No valid fields provided to update.' };

      // fields.push('updatedAt = CURRENT_TIMESTAMP');
      // values.push(userId);

      const [result] = await pool.execute(`UPDATE user SET ${fields.join(', ')} WHERE id = ${userId}`, values);
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
 async getAgentById(user_id,agent_id) {
  console.log("hello",user_id,agent_id)
  try {
    const [rows] = await pool.execute(`
      SELECT 
        a.*, 
        oa.address AS office_address,
        oa.latitude,
        oa.longitude,
        oa.status AS office_status,
        GROUP_CONCAT(ai.image_url) AS images
      FROM agents a
      LEFT JOIN office_address oa ON a.id = oa.agent_id
      LEFT JOIN agent_images ai ON a.id = ai.agent_id
      WHERE a.id = ?
      GROUP BY a.id
    `, [agent_id]);
    
    if (!rows.length) {
      return { success: false, message: 'Agent not found.' };
    }
    console.log(user_id,agent_id)
    this.recordAgentView(user_id,agent_id)
    const agent = rows[0];
    agent.images = agent.images ? agent.images.split(',') : [];

    return { success: true, data: agent };
  } catch (error) {
    console.error('Error fetching agent by ID:', error);
    return { success: false, message: 'Failed to fetch agent.' };
  }
}
,
  async getLimitCheck(locationId){
    const query = `
    SELECT data_limit 
    FROM locality_limits 
    WHERE locality_id = ${locationId}
  `;
  const [rows] = await pool.execute(query);
  return rows[0]
  },
  async  getTodayBanners(city_id) {
 const [rows] = await pool.execute(
  `SELECT * FROM banners WHERE DATE(end_time) > CURDATE() AND is_active = TRUE AND city_id = ?`,
  [city_id]
);

  return rows;
},
async recordAgentView(user_id, agent_id){
    const query = `
      INSERT INTO agent_views (user_id, agent_id)
      VALUES (?, ?)
    `;
   await pool.execute(query, [user_id, agent_id]);
},
async  recordLocalityView(user_id, locality_id) {
  const query = `
    INSERT INTO locality_views (user_id, locality_id)
    VALUES (?, ?)
  `;
  return await pool.execute(query, [user_id, locality_id]);
},
async  getUserById(userId) {
  try {
    const query = `
      SELECT 
        id,
        name,
        dob,
        phone,
        email,
        profile,
        role,
        status,
        location,
        created_at,
        updated_at
      FROM user
      WHERE id = ?
    `;

    const [rows] = await pool.execute(query, [userId]);
    return rows.length ? rows[0] : null;
  } catch (error) {
    console.error("Error in getUserById:", error);
    throw error;
  }
}


};

module.exports = Client;
