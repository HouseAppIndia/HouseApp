const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const pool = require('../config/db.config');
const  bcrypt = "bcrypt";
const ApiError = require('../utils/ApiError');

const getAgentProfile = catchAsync(async (req, res) => {
  try {
    const id = req.user.userId;

    if (!id) {
      throw new ApiError(400, "Agent ID is required", "AGENT_ID_REQUIRED");
    }

    const [agentRows] = await pool.execute('SELECT * FROM agents WHERE id = ?', [id]);
    if (agentRows.length === 0) {
      throw new ApiError(404, "Agent not found", "AGENT_NOT_FOUND");
    }

    const agent = agentRows[0];

    const [images] = await pool.execute(
      'SELECT id, image_url FROM agent_images WHERE agent_id = ?',
      [id]
    );

    agent.images = images;

    res.status(200).json({
      success: true,
      data: agent
    });
  } catch (error) {
    console.error("Error in getAgentProfile:", error);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
});


const getAgentWorkingLocations = catchAsync(async (req, res) => {
  try {
    const agentId = req.user.userId;

    if (!agentId) {
      throw new ApiError(400, "Agent ID is required", "AGENT_ID_REQUIRED");
    }

    const query = `
      SELECT 
        awl.id,
        awl.location_id AS locality_id,
        l.name AS locality_name,
        awl.city_id,
        c.name AS city_name,
        awl.area_id,
        a.name AS area_name,
        awl.is_primary,
        awl.created_at AS added_at
      FROM agent_working_locations awl
      LEFT JOIN localities l ON awl.location_id = l.id
      LEFT JOIN cities c ON awl.city_id = c.id
      LEFT JOIN areas a ON awl.area_id = a.id
      WHERE awl.agent_id = ?
      ORDER BY awl.ranking DESC, awl.created_at DESC
    `;

    const [rows] = await pool.execute(query, [agentId]);

    res.status(200).json({
      success: true,
      message: "Working locations retrieved successfully",
      data: rows
    });
  } catch (error) {
    console.error("Error in getAgentWorkingLocations:", error);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
});


const getOfficeAddressByAgentId = catchAsync(async (req, res) => {
  try {
    const agentId = req.user.userId;

    if (!agentId) {
      throw new ApiError(400, "Agent ID is required", "AGENT_ID_REQUIRED");
    }

    const query = `
      SELECT 
        id,
        address,
        latitude,
        longitude,
        status,
        created_at,
        updated_at
      FROM office_address
      WHERE agent_id = ?
      LIMIT 1
    `;

    const [rows] = await pool.execute(query, [agentId]);

    if (rows.length === 0) {
      throw new ApiError(404, "Office address not found for this agent", "ADDRESS_NOT_FOUND");
    }

    res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error("Error in getOfficeAddressByAgentId:", error);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
});


const getUserProfile = catchAsync(async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(401, "Unauthorized: User ID missing", "USER_ID_REQUIRED");
    }

    const query = `
      SELECT 
        id, name, dob, phone, email, profile, location, created_at, updated_at
      FROM \`user\`
      WHERE id = ?
    `;

    const [rows] = await pool.execute(query, [userId]);

    if (rows.length === 0) {
      throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    }

    res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: rows[0]
    });
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
});
async function verifyAdmin(email, password) {
  try {
    // Step 1: Fetch user by email
    const [rows] = await pool.execute(
      "SELECT * FROM employees WHERE email = 'admin1@gmail.com'",
    );

    if (rows.length === 0) {
      return { success: false, message: "User not found" };
    }

    const user = rows[0];

    // Step 2: Check if email matches admin1@gmail.com
    if (user.email !== "admin1@gmail.com") {
      return { success: false, message: "Not authorized" };
    }

    // Step 3: Compare password using bcrypt
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return { success: false, message: "Password not match" };
    }

    // Step 4: If password correct
    return { success: true, message: "Login successful", user };
  } catch (err) {
    console.error("Error verifying admin:", err);
    return { success: false, message: "Internal server error" };
  }
}



module.exports = {
  verifyAdmin,
  getAgentProfile,
  getAgentWorkingLocations,
  getOfficeAddressByAgentId,
  getUserProfile
};
