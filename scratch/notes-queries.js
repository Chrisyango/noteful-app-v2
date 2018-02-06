'use strict';

const knex = require('../knex');

// knex.select()
//   .from('notes')
//   .debug(true)
//   .then(results => console.log(JSON.stringify(results, null, 4)))
//   .catch( err => console.log( err ) );

// knex.select()
//   .from('notes')
//   .where({id: '1005'})
//   .debug(true)
//   .then(results => console.log(JSON.stringify(results, null, 4)))
//   .catch( err => console.log( err ) );

// knex('notes')
//   .where({id: 1005})
//   .update({
//     title: 'Hello',
//     content: 'Hey it is me'
//   })
//   .debug(true)
//   .then(results => console.log(JSON.stringify(results, null, 4)))
//   .catch( err => console.log( err ) );

// knex('notes')
//   .insert({
//     title: 'Here we go again',
//     content: 'Repeat from last time'
//   })
// .debug(true)
// .then(results => console.log(JSON.stringify(results, null, 4)))
// .catch( err => console.log( err ) );

knex('notes')
  .where({id: 1005})
  .del()
  .debug(true)
  .then(results => console.log(JSON.stringify(results, null, 4)))
  .catch( err => console.log( err ) );

knex.destroy().then(() => {
  console.log('database connection closed');
});