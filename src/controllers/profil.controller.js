const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { bool } = require('joi');
const pool = require('../config/db.config');



const getAgentProfile = catchAsync(async (req, res) => {
  const id = req.user.userId;
  if (!id) {
    return res.status(400).json({ success: false, message: "Agent ID is required" });
  }

  // Get agent profile
  const [agentRows] = await pool.execute('SELECT * FROM agents WHERE id = ?', [id]);
  if (agentRows.length === 0) {
    return res.status(404).json({ success: false, message: "Agent not found" });
  }

  const agent = agentRows[0];

  // Get agent images
  const [images] = await pool.execute(
    'SELECT id, image_url FROM agent_images WHERE agent_id = ?',
    [id]
  );

  agent.images = images;

  res.status(200).json({
    success: true,
    data: agent
  });
});


const getAgentWorkingLocations = catchAsync(async (req, res) => {
  const agentId =  req.user.userId;

  if (!agentId) {
    return res.status(400).json({ success: false, message: "Agent ID is required" });
  }

  const query = `
    SELECT 
      awl.id,
      awl.location_id,
      l.name AS locality_name,
      awl.city_id,
      c.name AS city_name,
      awl.area_id,
      a.name AS area_name
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
    data: rows
  });
});



const getOfficeAddressByAgentId = catchAsync(async (req, res) => {
  const agentId = req.user.userId;

  if (!agentId) {
    return res.status(400).json({ success: false, message: "Agent ID is required" });
  }

  const query = `
    SELECT 
      id
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
    console.log(rows,"code")
  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: "Office address not found for this agent" });
  }

  res.status(200).json({
    success: true,
    data: rows[0]
  });
});



const getUserProfile = catchAsync(async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized: User ID missing" });
  }

  const query = `
    SELECT 
      id, name, dob, phone, email, profile, location, created_at, updated_at
    FROM \`user\`
    WHERE id = ?
  `;

  const [rows] = await pool.execute(query, [userId]);

  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.status(200).json({
    success: true,
    data: rows[0]
  });
});



module.exports={
    getAgentProfile,
    getAgentWorkingLocations,
    getOfficeAddressByAgentId,
    getUserProfile
}