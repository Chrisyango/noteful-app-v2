'use strict';

const express = require('express');
const knex = require('../knex');

const router = express.Router();

// Get All (and search by query)
/* ========== GET/READ ALL FOLDERS ========== */
router.get('/folders', (req, res, next) => {

  knex.select()
    .from('folders')
    .debug(true)
    .then(list => {
      return res.json(list);
    })
    .catch( err => next( err ) );
});

/* ========== GET/READ SINGLE FOLDERS ========== */
router.get('/folders/:id', (req, res, next) => {
  const foldersId = req.params.id;

  knex.select()
    .from('folders')
    .where({id: foldersId})
    .debug(true)
    .then(items => {
      if (items) {
        return res.json(items[0]);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/folders/:id', (req, res, next) => {
  const foldersId = req.params.id;
  /***** Never trust users - validate input *****/
  const updateObj = {};
  const updateableFields = ['name'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      updateObj[field] = req.body[field];
    }
  });

  /***** Never trust users - validate input *****/
  if (!updateObj.name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  knex('folders')
    .where({id: foldersId})
    .update({
      name: updateObj.name,
    })
    .debug(true)
    .then(item => {
      if (item) {
        res.json(item);
      } else {
        next();
      }
    });
});


/* ========== POST/CREATE ITEM ========== */
router.post('/folders', (req, res, next) => {
  const { name } = req.body;
  
  const newItem = { name };
  /***** Never trust users - validate input *****/
  if (!newItem.name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  knex('folders')
    .insert(newItem)
    .debug(true)
    .then(item => {
      if (item) {
        res.location(`http://${req.headers.host}/folders/${item.id}`).status(201).json(item);
      }
    })
    .catch(err => next(err));
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/folders/:id', (req, res, next) => {
  const id = req.params.id;

  knex('folders')
    .where({id: id})
    .del()
    .debug(true)
    .then(count => {
      if (count) {
        res.status(204).end();
      } else {
        next();
      }
    })
    .catch(err => next(err));
});

module.exports = router;