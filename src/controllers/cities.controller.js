const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const cityService = require('../services/cities.services');
const areaService = require('../services/area.services');
const localityService = require('../services/localities.services');

/* ----------------------------- City Controllers ----------------------------- */

/**
 * Fetch all cities
 */
const fetchAllCities = catchAsync(async (req, res) => {
    const data = await cityService.getAllCities();
    res.status(httpStatus.OK).send(data);
});

/**
 * Get a single city by ID
 */
const fetchCityById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const data = await cityService.getCityById(id);
    res.status(httpStatus.OK).send(data);
});

/**
 * Add a new city
 */
const createCity = catchAsync(async (req, res) => {
      const cityData = {
    ...req.body,
    image: `/logo/${req.file?.filename|| null} ` // Safely add image filename if uploaded
  };
    const data = await cityService.createCity(cityData);
    res.status(httpStatus.CREATED).send({ message: 'City created successfully', city: data });
});

/**
 * Update city by ID
 */
const updateCity = catchAsync(async (req, res) => {
    const { id } = req.params;
      const cityData = {
    ...req.body,
    image: `/logo/${req.file?.filename|| null} ` // Safely add image filename if uploaded
  };
    const data = await cityService.updateCityById(id, cityData);
    res.status(httpStatus.OK).send({ message: 'City updated successfully', city: data });
});

/**
 * Delete city by ID
 */
const deleteCity = catchAsync(async (req, res) => {
    const { id } = req.params;
    await cityService.deleteCityById(id);
    res.status(httpStatus.NO_CONTENT).send();
});

/* ----------------------------- Area Controllers ----------------------------- */

/**
 * Fetch all areas optionally filtered by cityId
 */
const fetchAllAreas = catchAsync(async (req, res) => {
    console.log(req.query)
    const cityId = req.query.cityId;
    const data = await areaService.getAllAreas(cityId);
    res.status(httpStatus.OK).send(data);
});

/**
 * Get a single area by ID
 */
const fetchAreaById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const data = await areaService.getAreaById(id);
    res.status(httpStatus.OK).send(data);
});

/**
 * Add a new area
 */
const createArea = catchAsync(async (req, res) => {
    const data = await areaService.createArea(req.body);
    res.status(httpStatus.CREATED).send({ message: 'Area created successfully', area: data });
});

/**
 * Update area by ID
 */
const updateArea = catchAsync(async (req, res) => {
    const { id } = req.params;
    const data = await areaService.updateAreaById(id, req.body);
    res.status(httpStatus.OK).send({ message: 'Area updated successfully', area: data });
});

/**
 * Delete area by ID
 */
const deleteArea = catchAsync(async (req, res) => {
    const { id } = req.params;
    await areaService.deleteAreaById(id);
    res.status(httpStatus.NO_CONTENT).send();
});

/* -------------------------- Locality Controllers ---------------------------- */

/**
 * Fetch all localities with optional filters: cityId, areaId
 */
const fetchAllLocalities = catchAsync(async (req, res) => {
    const { cityId, areaId } = req.query;
    let filter = {};
    if (cityId) filter.city_id = cityId;
    if (areaId) filter.area_id = areaId;
    console.log(filter,"filter")

    const data = await localityService.getAllLocalities(filter);
    res.status(httpStatus.OK).send(data);
});

/**
 * Get a single locality by ID
 */
const fetchLocalityById = catchAsync(async (req, res) => {
     console.log("jdk")
    const { id } = req.params;
    console.log(req.params)

    res.status(httpStatus.OK).send("data");
});

/**
 * Add a new locality
 */
const createLocality = catchAsync(async (req, res) => {
    const data = await localityService.createlocalities(req.body);
    res.status(httpStatus.CREATED).send({ message: 'Locality created successfully', locality: data });
});

/**
 * Update locality by ID
 */
const updateLocality = catchAsync(async (req, res) => {
    const { id } = req.params;
    const data = await localityService.updateLocalityById(id, req.body);
    res.status(httpStatus.OK).send({ message: 'Locality updated successfully', locality: data });
});

/**
 * Delete locality by ID
 */
const deleteLocality = catchAsync(async (req, res) => {
    const { id } = req.params;
    await localityService.deleteLocalityById(id);
    res.status(httpStatus.NO_CONTENT).send();
});


 // Localities-Limit

const setLocalityLimit = catchAsync(async (req, res) => {
    const { locality_id, data_limit } = req.body;
    console.log(locality_id,"locality_id");
    console.log(data_limit,"data_limit")
    

      if (!locality_id || data_limit === undefined) {
        return res.status(httpStatus.BAD_REQUEST).send({
            message: 'Both locality_id and data_limit are required.',
        });
    }

    // Optional: Ensure data_limit is a number
    if (isNaN(data_limit) || data_limit < 0) {
        return res.status(httpStatus.BAD_REQUEST).send({
            message: 'data_limit must be a valid non-negative number.',
        });
    }

    // Add limit using the service
    const result = await localityService.addLocalityLimit({ locality_id, data_limit });

    // Success response
    res.status(httpStatus.CREATED).send({
        message: '🎉 Locality limit set successfully!',
        data: result,
    });
});

const getLocalityLimit = catchAsync(async (req, res) => {
    console.log("vikas calonnge")
  const data = await localityService.getAllLocalityLimits();
    res.status(httpStatus.OK).send({
        message: 'All locality limits fetched successfully.',
        limits: data,
    });
});



const updateLocalityLimit = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { locality_id, data_limit } = req.body;
    console.log(req.body)

    // Validation checks
    if (!id || !locality_id || data_limit === undefined) {
        return res.status(httpStatus.BAD_REQUEST).send({
            message: 'All fields are required: "id", "locality_id", and "data_limit".',
        });
    }

    if (Number(data_limit) < 0) {
        return res.status(httpStatus.BAD_REQUEST).send({
            message: '"data_limit" must be a number greater than or equal to 0.',
        });
    }

    // Call service function
    const updated = await localityService.updateLocalityLimit(id, { locality_id, data_limit });

    res.status(httpStatus.OK).send({
        message: '✅ Locality limit updated successfully!',
        updatedLimit: updated,
    });
});

const searchLocalitiesByPrefix =catchAsync(async(req,res)=>{
    const { name } = req.query;

  if (!name) {
    return res.status(400).json({ message: 'Query parameter "name" is required.' });
  }

  const results = await localityService.fetchFilteredLocalities(name);
  res.status(200).json({ success: true, data: results });
})


/* ------------------------------- Exports ----------------------------------- */

module.exports = {
    // Cities
    fetchAllCities,
    fetchCityById,
    createCity,
    updateCity,
    deleteCity,

    // Areas
    fetchAllAreas,
    fetchAreaById,
    createArea,
    updateArea,
    deleteArea,

    // Localities
    fetchAllLocalities,
    fetchLocalityById,
    createLocality,
    updateLocality,
    deleteLocality,

  // Localities-Limit
    setLocalityLimit,
    getLocalityLimit,
    updateLocalityLimit,
    searchLocalitiesByPrefix
};
