// resources/pizzas/Pizza.js
const db = require('../../config/database');

class Pizza {
    // Cree la pizza puis ses liaisons avec les ingredients
    static create({ name, imageUrl, price, ingredientIds = [] }) {
        const sql = `INSERT INTO pizzas (name, imageUrl, price, created_at, updated_at)
                     VALUES (?, ?, ?, datetime('now'), datetime('now'))`;
        const params = [name, imageUrl || null, price];

        return new Promise((resolve, reject) => {
            db.run(sql, params, function (err) {
                if (err) return reject(err);
                const pizzaId = this.lastID;
                Pizza.setIngredients(pizzaId, ingredientIds)
                    .then(() => Pizza.findById(pizzaId))
                    .then(resolve)
                    .catch(reject);
            });
        });
    }

    // Remplace les liaisons de la pizza par la liste fournie
    static setIngredients(pizzaId, ingredientIds = []) {
        return new Promise((resolve, reject) => {
            db.run(`DELETE FROM pizzas_ingredients WHERE pizza_id = ?`, [pizzaId], (err) => {
                if (err) return reject(err);
                if (ingredientIds.length === 0) return resolve();

                const stmt = db.prepare(`INSERT INTO pizzas_ingredients (pizza_id, ingredient_id) VALUES (?, ?)`);
                for (const ingredientId of ingredientIds) {
                    stmt.run([pizzaId, ingredientId]);
                }
                stmt.finalize((err) => (err ? reject(err) : resolve()));
            });
        });
    }

    // Recupere les ingredients lies a une pizza
    static findIngredients(pizzaId) {
        const sql = `
            SELECT i.* FROM ingredients i
            JOIN pizzas_ingredients pi ON pi.ingredient_id = i.id
            WHERE pi.pizza_id = ?
        `;
        return new Promise((resolve, reject) => {
            db.all(sql, [pizzaId], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }

    static findAll() {
        const sql = `SELECT * FROM pizzas ORDER BY id DESC`;
        return new Promise((resolve, reject) => {
            db.all(sql, [], async (err, rows) => {
                if (err) return reject(err);
                try {
                    // Attache les ingredients a chaque pizza
                    for (const row of rows) {
                        row.ingredients = await Pizza.findIngredients(row.id);
                    }
                    resolve(rows);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    static findById(id) {
        const sql = `SELECT * FROM pizzas WHERE id = ?`;
        return new Promise((resolve, reject) => {
            db.get(sql, [id], async (err, row) => {
                if (err) return reject(err);
                if (!row) return resolve(null);
                try {
                    row.ingredients = await Pizza.findIngredients(row.id);
                    resolve(row);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    // Verifie l'unicite du nom (critere d'acceptance)
    static findByName(name) {
        const sql = `SELECT * FROM pizzas WHERE name = ?`;
        return new Promise((resolve, reject) => {
            db.get(sql, [name], (err, row) => {
                if (err) return reject(err);
                resolve(row || null);
            });
        });
    }

    static update(id, { name, imageUrl, price, ingredientIds }) {
        const sql = `
      UPDATE pizzas
      SET name = COALESCE(?, name),
          imageUrl = COALESCE(?, imageUrl),
          price = COALESCE(?, price),
          updated_at = datetime('now')
      WHERE id = ?
    `;
        const params = [name, imageUrl, price, id];

        return new Promise((resolve, reject) => {
            db.run(sql, params, function (err) {
                if (err) return reject(err);
                if (this.changes === 0) return resolve(null);

                const next = ingredientIds
                    ? Pizza.setIngredients(id, ingredientIds)
                    : Promise.resolve();

                next.then(() => Pizza.findById(id)).then(resolve).catch(reject);
            });
        });
    }

    static delete(id) {
        const sql = `DELETE FROM pizzas WHERE id = ?`;
        return new Promise((resolve, reject) => {
            db.run(sql, [id], function (err) {
                if (err) return reject(err);
                resolve(this.changes);
            });
        });
    }
}

module.exports = Pizza;