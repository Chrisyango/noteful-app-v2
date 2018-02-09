'use strict';

const express = require('express');
const knex = require('../knex');
const Treeize = require('treeize');

// Create an router instance (aka "mini-app")
const router = express.Router();

// TEMP: Simple In-Memory Database
/* 
const data = require('../db/notes');
const simDB = require('../db/simDB');
const notes = simDB.initialize(data);
*/

// Get All (and search by query)
/* ========== GET/READ ALL NOTES ========== */
router.get('/notes', (req, res, next) => {
  const searchTerm = req.query.searchTerm;
  const folderId = req.query.folderId;
  const tagId = req.query.tagId;

  knex.select('notes.id', 'title', 'content',
    'folder_id', 'folders.name as folder_name',
    'tags.id as tags:id', 'tags.name as tags:name')
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
    .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
    .where(function () {
      if (searchTerm) {
        this.where('title', 'like', `%${searchTerm}%`);
      }
    })
    .where(function () {
      if (folderId) {
        this.where('folder_id', folderId);
      }
    })
    .where(function () {
      if (tagId) {
        const subQuery = knex.select('notes.id')
          .from('notes')
          .innerJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
          .where('notes_tags.tag_id', tagId);
        this.whereIn('notes.id', subQuery);
      }
    })
    .orderBy('notes.id')
    .then(results => {
      const treeize = new Treeize();
      treeize.grow(results);
      const hydrated = treeize.getData();
      res.json(hydrated);
    })
    .catch(err => {
      next(err);
    });
});

/* ========== GET/READ SINGLE NOTES ========== */
router.get('/notes/:id', (req, res, next) => {
  const noteId = req.params.id;

  knex.select('notes.id', 'title', 'content',
    'folder_id', 'folders.name as folder_name',
    'tags.id as tags:id', 'tags.name as tags:name')
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
    .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
    .where({'notes.id': noteId})
    .debug(true)
    .then(items => {
      if (items) {
        const treeize = new Treeize();
        treeize.grow(items);
        const hydrated = treeize.getData();
        res.json(hydrated[0]);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/notes/:id', (req, res, next) => {
  const noteId = req.params.id;
  const { title, content, folder_id, tags } = req.body;

  /***** Never trust users. Validate input *****/
  if (!req.body.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  const updateItem = {
    title: title,
    content: content,
    folder_id: folder_id
  };

  knex('notes')
    .update(updateItem)
    .where({'id': noteId})
    .then(() => {
      return knex.del()
        .from('notes_tags')
        .where({'note_id': noteId});
    })
    .then(() => {
      const tagsInsert = tags.map(tagId => ({
        note_id: noteId,
        tag_id: tagId
      }));
      return knex('notes_tags')
        .insert(tagsInsert);
    })
    .then(() => {
      return knex.select('notes.id', 'title', 'content',
        'folder_id', 'folders.name as folder_name',
        'tags.id as tags:id', 'tags.name as tags:name')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
        .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
        .where({'note.id': noteId});
    })
    .then((result) => {
      if (result) {
        const treeize = new Treeize();
        treeize.grow(result);
        const hydrated = treeize.getData();
        res.json(hydrated[0]);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== POST/CREATE ITEM ========== */
router.post('/notes', (req, res, next) => {
  const { title, content, folder_id, tags } = req.body;
  
  const newItem = { title, content, folder_id };
  /***** Never trust users - validate input *****/
  if (!newItem.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }
  
  let noteId;

  knex('notes')
    .insert(newItem)
    .returning('id')
    .debug(true)
    .then(([id]) => {
      noteId = id;
      const tagsInsert = tags.map(tagId => ({ 
        note_id: noteId,
        tag_id: tagId 
      }));
      return knex('notes_tags')
        .insert(tagsInsert);
    })
    .then(() => {
      return knex.select('notes.id', 'title', 'content',
        'folder_id', 'folders.name as folder_name',
        'tags.id as tags:id', 'tags.name as tags:name')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
        .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
        .where({'notes.id': noteId});
    })
    .then(result => {
      if (result) {
        const treeize = new Treeize();
        treeize.grow(result);
        const hydrated = treeize.getData();
        res.location(`${req.originalUrl}/${result.id}`).status(201).json(hydrated[0]);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/notes/:id', (req, res, next) => {
  const id = req.params.id;

  knex('notes')
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