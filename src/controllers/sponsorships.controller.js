const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const {SponserShipService} = require('../services/');

/* ------------------------- Sponsorship Controllers ------------------------- */

/**
 * Fetch all sponsorships
 */
const fetchAllSponsorships = catchAsync(async (req, res) => {
    const data = await SponserShipService.getAllSponsorshipss();
    res.status(httpStatus.OK).send(data);
});

/**
 * Get a single sponsorship by ID
 */
const fetchSponsorshipById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const data = await SponserShipService.getSponsorshipsById(id);
    res.status(httpStatus.OK).send(data);
});

/**
 * Add a new sponsorship
 */
const createSponsorship = catchAsync(async (req, res) => {
      const sponsorshipData = {...req.body, agent_id: req.params.agentId};
    const data = await SponserShipService.createSponsorships(sponsorshipData);
    res.status(httpStatus.CREATED).send({ message: 'Sponsorship created successfully', sponsorship: data });
});

/**
 * Update sponsorship by ID
 */
const updateSponsorship = catchAsync(async (req, res) => {
    const { id } = req.params;
    const data = await SponserShipService.updateSponsorshipsById(id, req.body);
    res.status(httpStatus.OK).send({ message: 'Sponsorship updated successfully', sponsorship: data });
});

/**
 * Delete sponsorship by ID
 */
const deleteSponsorship = catchAsync(async (req, res) => {
    const { id } = req.params;
    await SponserShipService.deleteSponsorshipsById(id);
    res.status(httpStatus.NO_CONTENT).send();
});

/* ------------------------------- Exports ----------------------------------- */

module.exports = {
    fetchAllSponsorships,
    fetchSponsorshipById,
    createSponsorship,
    updateSponsorship,
    deleteSponsorship,
};
