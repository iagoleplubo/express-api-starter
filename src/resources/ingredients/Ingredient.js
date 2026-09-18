// resources/ingredients/Ingredient.js
const db = require('../../config/database');

class Ingredient {
    // Insere un ingredient puis retourne la ligne creee
    static create({ name, price }) {
        const sql = `INSERT INTO ingredients (name, price, created_at, updated_at)
                     VALUES (?, ?, datetime('now'), datetime('now'))`;
        const params = [name, price];

        return new Promise((resolve, reject) => {
            db.run(sql, params, function (err) {
                if (err) return reject(err);
                Ingredient.findById(this.lastID).then(resolve).catch(reject);
            });
        });
    }

    static findAll() {
        const sql = `SELECT * FROM ingredients ORDER BY id DESC`;
        return new Promise((resolve, reject) => {
            db.all(sql, [], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }

    static findById(id) {
        const sql = `SELECT * FROM ingredients WHERE id = ?`;
        return new Promise((resolve, reject) => {
            db.get(sql, [id], (err, row) => {
                if (err) return reject(err);
                resolve(row || null);
            });
        });
    }

    // Recherche plusieurs ingredients par leurs noms
    // Sert a verifier que tous les ingredients d'une pizza existent
    static findByNames(names = []) {
        if (names.length === 0) return Promise.resolve([]);
        const placeholders = names.map(() => '?').join(', ');
        const sql = `SELECT * FROM ingredients WHERE name IN (${placeholders})`;

        return new Promise((resolve, reject) => {
            db.all(sql, names, (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }

    // COALESCE garde la valeur existante si le champ n'est pas fourni
    static update(id, { name, price }) {
        const sql = `
      UPDATE ingredients
      SET name = COALESCE(?, name),
          price = COALESCE(?, price),
          updated_at = datetime('now')
      WHERE id = ?
    `;
        const params = [name, price, id];

        return new Promise((resolve, reject) => {
            db.run(sql, params, function (err) {
                if (err) return reject(err);
                if (this.changes === 0) return resolve(null);
                Ingredient.findById(id).then(resolve).catch(reject);
            });
        });
    }

    // Retourne le nombre de lignes supprimees (0 si introuvable)
    static delete(id) {
        const sql = `DELETE FROM ingredients WHERE id = ?`;
        return new Promise((resolve, reject) => {
            db.run(sql, [id], function (err) {
                if (err) return reject(err);
                resolve(this.changes);
            });
        });
    }
}

module.exports = Ingredient;