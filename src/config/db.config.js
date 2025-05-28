const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function ensureEmployeesTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS employees (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100),
      dob DATE,
      email VARCHAR(255) UNIQUE,
      managerId INT,
      role VARCHAR(50) DEFAULT 'employee',
      status BOOLEAN DEFAULT TRUE,
      password VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.execute(query);
}

async function createUserTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS \`user\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100),
      dob DATE,
      phone VARCHAR(20) UNIQUE,
      role VARCHAR(50) DEFAULT 'users',
      status BOOLEAN DEFAULT FALSE,
      location TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;
  await pool.execute(query);
}

async function createAgentTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS agents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100),
      phone VARCHAR(20) UNIQUE,
      whatsapp_number VARCHAR(20),
      image_url VARCHAR(255),
      office_address TEXT,
      city VARCHAR(100),
      status BOOLEAN DEFAULT FALSE,
      experience_years VARCHAR(20),
      languages_spoken TEXT,
      rating DECIMAL(3,2),
      role VARCHAR(50) DEFAULT 'agent',
      verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;
  await pool.execute(query);
}

async function createTokensTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      token VARCHAR(255) NOT NULL,
      userId INT DEFAULT NULL,
      agentId INT DEFAULT NULL,
      employeeId INT DEFAULT NULL,
      type VARCHAR(50) NOT NULL,
      expires DATETIME NOT NULL,
      blacklisted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES \`user\`(id) ON DELETE CASCADE,
      FOREIGN KEY (agentId) REFERENCES agents(id) ON DELETE CASCADE,
      FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
    );
  `;
  await pool.execute(query);
}

async function createAgentInteractionsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS agent_interactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      agent_id INT,
      user_id INT,
      click_type VARCHAR(50),
      clicked_from ENUM('browser', 'mobile') NOT NULL DEFAULT 'browser',
      clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES \`user\`(id) ON DELETE CASCADE
    );
  `;
  await pool.execute(query);
}

async function createAgentWorkingLocationsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS agent_working_locations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      agent_id INT NOT NULL,
      location_id INT NOT NULL,
      is_approved BOOLEAN DEFAULT FALSE,
      ranking INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
      FOREIGN KEY (location_id) REFERENCES localities(id) ON DELETE CASCADE
    );
  `;
  await pool.execute(query);
}

async function createBannersTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS banners (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(100),
      image_url VARCHAR(255) NOT NULL,
      link_url VARCHAR(255),
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      position VARCHAR(50),
      priority INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;
  await pool.execute(query);
}

async function createUserReviewTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS user_review (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      agent_id INT NOT NULL,
      comment TEXT,
      rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES \`user\`(id) ON DELETE CASCADE,
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
    );
  `;
  await pool.execute(query);
}

async function createOtpTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS otps (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      agent_id INT,
      otp_code VARCHAR(6) NOT NULL,
      verified BOOLEAN DEFAULT FALSE,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES \`user\`(id) ON DELETE CASCADE,
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
    );
  `;
  await pool.execute(query);
}

async function createOfficeAddressTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS office_address (
      id INT AUTO_INCREMENT PRIMARY KEY,
      agent_id INT UNIQUE NOT NULL,
      address VARCHAR(255) NOT NULL,
      latitude DECIMAL(10,8) NOT NULL,
      longitude DECIMAL(11,8) NOT NULL,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
    );
  `;
  await pool.execute(query);
}

async function AddCity() {
  const query = `
    CREATE TABLE IF NOT EXISTS cities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE
    );
  `;
  await pool.execute(query);
}

async function AddAreas() {
  const query = `
    CREATE TABLE IF NOT EXISTS areas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      city_id INT,
      FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
    );
  `;
  await pool.execute(query);
}

async function localities() {
  const query = `
    CREATE TABLE IF NOT EXISTS localities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      city_id INT,
      area_id INT DEFAULT NULL,
      FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE,
      FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL
    );
  `;
  await pool.execute(query);
}

async function locality_limits() {
  const query = `
    CREATE TABLE IF NOT EXISTS locality_limits (
      id INT AUTO_INCREMENT PRIMARY KEY,
      locality_id INT NOT NULL,
      data_limit INT NOT NULL,
      FOREIGN KEY (locality_id) REFERENCES localities(id) ON DELETE CASCADE
    );
  `;
  await pool.execute(query);
}

async function createStaticContentTables() {
  const aboutUsQuery = `
    CREATE TABLE IF NOT EXISTS about_us (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255),
      content TEXT,
      status BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;

  const privacyPolicyQuery = `
    CREATE TABLE IF NOT EXISTS privacy_policies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255),
      content TEXT,
      status BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;

  const termsConditionsQuery = `
    CREATE TABLE IF NOT EXISTS terms_and_conditions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255),
      content TEXT,
      status BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;

  await pool.execute(aboutUsQuery);
  await pool.execute(privacyPolicyQuery);
  await pool.execute(termsConditionsQuery);
}

async function AgentHistory() {
  const query = `
    CREATE TABLE IF NOT EXISTS agent_position_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      agent_id INT NOT NULL,
      old_position INT,
      new_position INT,
      changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
    );
  `;
  await pool.execute(query);
}

async function createManagerLocalitiesTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS manager_localities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      manager_id INT NOT NULL,
      locality_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE CASCADE,
      FOREIGN KEY (locality_id) REFERENCES localities(id) ON DELETE CASCADE
    );
  `;
  await pool.execute(query);
}

async function createSponsorshipTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS sponsorships (
      id INT AUTO_INCREMENT PRIMARY KEY,
      agent_id INT NOT NULL,
      sponsor_id VARCHAR(255),
      locality_id INT DEFAULT NULL,
      start_date DATE,
      end_date DATE,
      FOREIGN KEY (locality_id) REFERENCES localities(id) ON DELETE SET NULL
    );
  `;
  await pool.execute(query);
}

// Dummy function if 'addEntityColumn' is referenced but not defined
async function addEntityColumn() {
  // No-op or implement column alterations here
}

async function initializeDatabase() {
  try {
    await ensureEmployeesTable();
    await createUserTable();
    await createAgentTable();
    await AddCity();
    await AddAreas();
    await localities();
    await createAgentWorkingLocationsTable();
    await locality_limits();
    await createManagerLocalitiesTable();
    await createTokensTable();
    await createAgentInteractionsTable();
    await createBannersTable();
    await createUserReviewTable();
    await createOtpTable();
    await createOfficeAddressTable();
    await addEntityColumn();
    await createStaticContentTables();
    await AgentHistory();
    await createSponsorshipTable();

    console.log("✅ All tables created successfully!");
  } catch (err) {
    console.error("❌ Error initializing database:", err);
  }
}

initializeDatabase();

module.exports = pool;
