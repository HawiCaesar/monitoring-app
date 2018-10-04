// Entry point

const http = require('http');
const https = require('https');
const url = require('url');
const stringDecoder = require('string_decoder').StringDecoder;
const projectEnvironment = require('./config');
const fs = require('fs');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');

//@TODO remove this
helpers.sendTwilioSMS('4733806122', 'Hello!', (error) => {
	console.log('this was the error', error);
});

// instantiate http server
const httpServer = http.createServer((req, res) => {
	unifiedServer(req, res);	
});

// start server
httpServer.listen(projectEnvironment.httpPort, () => {
	console.log(`server is listening on port ${projectEnvironment.httpPort}`);
});

// instantiate https server
const httpsServerOptions = {
	'key': fs.readFileSync('./https/key.pem'),
	'cert': fs.readFileSync('./https/cert.pem')
}
const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
	unifiedServer(req, res);	
});

// start server
httpsServer.listen(projectEnvironment.httpsPort, () => {
	console.log(`server is listening on port ${projectEnvironment.httpsPort}`);
});


const unifiedServer = (req, res) => {
	// GET url and parse it
	const parsedURL = url.parse(req.url, true);

	// get path , want user to get /foo resource even if they typed /foo or /foo/
	const trimmedPath = parsedURL.pathname.replace(/^\/+|\/+$/g, '');

	// get query string as object

	const queryStringObj = parsedURL.query;

	// GET http method
	const method = req.method.toLowerCase();

	// get headers as a method
	const headers = req.headers;

	// get payload
	var decoder = new stringDecoder('utf-8');
	var buffer = '';
	req.on('data', (data) => {
		buffer += decoder.write(data);
	});

	req.on('end', () => {
		buffer += decoder.end();

		// choose the handler to pick
		var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

		//construct data object to send to handler
		var data = {
			trimmedPath,
			 queryStringObj,
			 method,
			 'headers' : headers,
			 'payload': helpers.parseJsonToObject(buffer)
		}

		// route request to the handler to specific route
		 chosenHandler(data, (statusCode, payload) => {
		 	// handler status code or default handler

		 	statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

		 	// use payload passed by user , default payload - empty object

		 	payload =  typeof(payload) == 'object' ? payload : {};

		 	//convert payload to string
		 	const payloadString = JSON.stringify(payload);

		 	console.log(`return this response ${statusCode} ${payloadString}`)

		 	res.setHeader('Content-Type', 'application/json'); 
		 	res.writeHead(statusCode); // return status code
			res.end(payloadString);
		 });

	});
}

const router = {
	'ping': handlers.ping,
	'users': handlers.users,
	'tokens': handlers.tokens,
	'checks': handlers.checks
}



