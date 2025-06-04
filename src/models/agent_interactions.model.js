const pool = require('../config/db.config');

const AgentInteraction = {
    async create(user_id, data) {
        try {
            const { agentId, click_type, clicked_from } = data;

            if (!agentId || !click_type || !clicked_from) {
                throw new Error('agentId, click_type, and clicked_from are required');
            }

            const insertQuery = `
            INSERT INTO agent_interactions (agent_id, user_id, click_type, clicked_from)
            VALUES (?, ?, ?, ?)
          `;
            const [result] = await pool.execute(insertQuery, [
                agentId,
                user_id,
                click_type,
                clicked_from,
            ]);

            return {
                id: result.insertId,
                click_type:click_type,
                message: 'Success',
            };
        } catch (error) {
            throw new Error(error.message || 'Error recording interaction');
        }
    },
}

module.exports = AgentInteraction;
