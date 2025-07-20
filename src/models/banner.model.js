const pool = require('../config/db.config');
const ApiError =require('../utils/ApiError')

const Banner = {
  async createBaner({title, image_url, link_url, start_time, end_time, is_active = true,position,  priority = 1,city_id}) {  
    try {
      const [result] = await pool.execute(
        `INSERT INTO banners (title, image_url, link_url, start_time, end_time, is_active, position, priority,city_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)`,
        [title, image_url, link_url, new Date(start_time),  new Date(end_time),, is_active, position, "Mobile",city_id]
      );
      console.log(result)
      return {
        success: true,
        id: result.insertId,
        message: 'Banner created successfully'
      };
    } catch (error) {
      console.error('Error in createBanner:', error);
       throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
    }
  },

  async getAllBanners() {
     try {
    const [rows] = await pool.execute(`
      SELECT 
        b.id AS banner_id,
        b.title,
        b.image_url,
        b.link_url,
        b.start_time,
        b.end_time,
        b.is_active,
        b.position,
        b.priority,
        b.city_id,
        c.name AS city_name,
        b.created_at,
        b.updated_at
      FROM 
        banners b
      JOIN 
        cities c ON b.city_id = c.id
      ORDER BY b.created_at DESC
    `);

    return { success: true, data: rows };
  } catch (error) {
    console.error('Error fetching banners with cities:', error);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
  },

  async getBannerById(id) {
    try {
      const [banners] = await pool.execute('SELECT * FROM banners WHERE id = ?', [id]);
      if (banners.length === 0) return { success: false, message: 'Banner not found' };
      return { success: true, data: banners[0] };
    } catch (error) {
      console.error('Error in getBannerById:', error);
       throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
    }
  },

  async deleteBanner(id) {
    try {
      const [result] = await pool.execute('DELETE FROM banners WHERE id = ?', [id]);
      if (result.affectedRows === 0) return { success: false, message: 'Banner not found' };
      return { success: true, message: 'Banner deleted successfully' };
    } catch (error) {
      console.error('Error in deleteBanner:', error);
       throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
    }
  },

  async updateBanner(id, updateData) {
    try {
      const fields = [];
      const values = [];

      if (updateData.title) {
        fields.push('title = ?');
        values.push(updateData.title);
      }

      if (updateData.link_url) {
        fields.push('link_url = ?');
        values.push(updateData.link_url);
      }
      if (updateData.is_active) {
        fields.push('is_active = ?');
        values.push(updateData.is_active);
      }

       if (updateData.start_time) {
        fields.push('start_time = ?');
        values.push(new Date(updateData.start_time));
      }

      if (updateData.end_time) {
        fields.push('end_time = ?');
        values.push(new Date(updateData.end_time));
      }

      if (updateData.is_active !== undefined) {
        fields.push('is_active = ?');
        values.push(updateData.is_active);
      }

      if (updateData.position !== undefined) {
        fields.push('position = ?');
        values.push(updateData.position);
      }

      if (updateData.priority !== undefined) {
        fields.push('priority = ?');
        values.push(updateData.priority);
      }

        if (updateData. image_url !== undefined) {
        fields.push('image_url = ?');
        values.push(updateData.image_url);
      }
      if(updateData.city_id){
        fields.push('city_id=?')
        values.push(updateData.city_id)
      }
      if(updateData.position){
        fields.push('position=?')
        values.push(updateData.position)
      }

      if (fields.length === 0) {
        return { success: false, message: 'No fields to update' };
      }



      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const query = `UPDATE banners SET ${fields.join(', ')} WHERE id = ?`;
      const [result] = await pool.execute(query, values);

      return {
        success: result.affectedRows > 0,
        message: result.affectedRows > 0 ? 'Banner updated successfully' : 'No changes made'
      };
    } catch (error) {
      console.error('Error in updateBanner:', error);
      return {
        success: false,
        message: 'Failed to update banner',
        error: error.message
      };
    }
  }
};

module.exports = Banner;
