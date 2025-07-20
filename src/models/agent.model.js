    const pool = require('../config/db.config');
    const bcrypt = require('bcryptjs');
    const { json } = require('express');
    const moment = require('moment');
    const ApiError = require('../utils/ApiError');

    const Agent = {
        async isMobilePhone(phone, excludeId = null) {
            try {
                let query = 'SELECT 1 FROM agents WHERE phone = ? AND status = true';
                const params = [phone];

                if (excludeId) {
                    query += ' AND id != ?';
                    params.push(excludeId);
                }

                const [rows] = await pool.execute(query, params);
                return rows.length > 0;
            } catch (error) {
                console.error("Error checking phone:", error);
                 throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
            }
        },

        async create(phone) {
            try {
                const isPhoneExists = await this.isMobilePhone(phone);
                if (isPhoneExists) {
                    return { success: false, message: 'Phone number already registered' };
                }

                const [result] = await pool.execute(
                `INSERT INTO agents (phone, status) VALUES (?, ?)`,
                [phone, true]
                );

                return {
                    message: 'Agent created successfully',
                    success: true,
                    id: result.insertId,
                    phone,
                
                };
            } catch (error) {
                console.error("Create agent error:", error);
                throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
            }
        },

        async getUserByPhone(phone) {
            try {
                const [rows] = await pool.execute('SELECT * FROM agents WHERE phone = ?', [phone]);
                return rows[0] || null;
            } catch (error) {
                console.error("Error fetching user by phone:", error);
                  throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
            }
        },

        async getUserById(agentId) {
            try {
                const [rows] = await pool.execute('SELECT * FROM agents WHERE id = ?', [agentId]);
                return rows[0] || null;
            } catch (error) {
                console.error("Error fetching user by ID:", error);
                  throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
            }
        },

        async updateProfile(agentId, updateData) {
            try {
                const fields = [];
                const values = [];

                if (updateData.name) {
                    fields.push('name = ?');
                    values.push(updateData.name);
                }

                if(updateData.agency_name){
                    fields.push('agency_name=?')
                    values.push(updateData.agency_name)
                }

                if (updateData.whatsapp_number) {
                    fields.push('whatsapp_number = ?');
                    values.push(updateData.whatsapp_number);
                }

                  if (updateData.email) {
                    fields.push('email = ?');
                    values.push(updateData.email);
                }

                // if (images) {
                //     fields.push('image_url  = ?');
                //     // values.push(images);
                // }


                if (updateData.experience_years != null) {
                    fields.push('experience_years = ?');
                    values.push(updateData.experience_years);
                }


                if(updateData.description){
                    fields.push('description=?')
                    values.push(JSON.stringify(updateData.description))
                }

            

                if (fields.length === 0) {
                    return { success: false, message: 'No valid fields to update' };
                }

                if (fields.length > 0) {
                values.push(agentId);
                const query = `UPDATE agents SET ${fields.join(', ')},status = false, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
                result = await pool.execute(query, values);
        }
    if (Array.isArray(updateData.images) && updateData.images.length > 0) {
    const imageInsertQuery = `INSERT INTO agent_images (agent_id, image_url) VALUES (?, ?)`;

    for (const imgUrl of updateData.images) {
        console.log("Inserting image:", imgUrl);
        console.log("Agent ID:", agentId);

        await pool.execute(imageInsertQuery, [agentId, imgUrl]);
    }
    }

                return {
                    success: result.affectedRows > 0,
                    message: result.affectedRows > 0 ? 'Profile updated successfully' : 'No changes made'
                };
            } catch (error) {
                console.error("Error updating profile:", error);
                  throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
            }
        },

        async addWorkingLocation(agentId, location_ids) {
            try {
                if (!Array.isArray(location_ids) || location_ids.length === 0) {
                    return { success: false, message: 'Locations must be a non-empty array' };
                }

                const values = location_ids.map(item => [ agentId,item.location_id,item.city_id,item.area_id,1]);
                const query = `INSERT INTO agent_working_locations (agent_id, location_id, city_id, area_id, ranking)VALUES ?
`;

                await pool.query(query, [values]);

                return { success: true, message: 'Locations added successfully', agentId };
            } catch (error) {
                console.error('Error inserting working locations:', error);
                  throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
            }
        },

        async getWorkingLocations(agentId) {
            try {
                const [rows] = await pool.execute(
                    'SELECT * FROM agent_working_locations WHERE agent_id = ?',
                    [agentId]
                );
                return { success: true, data: rows };
            } catch (error) {
                console.error("Error fetching working locations:", error);
                 throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
            }
        },

        async statusUpdate(user_id) {
            try {
                const [result] = await pool.execute(
                    "UPDATE user SET status = FALSE WHERE id = ?",
                    [user_id]
                );

                if (result.affectedRows === 0) {
                    return { success: false, message: "User not found or status already false" };
                }

                return { success: true, message: "User status updated to false" };
            } catch (error) {
                console.error("Error updating status:", error);
                  throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
            }
        },

        async isSaveOtp(userId, otp, expiresAt) {
            try {
                const [result] = await pool.execute(
                    "INSERT INTO otps (agent_id, otp_code, expires_at) VALUES (?, ?, ?)",
                    [userId, otp, expiresAt]
                );

                if (result.affectedRows === 0) {
                    return { success: false, message: "OTP was not saved" };
                }

                return {
                    success: true,
                    insertId: result.insertId,
                    message: "OTP saved successfully"
                };
            } catch (error) {
                console.error("Error saving OTP:", error);
                  throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
            }
        },

        async getOtpByUserId(userId, otp) {
            console.log(userId,otp)
            try {
                const now = moment().format("YYYY-MM-DD HH:mm:ss");

                const [otpRows] = await pool.execute(
                    `SELECT * FROM otps 
                    WHERE agent_id = ? AND otp_code = ? AND verified = FALSE AND expires_at > ?`,
                    [userId, otp, now]
                );
                console.log("a")

                if (otpRows.length === 0) {
                    return { success: false, message: "Invalid or expired OTP" };
                }
            console.log("aa")
                await pool.execute(
                    "UPDATE otps SET verified = TRUE WHERE id = ?",
                    [otpRows[0].id]
                );
               console.log("b")

                await pool.execute(
                    "UPDATE agents SET status = TRUE WHERE id = ?",
                    [userId]
                );
                console.log("c")

                return { success: true, message: "OTP verified successfully" };
            } catch (error) {
                console.error("Error verifying OTP:", error);
                  throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');;
            }
        },

        async UpdateAddress(agentId, { address, latitude, longitude }) {
            try {
                if (!agentId || !address || !latitude || !longitude) {
                    return { success: false, message: 'Missing required fields' };
                }

                const [existing] = await pool.execute('SELECT * FROM office_address WHERE agent_id = ?', [agentId]);

                if (existing.length > 0) {
                    await pool.execute(
                        `UPDATE office_address 
                        SET address = ?, latitude = ?, longitude = ?, status = 'pending', updated_at = NOW()
                        WHERE agent_id = ?`,
                        [address, latitude, longitude, agentId]
                    );
                    return { success: true, message: 'Address updated and set to pending' };
                } else {
                    await pool.execute(
                        `INSERT INTO office_address (agent_id, address, latitude, longitude) 
                        VALUES (?, ?, ?, ?)`,
                        [agentId, address, latitude, longitude]
                    );
                    return { success: true, message: 'New office address created and pending approval' };
                }
            } catch (error) {
                console.error("Error updating address:", error);
                  throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
            }
        }
    };

    module.exports = Agent;
