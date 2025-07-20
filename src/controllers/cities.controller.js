const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const cityService = require('../services/cities.services');
const areaService = require('../services/area.services');
const localityService = require('../services/localities.services');
const ApiError = require('../utils/ApiError');

/* ----------------------------- City Controllers ----------------------------- */

/**
 * Fetch all cities
 */
const fetchAllCities = catchAsync(async (req, res) => {
    const data = await cityService.getAllCities();
    const formattedData = data.data.map(city => ({
    ...city,
    country: "India",
    is_active:  true,
  }));
    res.status(200).json({
      success:true,
      message: "Cities retrieved successfully",
      formattedData
    })
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
  const { name } = req.body;
  const image = req.file?.filename;

  // ❌ Validate required fields
  if (!name || !image) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Name and image are required to create a city.');
  }

  // ✅ Construct full city data with image path
  const cityData = {
    ...req.body,
    image: `/logo/${image}`
  };

  // ✅ Save to DB
  const data = await cityService.createCity(cityData);

  // ✅ Send formatted success response using cityData
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'City created successfully',
    data: cityData
  });
});

/**
 * Update city by ID
 */
const updateCity = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const image = req.file?.filename;
  // ✅ Build update payload
  const cityData = {
    ...req.body,
    image: `/logo/${image}`
  };

  // ✅ Call service to update
  await cityService.updateCityById(id, cityData);

  // ✅ Response
  res.status(200).json({
    success: true,
    message: 'City updated successfully',
    data: cityData
  });
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
    const cityId = req.query.cityId;
    if (!cityId) throw new ApiError(httpStatus.BAD_REQUEST, "City ID is required to fetch areas","City ID is required");
    const data = await areaService.getAllAreas(cityId);
      const formattedData = data?.data.map(city => ({
    ...city,
    is_active:  true,
  }));
    res.status(200).json({
        success: true,
        message: "Areas retrieved successfully",
        formattedData
    })
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
  const { name, city_id } = req.body;

  // ❌ Validate required fields
  if (!name || !city_id) {
    throw new ApiError(400, 'Name and city ID are required to create an area.',"reqired");
  }

  // ✅ Create area
  const data = await areaService.createArea(req.body);

  // ✅ Respond with formatted output
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Area created successfully',
    data: req.body
  });
});

/**
 * Update area by ID
 */

const updateArea = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, city_id } = req.body;

  // ❌ Validate required fields
  if (!name || !city_id) {
    throw new ApiError(400, 'Name and city ID are required to update an area.',"required");
  }

  // ✅ Update area
  await areaService.updateAreaById(id, req.body);

  // ✅ Respond with updated data (req.body)
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Area updated successfully',
    data: req.body
  });
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
     if (!cityId && !areaId) { throw new ApiError(httpStatus.BAD_REQUEST, "Either cityId or areaId is required","required");}
    let filter = {};
    if (cityId) filter.city_id = cityId;
    if (areaId) filter.area_id = areaId;
    const data = await localityService.getAllLocalities(filter);
    const formattedData = data.data.map(city => ({
    ...city,
    is_active:  true,
  }));
    res.status(200).json({
    success: true,
    message: "Localities retrieved successfully",
    formattedData,
  });
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
    throw new ApiError(400,'Query parameter "name" is required.',"name is required.'")
  }
  const results = await localityService.fetchFilteredLocalities(name);
  res.status(200).json({ success: true,message:"Localtities retrieved successfully", data: results });
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
