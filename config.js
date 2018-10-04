// create and export config variables

// all env files

const environments = {};

//staging
environments.staging = {
	'httpPort': 3000,
	'httpsPort': 3001,
	'envName': 'staging',
	'hashingSecret': 'thisIsASecret',
	'maxCheckLimit': 5,
	'Twilio': {
		'accountSid' : 'ACe6c74428e383bc6877a5c00f4cab9a7a',
		'authToken' : '4d62fc05849026ec06e2a68e63db7694',
		'fromPhone' : '+18596666432'
	}
}

// production
environments.production = {
	'httpPort': 6000,
	'httpsPort': 6001,
	'envName': 'production',
	'hashingSecret': 'thisIsASecretAgain',
	'maxCheckLimit': 5,
	'Twilio': {
		'accountSid' : 'ACe6c74428e383bc6877a5c00f4cab9a7a',
		'authToken' : '4d62fc05849026ec06e2a68e63db7694',
		'fromPhone' : '+18596666432'
	}
}

// check which should be used

const currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// check if environment is one of the environments listed, if not staging

const environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

module.exports = environmentToExport; 