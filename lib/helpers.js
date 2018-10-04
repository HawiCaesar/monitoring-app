// helpers for various tasks

// container for helpers

const crypto = require('crypto');
const config = require('./config');
const querystring = require('querystring');
const https = require('https');

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

// send twilio sms
helpers.sendTwilioSMS = (phone, msg, callback) => {
	// validate the parameters
	phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
	msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;
	console.log(msg, phone, '<=====>')
	if (phone && msg) {
		//configure request payload ...check twilio docs
		const payload = {
			'From': config.Twilio.fromPhone,
			'To': `+25${phone}`,
			 'Body': msg
		}
		// stringify payload
		const stringifyPayload = querystring.stringify(payload);

		const requestDetails = {
			'protocol': 'https:',
			'hostname': 'api.twilio.com',
			'method': 'POST',
			'path': `/2010-04-01/Accounts/${config.Twilio.accountSid}/Messages.json`,
			'config': `${config.Twilio.accountSid}:${config.Twilio.authToken}`,
			'headers': {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-length': Buffer.byteLength(stringifyPayload)
			}
		}

		// configure the request details and send
		const request = https.request(requestDetails, (response) => {
			console.log(response, '<====')
			//get status
			const status = response.statusCode; 

			if (status == 200 || status == 201){
				callback(200);
			} else {
				callback(`Status code returned was ${status}`);
			}
		});

		// Bind to error event so no killing of thread 

		request.on('error', (error) => {
			callback(error)
		});

		// add payload to request
		request.write(stringifyPayload);

		// end request
		request.end();

	} else {
		callback('Given parameters were missing or invalid')
	}
}

module.exports = helpers