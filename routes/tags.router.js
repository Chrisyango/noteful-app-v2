'use strict';

const express = require('express');
const router = express.Router();
const knex = require('../knex');
const {UNIQUE_VIOLATION} = require('pg-error-constants');

// Get All (and search by query)
/* ========== GET/READ ALL TAGS ========== */
router.get('/tags', (req, res, next) => {

  knex.select()
    .from('tags')
    .debug(true)
    .then(list => {
      return res.json(list);
    })
    .catch( err => next( err ) );
});

/* ========== GET/READ SINGLE FOLDERS ========== */
router.get('/tags/:id', (req, res, next) => {
  const foldersId = req.params.id;

  knex.select()
    .from('tags')
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
router.put('/tags/:id', (req, res, next) => {
  const tagsId = req.params.id;
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

  knex('tags')
    .where({id: tagsId})
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
    })
    .catch(err => {
      if (err.code === UNIQUE_VIOLATION && err.constraint === 'tags_name_key') {
        err = new Error('Tags name is already taken');
        err.status = 409;
      }
      next(err);
    });
});


/* ========== POST/CREATE ITEM ========== */
router.post('/tags', (req, res, next) => {
  const { name } = req.body;
  
  const newItem = { name };
  /***** Never trust users - validate input *****/
  if (!newItem.name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  knex('tags')
    .insert(newItem)
    .debug(true)
    .then(item => {
      if (item) {
        res.location(`http://${req.headers.host}/tags/${item.id}`).status(201).json(item);
      }
    })
    .catch(err => {
      if (err.code === UNIQUE_VIOLATION && err.constraint === 'tags_name_key') {
        err = new Error('Tags name is already taken');
        err.status = 409;
      }
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/tags/:id', (req, res, next) => {
  const id = req.params.id;

  knex('tags')
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