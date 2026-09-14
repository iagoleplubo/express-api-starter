// routes/router.js
const express = require('express');
const pizzasRouter = require('../resources/pizzas/pizzasRoutes');
const ingredientsRouter = require('../resources/ingredients/ingredientsRoutes');

const router = express.Router();

router.use('/pizzas', pizzasRouter);
router.use('/ingredients', ingredientsRouter);

module.exports = router;