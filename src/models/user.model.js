const pool = require('../config/db.config');
const bcrypt = require('bcryptjs');
const moment = require('moment');




function formatMonthlyCounts(data) {
  const months = Array(12).fill(0);
  data.forEach(item => {
    months[item.month - 1] = item.count;
  });
  return {
    jan: months[0], feb: months[1], mar: months[2], apr: months[3],
    may: months[4], jun: months[5], jul: months[6], aug: months[7],
    sep: months[8], oct: months[9], nov: months[10], dec: months[11]
  };
}



function formatWeeklyCounts(data) {
  const days = {
    Sunday: { whatsapp: 0, phone: 0 },
    Monday: { whatsapp: 0, phone: 0 },
    Tuesday: { whatsapp: 0, phone: 0 },
    Wednesday: { whatsapp: 0, phone: 0 },
    Thursday: { whatsapp: 0, phone: 0 },
    Friday: { whatsapp: 0, phone: 0 },
    Saturday: { whatsapp: 0, phone: 0 }
  };
  data.forEach(item => {
    if (days[item.day]) {
      days[item.day][item.click_type] = item.count;
    }
  });
  return days;
}

const User = {
  async isEmailTaken(email, excludeId = null) {
    try {
      let query = 'SELECT 1 FROM employees WHERE email = ?';
      let params = [email];

      if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
      }

      const [rows] = await pool.execute(query, params);
      return rows.length > 0;
    } catch (error) {
      throw new Error('Database error during email check');
    }
  },

  async create(userData) {
    try {
      // 1. Email uniqueness
      const emailTaken = await this.isEmailTaken(userData.email);
      if (emailTaken) {
        throw new Error('Email already taken');
      }

      // 2. Hash password
      const hashedPassword = await bcrypt.hash(userData.password || '', 8);

      // 3. Normalize DOB
      console.log(userData.dob)
      let dobFormatted = null;
      if (userData.dob) {
        const parsed = moment(userData.dob, ['DD/MM/YYYY', 'DD/MM/YY', 'YYYY-MM-DD'], true);
        if (!parsed.isValid()) {
          throw new Error('Invalid DOB format. Use DD/MM/YYYY');
        }
        dobFormatted = parsed.format('YYYY-MM-DD');
      }

      // 4. Build query based on role
      let query, values;

      if (userData.role === 'administrator') {
        // Admin: no managerId column
        query = `
            INSERT INTO employees 
              (name, dob, email, role, status, password) 
            VALUES (?, ?, ?, ?, ?, ?)
          `;
        values = [
          userData.name ?? null,
          dobFormatted,
          userData.email ?? null,
          userData.role,
          userData.status ?? true,
          hashedPassword,
        ];
      } else {
        // All others (manager, employee, etc.): include managerId
        query = `
            INSERT INTO employees 
              (name, dob, email, role, status, managerId, password) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `;
        values = [
          userData.name ?? null,
          dobFormatted,
          userData.email ?? null,
          userData.role,
          userData.status ?? true,
          userData.managerId ?? null,
          hashedPassword,
        ];
      }

      // 5. Execute
      const [result] = await pool.execute(query, values);

      // 6. Return safe user object (no password)
      return {
        id: result.insertId,
        name: userData.name,
        dob: userData.dob,
        email: userData.email,
        role: userData.role,
        status: userData.status ?? true,
      };
    } catch (err) {
      throw new Error(err.message || 'Error creating employee');
    }
  },


  async getByEmail(email) {
    console.log(email, "jjj")
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM employees WHERE email = ?',
        [email]
      );
      console.log(rows[0])
      return rows[0];
    } catch (error) {
      throw new Error('Error retrieving employee by email');
    }
  },

  async passwordMatch(password, hashedPassword) {
    try {
      console.log(password, "passwordpassword")
      console.log(hashedPassword, "hashedPassword")
      console.log(await bcrypt.compare(password, hashedPassword))
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw new Error('Error comparing passwords');
    }
  },

  async getAll(role, page = 1, limit = 10) {
    try {
      const parsedPage = parseInt(page, 10);
      const parsedLimit = parseInt(limit, 10);
      const offset = (parsedPage - 1) * parsedLimit;

      // ✅ Get paginated employees
      const [rows] = await pool.execute(
        `SELECT id, name, dob, email 
        FROM employees 
        WHERE role = ? 
        LIMIT ${parsedLimit} OFFSET ${offset}`,
        [role] // only role is bound — limit and offset are safely interpolated
      );

      // ✅ Get total count
      const [[{ total }]] = await pool.execute(
        `SELECT COUNT(*) AS total 
        FROM employees 
        WHERE role = ?`,
        [role]
      );

      return {
        data: rows,
        pagination: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          totalPages: Math.ceil(total / parsedLimit),
        },
      };
    } catch (error) {
      console.error("❌ Error in getAll:", error.message);
      throw new Error('Error retrieving employee list');
    }
  },


  async getOne(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM employees WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw new Error('Error retrieving employee details');
    }
  },

  async update(id, updateData) {
    try {
      console.log(id, updateData);

      // Check if employee exists
      const [userRows] = await pool.execute(
        'SELECT * FROM employees WHERE id = ?',
        [id]
      );
      if (userRows.length === 0) {
        throw new Error('Employee not found');
      }

      // If email is being updated, validate uniqueness
      if (updateData.email) {
        const emailTaken = await this.isEmailTaken(updateData.email, id);
        if (emailTaken) {
          throw new Error('Email already taken');
        }
      }

      // Prepare dynamic SET clause
      const fields = [];
      const values = [];

      if (updateData.name) {
        fields.push('name = ?');
        values.push(updateData.name);
      }
      if (updateData.email) {
        fields.push('email = ?');
        values.push(updateData.email);
      }
      if (updateData.role) {
        fields.push('role = ?');
        values.push(updateData.role);
      }
      if (updateData.managerId !== undefined) {
        fields.push('managerId = ?');
        values.push(updateData.managerId);
      }

      // If no fields are provided
      if (fields.length === 0) {
        throw new Error('No valid fields to update');
      }

      // Add ID to the end of values
      values.push(id);

      const sql = `UPDATE employees SET ${fields.join(', ')} WHERE id = ?`;

      const [result] = await pool.execute(sql, values);

      if (result.affectedRows === 0) {
        throw new Error('No changes made');
      }

      return { message: 'Employee updated successfully' };
    } catch (error) {
      throw new Error(error.message || 'Error updating employee');
    }
  },


  async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM employees WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        throw new Error('Employee not found or already deleted');
      }

      return { message: 'Employee deleted successfully' };
    } catch (error) {
      throw new Error(error.message || 'Error deleting employee');
    }
  },
  async verifyLocation({ source, value }) {
    console.log('Source:', source);
    console.log('Value:', value);

    try {
      let table, column, updateQuery;

      // Determine table and column based on source
      if (source === 'agent_working_location') {
        table = 'agent_working_locations';
        column = 'id';
      } else if (source === 'office_address') {
        table = 'office_address';
        column = 'id';
      } else {
        return { success: false, message: 'Invalid source type provided.' };
      }

      // Build the update query based on source
      if (source === 'agent_working_location') {
        updateQuery = `
            UPDATE ${table}
            SET is_approved = TRUE
            WHERE ${column} = ?
          `;
      } else {
        updateQuery = `
            UPDATE ${table}
            SET status = 'accepted'
            WHERE ${column} = ?
          `;
      }

      console.log(updateQuery, "updateQuery");

      const [result] = await pool.execute(updateQuery, [value]);
      console.log(result);

      if (result.affectedRows > 0) {
        return {
          success: true,
          message: `Successfully verified record from ${source}.`,
        };
      } else {
        return {
          success: false,
          message: `No matching record found for ${value} in ${source}.`,
        };
      }
    } catch (error) {
      console.error(`❌ Error verifying location for source ${source}:`, error);
      return {
        success: false,
        message: 'Internal server error.',
      };
    }
  },




  async viewEmployeeProfile(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM employees WHERE id = ?', [id]);
      if (rows.length === 0) {
        throw new Error('Employee not found');
      }
      return rows[0];
    } catch (error) {
      throw new Error('Error retrieving employee profile');
    }
  },

  async changePassword(id, oldPassword, newPassword) {
    try {
      console.log(id, oldPassword, newPassword)
      const [rows] = await pool.execute('SELECT password FROM employees WHERE id = ?', [id]);
      if (rows.length === 0) {
        throw new Error('Employee not found');
      }

      const currentPassword = rows[0].password;
      const isMatch = await bcrypt.compare(oldPassword, currentPassword);
      console.log(isMatch, "fjjf")
      if (!isMatch) {
        return { message: 'Old password is incorrect' };
      }


      const hashedNewPassword = await bcrypt.hash(newPassword, 8);

      const [result] = await pool.execute(
        'UPDATE employees SET password = ? WHERE id = ?',
        [hashedNewPassword, id]
      );

      if (result.affectedRows === 0) {
        throw new Error('Error changing password');
      }

      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      throw new Error('Error changing password');
    }
  },

  async getNotificationData() {
    try {
      const agentQuery = `
          SELECT id AS entity_id, name, created_at, 'agent' AS source
          FROM agents
          ORDER BY created_at DESC
          LIMIT 10
        `;

      const userQuery = `
          SELECT id AS entity_id, name, created_at, 'user' AS source
          FROM \`user\`
          ORDER BY created_at DESC
          LIMIT 10
        `;

      const unapprovedWorkingLocationQuery = `
          SELECT 
            awl.id AS entity_id,
            l.name AS location,
            awl.created_at,
            awl.is_approved,
            'agent_working_location' AS source
          FROM agent_working_locations awl
          JOIN localities l ON awl.location_id = l.id
          WHERE awl.is_approved = FALSE
          ORDER BY awl.created_at DESC;
        `;


      const unapprovedOfficeAddressQuery = `
          SELECT id AS entity_id, address AS location, status, created_at, 'office_address' AS source
          FROM office_address
          WHERE status = 'pending'
          ORDER BY created_at DESC
          LIMIT 10
        `;

      const [agentRows] = await pool.execute(agentQuery);
      const [userRows] = await pool.execute(userQuery);
      const [workingLocationRows] = await pool.execute(unapprovedWorkingLocationQuery);
      const [officeAddressRows] = await pool.execute(unapprovedOfficeAddressQuery);

      // Combine all notification data
      const notifications = [
        ...agentRows,
        ...userRows,
        ...workingLocationRows,
        ...officeAddressRows,
      ];

      // Sort by created_at descending (most recent first)
      notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return notifications;
    } catch (error) {
      console.error("❌ Error fetching notification data:", error);
      throw new Error("Failed to fetch notification data");
    }
  },

  async updateAgentRanking(agentId, locationId, newRanking) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 🔁 Normalize rankings first
      await connection.query(`SET @r = 0`);
      await connection.execute(
        `UPDATE agent_working_locations
       SET ranking = (@r := @r + 1)
       WHERE location_id = ?
       ORDER BY ranking ASC`,
        [locationId]
      );

      // ✅ Get current ranking of the agent
      const [rows] = await connection.execute(
        `SELECT ranking FROM agent_working_locations 
       WHERE agent_id = ? AND location_id = ?`,
        [agentId, locationId]
      );
      if (rows.length === 0) {
        throw new Error('Agent not found in location');
      }
      const currentRanking = rows[0].ranking;

      // 🔁 Shift other agents' rankings
      if (newRanking < currentRanking) {
        const [res] = await connection.execute(
          `UPDATE agent_working_locations 
         SET ranking = ranking + 1 
         WHERE location_id = ? AND ranking >= ? AND ranking < ?`,
          [locationId, newRanking, currentRanking]
        );
        console.log("↑ Ranking shift up:", res.affectedRows);
      } else if (newRanking > currentRanking) {
        const [res] = await connection.execute(
          `UPDATE agent_working_locations 
         SET ranking = ranking - 1 
         WHERE location_id = ? AND ranking <= ? AND ranking > ?`,
          [locationId, newRanking, currentRanking]
        );
        console.log("↓ Ranking shift down:", res.affectedRows);
      }

      // 🎯 Update agent's new rank
      await connection.execute(
        `UPDATE agent_working_locations 
       SET ranking = ? 
       WHERE agent_id = ? AND location_id = ?`,
        [newRanking, agentId, locationId]
      );

      await connection.commit();
      return { message: "Ranking updated successfully" };
    } catch (error) {
      await connection.rollback();
      console.error("Error during updateAgentRanking:", error);
      throw new Error("Failed to update agent ranking");
    } finally {
      connection.release();
    }
  }
  ,
