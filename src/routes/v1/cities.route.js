const express = require('express');
const citiesController = require('../../controllers/cities.controller')
const auth =require('../../middlewares/auth')

const router = express.Router();

router.route('/cities')
    .get(citiesController.fetchAllCities)
    .post(auth,citiesController.createCity);

router.route('/cities/:id')
    .get(citiesController.fetchCityById)
    .put(auth,citiesController.updateCity)
    .delete(auth,citiesController.deleteCity);


    
router.route('/areas')
    .get(citiesController.fetchAllAreas)
    .post(auth,citiesController.createArea);

router.route('/areas/:id')
    .get(citiesController.fetchAreaById)
    .put(auth,citiesController.updateArea)
    .delete(auth,citiesController.deleteArea);

router.route('/localities')
    .get(citiesController.fetchAllLocalities)
    .post(auth,citiesController.createLocality);

router.route('/localities/:id')
  .get(citiesController.fetchLocalityById)
  .put(auth, citiesController.updateLocality)
  .delete(auth, citiesController.deleteLocality);

router.route('/setlocalities/limit')
  .post(citiesController.setLocalityLimit)
  .get(citiesController.getLocalityLimit);

router.route('/setlocalities/limit/:id')
  .put(citiesController.updateLocalityLimit);


module.exports = router;