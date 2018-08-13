// helpers for various tasks

// container for helpers

const crypto = require('crypto');
const config = require('../config');

const helpers = {};

helpers.hash = (passwordToHash) => {
	if (typeof(passwordToHash) == 'string' && passwordToHash.length > 0) {
		return crypto.createHmac('sha256', config.hashingSecret).update(passwordToHash).digest('hex');
	} 
	return false;
}

// parse to json without throwing an error.
helpers.parseJsonToObject = (str) => {
	try {
		const obj = JSON.parse(str);
		return obj;

	} catch(err) {
		return {};
	}
}

// random alphanumeric characters
helpers.createRandomString = (stringGiven) => {
	stringGiven = typeof(stringGiven) == 'number' && stringGiven > 0 ? stringGiven : false;

	if (stringGiven) {
		const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';


		let str = '';

		for ( let i = 1; i <= stringGiven; i++) {
			 // get random string from possibleCharacters

			 let randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));

			 //append to str variable

			 str+=randomCharacter;
		}

		return str;
	} 

	return false;
}

module.exports = helpers