async getAgentsWithDetails(page, pageSize, locationId, area_id, city_id) {
  console.log(page, pageSize, locationId, "jefj");

  try {
    const parsedPage = parseInt(page, 10);
    const parsedPageSize = parseInt(pageSize, 10);
    const offset = (parsedPage - 1) * parsedPageSize;

    let dataQuery = "";
    let countQuery = "";
    let queryParams = [];
    let countParams = [];
    console.log(city_id,area_id,locationId)
    if (city_id===null &&area_id===null &&locationId === null) {
      console.log("No location filter");

      dataQuery = `
        SELECT 
          a.id AS agent_id,
          a.email,
          a.name,
          a.phone,
          a.status,
          a.whatsapp_number,
          a.experience_years,
          a.rating,
          a.languages_spoken,
          oa.address AS office_address,
          COALESCE(JSON_ARRAYAGG(img.image_url), JSON_ARRAY()) AS image_urls,
          GROUP_CONCAT(DISTINCT l.name SEPARATOR ', ') AS working_locations
        FROM agents a
        LEFT JOIN office_address oa ON a.id = oa.agent_id
        LEFT JOIN agent_working_locations awl ON a.id = awl.agent_id 
        LEFT JOIN localities l ON awl.location_id = l.id
        LEFT JOIN agent_images img ON a.id = img.agent_id
        GROUP BY a.id
        LIMIT ${parsedPageSize} OFFSET ${offset};
      `;
      countQuery = `SELECT COUNT(*) AS total FROM agents;`;
    } else {
      console.log("With location/area/city filter");
      let whereClause = '';

      if (locationId) {
        whereClause = 'WHERE awl.location_id = ?';
        queryParams.push(parseInt(locationId));
        countParams.push(parseInt(locationId));
      } else if (area_id) {
        whereClause = 'WHERE l.area_id = ?';
        queryParams.push(parseInt(area_id))
        countParams.push(parseInt(area_id));
      } else if (city_id) {
        whereClause = 'WHERE l.city_id = ?';
      queryParams.push(parseInt(city_id));
        countParams.push(parseInt(city_id));
      }

      dataQuery = `
        SELECT 
          a.id AS agent_id,
          a.name,
          a.email,
          a.phone,
          a.status,
          a.whatsapp_number,
          a.experience_years,
          a.rating,
          a.languages_spoken,
          oa.address AS office_address,
          COALESCE(JSON_ARRAYAGG(img.image_url), JSON_ARRAY()) AS image_urls,
          GROUP_CONCAT(DISTINCT l.name ORDER BY awl.ranking SEPARATOR ', ') AS working_locations,
          GROUP_CONCAT(DISTINCT awl.ranking ORDER BY awl.ranking SEPARATOR ', ') AS rankings,
          MIN(awl.ranking) AS min_ranking
        FROM agents a
        LEFT JOIN office_address oa ON a.id = oa.agent_id
        LEFT JOIN agent_working_locations awl ON a.id = awl.agent_id
        LEFT JOIN localities l ON awl.location_id = l.id
        LEFT JOIN agent_images img ON a.id = img.agent_id
        ${whereClause}
        GROUP BY a.id
        ORDER BY min_ranking ASC
        LIMIT ${parsedPageSize} OFFSET ${offset};
      `;

     

      countQuery = `
        SELECT COUNT(DISTINCT a.id) AS total
        FROM agents a
        LEFT JOIN agent_working_locations awl ON a.id = awl.agent_id
        LEFT JOIN localities l ON awl.location_id = l.id
        ${whereClause};
      `;
    }

    const [rows] = await pool.execute(dataQuery, queryParams);
    const [countRows] = locationId === "null"
      ? await pool.execute(countQuery)
      : await pool.execute(countQuery, countParams);

    const total = countRows[0].total;

    return {
      data: rows,
      pagination: {
        total,
        page: parsedPage,
        pageSize: parsedPageSize,
        totalPages: Math.ceil(total / parsedPageSize),
      },
    };
  } catch (error) {
    console.error("❌ Error in getAgentsWithDetails:", error.message);
    throw new Error("Failed to get agent details");
  }
}


