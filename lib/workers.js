/**
 * worker related tasks
 */


 // Dependencies
 const path = require('path');
 const fs = require('fs');
 const _data = require('./data');
 const http = require('http');
 const https =  require('https');
 const helpers =  require('./helpers');

 const workers = {};

 // Timer to execute the worker-proccess once per minutes

 workers.loop = () => {
   setInterval(() => {
    workers.gatherAllChecks();
   }, 1000 * 60)
 }

 workers.gatherAllChecks = () => {
   
 }

 workers.init = function(){
  // execute all checks immediately
  workers.gatherAllChecks();

  // Call the loop so that the checks get executed later on.
  workers.loop();
 }

 module.exports = workers;