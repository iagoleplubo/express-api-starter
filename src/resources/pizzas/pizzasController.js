// resources/pizzas/pizzasController.js
const { validationResult } = require('express-validator');
const Pizza = require('./Pizza');
const ingredientsController = require('../ingredients/ingredientsController');

/**
 * Cree une pizza.
 * Criteres d'acceptance :
 *  - 400 si les parametres sont manquants ou du mauvais type
 *  - 409 si le nom de pizza existe deja
 *  - 422 si un ingredient n'existe pas
 * Le dialogue avec les ingredients passe par leur controleur.
 */
exports.create = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, imageUrl, price, ingredients } = req.body;

        // Le nom est l'identifiant naturel : il doit rester unique
        const existing = await Pizza.findByName(name);
        if (existing) {
            return res.status(409).json({ error: 'Pizza name already exists' });
        }

        // Tous les ingredients doivent exister avant de creer la pizza
        const { found, missing } = await ingredientsController.resolveByNames(ingredients);
        if (missing.length > 0) {
            return res.status(422).json({ error: 'Unknown ingredients', missing });
        }

        const ingredientIds = found.map((i) => i.id);
        const created = await Pizza.create({ name, imageUrl, price, ingredientIds });
        return res.status(201).json(created);
    } catch (err) {
        next(err);
    }
};

// Liste les pizzas avec leurs ingredients
exports.findAll = async (req, res, next) => {
    try {
        const pizzas = await Pizza.findAll();
        return res.status(200).json(pizzas);
    } catch (err) {
        next(err);
    }
};

// Retourne une pizza et ses ingredients, 404 si introuvable
exports.findOne = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid pizza id' });

        const pizza = await Pizza.findById(id);
        if (!pizza) return res.status(404).json({ error: 'Pizza not found' });

        return res.status(200).json(pizza);
    } catch (err) {
        next(err);
    }
};

// Met a jour une pizza, y compris sa liste d'ingredients
exports.update = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const id = Number(req.params.id);
        if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid pizza id' });

        const { name, imageUrl, price, ingredients } = req.body;

        // Le nouveau nom ne doit pas appartenir a une autre pizza
        if (name) {
            const existing = await Pizza.findByName(name);
            if (existing && existing.id !== id) {
                return res.status(409).json({ error: 'Pizza name already exists' });
            }
        }

        // Si des ingredients sont fournis, ils doivent tous exister
        let ingredientIds;
        if (ingredients) {
            const { found, missing } = await ingredientsController.resolveByNames(ingredients);
            if (missing.length > 0) {
                return res.status(422).json({ error: 'Unknown ingredients', missing });
            }
            ingredientIds = found.map((i) => i.id);
        }

        const updated = await Pizza.update(id, { name, imageUrl, price, ingredientIds });
        if (!updated) return res.status(404).json({ error: 'Pizza not found' });

        return res.status(200).json(updated);
    } catch (err) {
        next(err);
    }
};

// Supprime une pizza (les liaisons partent en cascade)
exports.delete = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid pizza id' });

        const deleted = await Pizza.delete(id);
        if (deleted === 0) return res.status(404).json({ error: 'Pizza not found' });

        return res.status(204).send();
    } catch (err) {
        next(err);
    }
};