,


  async getAllUsersWithPagination(page = 1, limit = 10) {
    try {
      console.log("Function called");

      const parsedPage = parseInt(page, 10);
      const parsedLimit = parseInt(limit, 10);
      const offset = (parsedPage - 1) * parsedLimit;

      console.log("Offset:", offset);

      const [countResult] = await pool.execute(`SELECT COUNT(*) AS total FROM \`user\``);
      console.log("Count result:", countResult);

      const totalUsers = countResult[0].total;
      const totalPages = Math.ceil(totalUsers / parsedLimit);

      const [users] = await pool.execute(
        `SELECT id, name, dob, phone, role, status, location, created_at, updated_at
        FROM \`user\`
        ORDER BY created_at DESC
        LIMIT ${parsedLimit} OFFSET ${offset}` // ✅ Note: directly injected values
      );

      return {
        currentPage: parsedPage,
        totalPages,
        totalUsers,
        users,
      };
    } catch (error) {
      console.log(error)
      console.error("❌ Error fetching paginated users:", error.message);
      throw new Error("Error fetching paginated users");
    }
  }

  ,
  async NotificationCount() {
    try {
      // Query 1: Pending Users
      const [userResult] = await pool.execute(`
          SELECT COUNT(*) AS count
          FROM user
          WHERE status = FALSE
        `);
      const userCount = userResult[0].count;

      // Query 2: Pending Agents
      const [agentResult] = await pool.execute(`
          SELECT COUNT(*) AS count
          FROM agents
          WHERE status = FALSE
        `);
      const agentCount = agentResult[0].count;

      // Query 3: Pending Agent Working Locations
      const [locationResult] = await pool.execute(`
          SELECT COUNT(*) AS count
          FROM agent_working_locations
          WHERE is_approved = FALSE
        `);
      const locationCount = locationResult[0].count;

      // Query 4: Pending Office Addresses
      const [addressResult] = await pool.execute(`
          SELECT COUNT(*) AS count
          FROM office_address
          WHERE status = 'pending'
        `);
      const addressCount = addressResult[0].count;

      // Total count
      const totalCount = userCount + agentCount + locationCount + addressCount;

      return {
        success: true,
        message: 'Notification count retrieved successfully.',
        totalCount
      };
    } catch (error) {
      console.error('❌ Error fetching notification count:', error);
      return {
        success: false,
        message: 'Internal server error.',
      };
    }
  },

  // Update this path accordingly

  async getAllDataCount() {
    try {
      const [rows] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM \`user\`) AS total_users,
        (SELECT COUNT(*) FROM agents) AS total_agents,
        (SELECT COUNT(*) FROM agent_interactions WHERE click_type = 'whatsapp') AS total_whatsapp,
        (SELECT COUNT(*) FROM agent_interactions WHERE click_type = 'phone') AS total_phone,

        (SELECT COUNT(*) FROM \`user\` WHERE DATE(created_at) = CURDATE()) AS today_users,
        (SELECT COUNT(*) FROM agents WHERE DATE(created_at) = CURDATE()) AS today_agents,
        (SELECT COUNT(*) FROM agent_interactions WHERE click_type = 'whatsapp' AND DATE(clicked_at) = CURDATE()) AS today_whatsapp,
        (SELECT COUNT(*) FROM agent_interactions WHERE click_type = 'phone' AND DATE(clicked_at) = CURDATE()) AS today_phone;
    `);

      const [users] = await pool.query(`
      SELECT u.id AS userId, u.name AS userName, u.phone AS Phone, t.created_at AS login_time
      FROM tokens t
      JOIN \`user\` u ON t.userId = u.id
      WHERE t.userId IS NOT NULL
        AND DATE(t.created_at) = CURDATE()
      ORDER BY t.created_at DESC;
    `);

      const [agents] = await pool.query(`
      SELECT u.id AS userId, u.name AS userName, u.phone AS Phone, t.created_at AS login_time
      FROM tokens t
      JOIN agents u ON t.agentId = u.id
      WHERE t.agentId IS NOT NULL
        AND DATE(t.created_at) = CURDATE()
      ORDER BY t.created_at DESC;
    `);

      const [monthlyUserCounts] = await pool.query(`
      SELECT 
        MONTH(created_at) AS month,
        COUNT(*) AS count
      FROM \`user\`
      GROUP BY MONTH(created_at)
      ORDER BY month;
    `);

      const [monthlyAgentCounts] = await pool.query(`
      SELECT 
        MONTH(created_at) AS month,
        COUNT(*) AS count
      FROM agents
      GROUP BY MONTH(created_at)
      ORDER BY month;
    `);

      const [weeklyCounts] = await pool.query(`
      SELECT * FROM (
        SELECT 
          DAYNAME(clicked_at) AS day,
          click_type,
          COUNT(*) AS count
        FROM agent_interactions
        WHERE clicked_at >= CURDATE() - INTERVAL 7 DAY
        GROUP BY DAYNAME(clicked_at), click_type
      ) AS sub
      ORDER BY FIELD(sub.day, 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday');
    `);

      return {
        success: true,
        data: {
          ...rows[0],
          monthly_user_counts: formatMonthlyCounts(monthlyUserCounts),
          monthly_agent_counts: formatMonthlyCounts(monthlyAgentCounts),
          weekly_counts: formatWeeklyCounts(weeklyCounts),
          todayUserLogin: users,
          todayAgentLogin: agents
        }
      };

    } catch (error) {
      console.error('❌ Error fetching data counts:', error);
      return { success: false, message: 'Internal server error' };
    }
  },
  async getAgentPositionHistory(page = 1, limit = 10) {
    try {
      const parsedPage = parseInt(page, 10);
      const parsedLimit = parseInt(limit, 10);
      const offset = (parsedPage - 1) * parsedLimit;

      if (isNaN(parsedPage) || isNaN(parsedLimit)) {
        throw new Error("Invalid pagination parameters");
      }

      const query = `
        SELECT 
          h.id AS history_id,
          h.agent_id,
          a.name AS agent_name,
          a.phone AS Phone_Number,
          a.whatsapp_number AS Whatsapp_Number,
          a.image_url AS image,
          h.old_position,
          h.new_position,
          h.changed_at
        FROM 
          agent_position_history h
        JOIN 
          agents a ON h.agent_id = a.id
        ORDER BY 
          h.changed_at DESC
        LIMIT ${parsedLimit} OFFSET ${offset};
      `;

      const [rows] = await pool.query(query);

      const [totalCountResult] = await pool.query(`
        SELECT COUNT(*) AS total FROM agent_position_history
      `);

      const total = totalCountResult[0].total;
      const totalPages = Math.ceil(total / parsedLimit);

      return {
        total,
        totalPages,
        page: parsedPage,
        limit: parsedLimit,
        rows
      };
    } catch (error) {
      console.error("❌ Error fetching agent position history:", error.message);
      throw new Error("Failed to fetch agent position history");
    }
  },
  async assignLocalityToManager(manager_id, locality_ids) {
    const checkQuery = `
        SELECT locality_id FROM manager_localities 
        WHERE manager_id = ? AND locality_id IN (${locality_ids.map(() => '?').join(',')})
      `;

    const insertQuery = `
        INSERT INTO manager_localities (manager_id, locality_id)
        VALUES (?, ?)
      `;

    try {
      const inserted = [];

      // Check all existing in one query
      const [existing] = await pool.execute(checkQuery, [manager_id, ...locality_ids]);
      const existingIds = existing.map(row => row.locality_id);

      // Filter only those not already assigned
      const newIds = locality_ids.filter(id => !existingIds.includes(id));

      if (newIds.length === 0) {
        return { message: "All selected localities are already assigned to the manager.", inserted: [] };
      }

      // Insert only new ones
      for (const localityId of newIds) {
        await pool.execute(insertQuery, [manager_id, localityId]);
        inserted.push(localityId);
      }

      return { message: "Localities assigned successfully.", inserted };
    } catch (error) {
      console.error("Error assigning localities to manager:", error.message);
      throw error;
    }
  },
  async getAgentsByLocality(locationIds, page = 1, limit = 10) {
    if (!locationIds || !Array.isArray(locationIds) || locationIds.length === 0) {
      return {
        success: false,
        message: 'locationIds are required as a non-empty array',
        data: [],
      };
    }

    const localityIds = locationIds.map(loc => loc.locality_id);
    const placeholders = localityIds.map(() => '?').join(',');

    const offset = (page - 1) * limit;

    const query = `
        SELECT 
          a.id AS agent_id,
          a.name,
          a.phone,
          a.status,
          a.whatsapp_number,
          a.experience_years,
          a.image_url,
          a.position,
          a.languages_spoken,
          MAX(l.name) AS locality_name,
          oa.address AS office_address,
          oa.latitude,
          oa.longitude,
          oa.status AS office_status,
          (
            SELECT GROUP_CONCAT(DISTINCT l2.name SEPARATOR ', ')
            FROM agent_working_locations awl2
            JOIN localities l2 ON awl2.location_id = l2.id
            WHERE awl2.agent_id = a.id
          ) AS working_locations
        FROM agents a
        JOIN agent_working_locations awl ON a.id = awl.agent_id
        JOIN localities l ON awl.location_id = l.id
        LEFT JOIN office_address oa ON a.id = oa.agent_id
        WHERE awl.location_id IN (${placeholders})
        GROUP BY a.id
        ORDER BY a.id
        LIMIT ? OFFSET ?;
      `;

    try {
      const [rows] = await pool.execute(query, [...localityIds, limit, offset]);

      const countQuery = `
          SELECT COUNT(DISTINCT a.id) AS total
          FROM agents a
          JOIN agent_working_locations awl ON a.id = awl.agent_id
          WHERE awl.location_id IN (${placeholders});
        `;
      const [countResult] = await pool.execute(countQuery, localityIds);
      const total = countResult[0]?.total || 0;

      return {
        success: true,
        message: 'Agents fetched successfully.',
        data: rows,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (err) {
      console.error('Error fetching agent data:', err);
      return {
        success: false,
        message: 'An error occurred while fetching agents.',
        error: err.message,
      };
    }
  }


  ,
  async getLocalitiesByManager(managerId) {
    const query = `
        SELECT locality_id 
        FROM manager_localities 
        WHERE manager_id = ?;
      `;

    try {
      const [rows] = await pool.execute(query, [managerId]);

      if (rows.length === 0) {
        return {
          success: false,
          message: 'No localities assigned to this manager.',
          data: [],
        };
      }

      return {
        success: true,
        message: 'Locality IDs fetched successfully.',
        data: [rows]
      };
    } catch (err) {
      console.error('Error fetching locality IDs:', err);
      return {
        success: false,
        message: 'An error occurred while fetching localities.',
        error: err.message,
        data: [],
      };
    }
  },
  async getNotificationByLocalities(locationIds) {
    try {
      if (!Array.isArray(locationIds) || locationIds.length === 0) {
        throw new Error("Invalid locality IDs");
      }

      const localityIds = locationIds.map(loc => loc.locality_id);
      const placeholders = localityIds.map(() => '?').join(',');

      // Unapproved agent working locations
      const unapprovedWorkingLocationQuery = `
        SELECT DISTINCT
          awl.id AS entity_id,
          l.name AS location,
          awl.created_at,
          awl.is_approved,
          'agent_working_location' AS source
        FROM agent_working_locations awl
        JOIN localities l ON awl.location_id = l.id
        WHERE awl.location_id IN (${placeholders}) AND awl.is_approved = False
      `;

      // Pending office addresses
      const unapprovedOfficeAddressQuery = `
        SELECT DISTINCT
          oa.id AS entity_id, 
          oa.address AS location, 
          oa.status, 
          oa.created_at, 
          'office_address' AS source
        FROM office_address oa
        JOIN agents a ON oa.agent_id = a.id
        JOIN agent_working_locations awl ON a.id = awl.agent_id
        WHERE awl.location_id IN (${placeholders}) AND oa.status = 'pending'
      `;

      // Execute both queries using the same locality IDs
      const [workingLocationRows] = await pool.execute(unapprovedWorkingLocationQuery, localityIds);
      const [officeAddressRows] = await pool.execute(unapprovedOfficeAddressQuery, localityIds);

      // Combine and deduplicate
      const combined = [...workingLocationRows, ...officeAddressRows];
      console.log(combined, "combined")
      const uniqueMap = new Map();



      const notifications = Array.from(combined.values());
      console.log(notifications, "notifications");


      // Sort by created_at descending
      notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return {
        success: true,
        data: notifications,
      };
    } catch (error) {
      console.error("❌ Error fetching notifications:", error);
      return {
        success: false,
        message: "Failed to fetch notification data",
        error: error.message,
      };
    }
  },
  async getEmployeesWithLocalities() {
    const query = `
      SELECT 
        e.id AS employee_id,
        e.name AS employee_name,
        e.email AS employee_email,
        GROUP_CONCAT(l.name SEPARATOR ', ') AS assigned_localities
      FROM 
        employees e
      JOIN   -- Note: changed LEFT JOIN to INNER JOIN to exclude employees without localities
        manager_localities ml ON e.id = ml.manager_id
      JOIN 
        localities l ON ml.locality_id = l.id
      GROUP BY 
        e.id, e.name,e.email
      HAVING 
        assigned_localities IS NOT NULL AND assigned_localities != '';
    `;

    try {
      const [rows] = await pool.execute(query);
      console.log("Employees with Assigned Localities:");
      const data = rows.map(row => ({
        employee_id: row.employee_id,
        employee_name: row.employee_name,
        employee_email: row.employee_email,
        assigned_localities: row.assigned_localities
      }));
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching data:', error.message);
      return { success: false, message: error.message };
    }
  },
  async getAllUserReviews(page = 1, limit = 10) {
    try {
      const parsedPage = parseInt(page, 10);
      const parsedLimit = parseInt(limit, 10);
      const offset = (parsedPage - 1) * parsedLimit;

      // Main review query with LIMIT and OFFSET directly inlined
      const query = `
        SELECT 
          ur.id,
          ur.comment,
          ur.rating,
          ur.created_at,
          u.name AS user_name,
          u.phone AS user_phone,
          a.name AS agent_name,
          a.phone AS agent_phone
        FROM user_review ur
        JOIN \`user\` u ON ur.user_id = u.id
        JOIN agents a ON ur.agent_id = a.id
        ORDER BY ur.created_at DESC
        LIMIT ${parsedLimit} OFFSET ${offset}
      `;

      const [rows] = await pool.query(query);

      // Total count
      const [countResult] = await pool.query('SELECT COUNT(*) AS total FROM user_review');
      const total = countResult[0].total;

      return {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit),
        reviews: rows,
      };
    } catch (error) {
      console.error('❌ Error fetching paginated user reviews:', error.message);
      throw new Error('Failed to fetch user reviews');
    }
  },
  async getDetailedInteractionsByTimeRange(range, page = 1, limit = 10) {
    try {
      let whereCondition;

      switch (range) {
        case 'today':
          whereCondition = 'DATE(ai.clicked_at) = CURDATE()';
          break;
        case '7d':
          whereCondition = 'ai.clicked_at >= NOW() - INTERVAL 7 DAY';
          break;
        case '1m':
          whereCondition = 'ai.clicked_at >= NOW() - INTERVAL 1 MONTH';
          break;
        case '3m':
          whereCondition = 'ai.clicked_at >= NOW() - INTERVAL 3 MONTH';
          break;
        case '6m':
          whereCondition = 'ai.clicked_at >= NOW() - INTERVAL 6 MONTH';
          break;
        case '1y':
          whereCondition = 'ai.clicked_at >= NOW() - INTERVAL 1 YEAR';
          break;
        default:
          console.warn('Invalid or missing range. Defaulting to today.');
          whereCondition = 'DATE(ai.clicked_at) = CURDATE()';
      }

      // Calculate offset for pagination
      const offset = (page - 1) * limit;

      // Query with LIMIT and OFFSET
      const query = `
        SELECT 
          ai.agent_id,
          a.name AS agent_name,
          a.phone AS agent_phone,
          ai.user_id,
          u.name AS user_name,
          u.phone AS user_phone,
          ai.click_type,
          ai.clicked_at
        FROM agent_interactions ai
        JOIN agents a ON ai.agent_id = a.id
        JOIN \`user\` u ON ai.user_id = u.id
        WHERE ${whereCondition}
        ORDER BY ai.clicked_at DESC
        LIMIT ? OFFSET ?;
      `;

      const [rows] = await pool.execute(query, [limit, offset]);

      const whatsappData = rows.filter(item => item.click_type === 'whatsapp');
      const phoneData = rows.filter(item => item.click_type === 'phone');

      // Optionally get total count for pagination info
      const countQuery = `
        SELECT COUNT(*) as total
        FROM agent_interactions ai
        WHERE ${whereCondition};
      `;
      const [[{ total }]] = await pool.execute(countQuery);

      return {
        total,
        page,
        limit,
        whatsapp: whatsappData,
        phone: phoneData,
      };

    } catch (error) {
      console.error('Error fetching detailed interactions:', error);
      throw error;
    }
  },
    // Get user by ID
    async getAgentById(agent_id) {
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

    const agent = rows[0];
    agent.images = agent.images ? agent.images.split(',') : [];

    return { success: true, data: agent };
  } catch (error) {
    console.error('Error fetching agent by ID:', error);
    return { success: false, message: 'Failed to fetch agent.' };
  }
},




};

module.exports = User;