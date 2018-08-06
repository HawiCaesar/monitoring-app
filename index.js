// Entry point

const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {

	// GET url and parse it
	const parsedURL = url.parse(req.url, true);

	// get path , want user to get /foo resource even if they typed /foo or /foo/
	const trimmedPath = parsedURL.pathname.replace(/^\/+|\/+$/g, '');

	// get query string as object

	const queryStringObj = parsedURL.query;

	// GET http method
	const method = req.method.toLowerCase();

	// send the response
	res.end("Hello World with update\n");

	//log the request
	console.log(`Requested Path ${trimmedPath}, ${method} with parameterszz`);
	console.log(queryStringObj);
});

server.listen(8000, () => {
	console.log("server is listening...");
})