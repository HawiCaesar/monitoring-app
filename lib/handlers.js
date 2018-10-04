const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');

// request handlers
const handlers = {};

handlers.ping = (data, callback) => {
	//callback a http status code and payload object
	callback(200);
};

handlers.users = (data, callback) => {
	const acceptableMethods = ['post', 'get', 'put', 'delete'];

	if (acceptableMethods.indexOf(data.method) > -1)  {
		handlers._users[data.method](data, callback);
	} else {
		callback(405);
	}
};

// user sub methods
handlers._users = {}

// users - post
// required - firstname, lastname, phone, password, tosAgreement
handlers._users.post = (data, callback) => {
	// check all fields are field out
	const firstName =  typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
	const lastName =  typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
	const phone =  typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
	const password =  typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
	const tosAgreement =  typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true  : false;

	if (firstName && lastName && phone && password && tosAgreement) {
		// no duplicate phone numbers
		_data.read('users', phone, (err, data) => {
			if (err) { // this is good, file does not exist
				// hash password
				const hashedPassword =  helpers.hash(password);

				if (hashedPassword) {
					const userObject = {
						firstName,
						lastName,
						phone,
						hashedPassword,
						tosAgreement:  true 
					}

					// store user
					_data.create('users', phone, userObject, (err) => {
						if (!err) {
							callback(200);
						} else {
							console.log(err);
							callback(500, {'Error': 'Could not create new user'});
						}
					});
				} else {
					callback(500, {'Error': 'Could not hash password'});
				}

			} else{
				// users with phone number exists
				callback(409, {'Error': 'Phone number already exists'}); 
			}
		});
	}  else {
		callback(400, {'Error': 'Missing required field'});
	}
};

// users - get
// required - phone
handlers._users.get = (data, callback) => {
	// check phone is valid
	const phone = typeof(data.queryStringObj.phone) == 'string' && data.queryStringObj.phone.trim().length == 10 ? data.queryStringObj.phone.trim() : false;
	if (phone) {
		//get tokens from headers
		const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

		//verify token is for given users
		handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
			if (tokenIsValid) {
				_data.read('users', phone, (err, readData) => {
					if (!err && readData) {
						// removed hashed passowrd from user object.
						delete readData.hashedPassword;
						callback(200, readData)
					} else {
						callback(404);
					}
				});
			} else {
				callback(403, {'Error': 'Missing required token in header or token is invalid'});
			}
		});
	} else {
		callback(400, {'Error': 'Missing required field'});
	}
};	

// users - put
// required phone
// optional data firstname, lastname, tosAgreement
handlers._users.put = (data, callback) => {
 //only let an auth user update their own object and nobody elses

	 // check for required field
	const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

	// check for optional fields
	const firstName =  typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
	const lastName =  typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
	const password =  typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

	// Error if phone is invalid in all cases
	if (phone) {

		//get tokens from headers
		const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

		//verify token is for given users
		handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
			if (tokenIsValid) {

				if (firstName || lastName || password) {
						//check if user exists
						_data.read('users', phone, (err, userData) => {
							if (!err && userData) {
								// update necessary fields

								if (firstName) {
									userData.firstName = firstName;
								}

								if (lastName) {
									userData.lastName = lastName;
								}

								if (password) {
									userData.hashedPassword = helpers.hash(password);
								}

								// store new updates
								_data.update('users', phone, userData, (err) => {
									if(!err) {
										callback(200);
										console.log('Updated!!')
									} else {
										callback(500, {'Error': 'Error updating contents'})
									}
								});


							} else {
								callback(400, {'Error': 'User does not exist'});
							}
						});
				} else {
					callback(400, {'Error': 'Missing fields to update'});
				}

			} else {
				callback(403, {'Error': 'Missing required token in header or token is invalid'});
			}
		});	

	} else {
		callback(400, {'Error': 'Missing required field'});
	}
};

// users - delete
// required phone
handlers._users.delete = (data, callback) => {
	const phone = typeof(data.queryStringObj.phone) == 'string' && data.queryStringObj.phone.trim().length == 10 ? data.queryStringObj.phone.trim() : false;
	if (phone) {

		//get tokens from headers
		const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

		//verify token is for given users
		handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
			if (tokenIsValid) {
				_data.read('users', phone, (err, readData) => {
					if (!err && readData) {
						_data.delete('users', phone, (err) => {
							if(!err) {

								//delete associated checks
								const userChecks = typeof(readData.checks) == 'object' && readData.checks instanceof Array ? readData.checks : [];
								checksToDelete = userChecks.length;

								if (checksToDelete > 0) {
									let checksDeleted = 0;
									let deletionErrors = false;

									userChecks.forEach((checkId) => {

										_data.delete('checks', checkId, (err) => {
											if(err) {
												deletionErrors = true;
											} 

											checksDeleted++;
											if (checksDeleted == checksToDelete) {
												if (!deletionErrors) {
													callback(200, {'Sucess': 'User and associated data deleted'});
												} else {
													callback(500, {"Error": "Could not delete checks associated to user, some checks could not exist"});
												}
											}

										});
									});
									
								} else {
									callback(200);
								}

							} else {
								callback(500, {"Error": "Could not delete specified user"});
							}
						});
					} else {
						callback(400, {'Error': 'Could not find specified user'});
					}
				});
			} else {
				callback(403, {'Error': 'Missing required token in header or token is invalid'});
			}
		});

	} else {
		callback(400, {'Error': 'Missing required field'});
	}
};


handlers.tokens = (data, callback) => {
	const acceptableMethods = ['post', 'get', 'put', 'delete'];

	if (acceptableMethods.indexOf(data.method) > -1)  {
		handlers._tokens[data.method](data, callback);
	} else {
		callback(405);
	}
};

handlers._tokens = {};

// required -  phone, password
handlers._tokens.post = (data, callback) => {
	const phone =  typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
	const password =  typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
	
	if (phone && password) {
		// find user who matches phone number
		_data.read('users',  phone, (err, userData) => {
			if (!err && userData) {
				// hash sent password, compare it with what is stored
				const hashedPassword =  helpers.hash(password);

				if(hashedPassword === userData.hashedPassword) {
					// create token with random name and expiration 1hour

					const tokenId = helpers.createRandomString(20);
					const expires = Date.now() + 1000 * 60 * 60;

					const tokenObj = {
						'phone': phone,
						'id': tokenId,
						'expires': expires
					}

					_data.create('tokens', tokenId, tokenObj, (err) => {
						if (!err) {
							callback(200, tokenObj);
						} else {
							callback(500, {'Error': 'Could not create new token'});
						}
					})

				} else {
					callback(400, {'Error': 'Incorrect credentials'});
				}

			} else {
				callback(400, {'Error': 'Could not find the specified user'});
			}
		});
	} else {
		callback(400, {'Error': 'Missing required fields'});
	}

}

// required - id
handlers._tokens.get = (data, callback) => {
	// check that id is valid

	const id = typeof(data.queryStringObj.id) == 'string' && data.queryStringObj.id.trim().length == 20 ? data.queryStringObj.id.trim() : false;
	if (id) {
		_data.read('tokens', id, (err, tokenData) => {
			if (!err && tokenData) {
				callback(200, tokenData)
			} else {
				callback(404);
			}
		});
	} else {
		callback(400, {'Error': 'No such token exists'});
	}

}

// required - id, extend. Allow user to continue with token
handlers._tokens.put = (data, callback) => {
	const id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
	const extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ?  data.payload.extend : false;
	if (id) {
		_data.read('tokens', id, (err, tokenData) => {
			if (!err && tokenData) {

				if (tokenData.expires > Date.now()) {
					tokenData.expires = Date.now() + 1000 * 60 * 60;
				} else {
					callback(400, {'Error': 'Token has already expired and cannot be extended'});
				}

				// store new updates
				_data.update('tokens', id, tokenData, (err) => {
					if(!err) {
						callback(200, tokenData);
					} else {
						callback(500, {'Error': 'Error updating token\'s expiration'});
					}
				});

			} else {
				callback(404, {'Error': 'Token does not exist'});
			}
		});
	} else {
		callback(400, {'Error': 'Missing required field(s) or invalid fields'});
	}
}

// required data is id
handlers._tokens.delete = (data, callback) => {
	const id = typeof(data.queryStringObj.id) == 'string' && data.queryStringObj.id.trim().length == 20 ? data.queryStringObj.id.trim() : false;
	if (id) {
		_data.read('tokens', id, (err, tokenData) => {
			if (!err && tokenData) {
				_data.delete('tokens', id, (err) => {
					if(!err) {
						callback(200);
					} else {
						callback(500, {"Error": "Could not delete specified token"});
					}
				});
			} else {
				callback(404, {'Error': 'Could not find specified token'});
			}
		});
	} else {
		callback(400, {'Error': 'Missing required field'});
	}
}

handlers._tokens.verifyToken = (id, phone, callback) => {
	_data.read('tokens', id, (err, tokenData) => {
			if (!err && tokenData) {
				if (tokenData.phone == phone && tokenData.expires > Date.now()) {
					callback(true);
				} else{
					callback(false);
				}
				
			} else {
				callback(false);
			}
	});
}


handlers.checks = (data, callback) => {
	const acceptableMethods = ['post', 'get', 'put', 'delete'];

	if (acceptableMethods.indexOf(data.method) > -1)  {
		handlers._checks[data.method](data, callback);
	} else {
		callback(405);
	}
};

handlers._checks = {};

// required: protocol, url, method, successCodes, timeoutSeconds
// optional: none
handlers._checks.post = (data, callback) => {
	const protocol =  typeof(data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
	const url =  typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
	const method =  typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > 0 ? data.payload.method : false;
	const successCodes =  typeof(data.payload.successCodes) == 'object' && data.payload.successCodes.length > 0 && data.payload.successCodes instanceof Array ? data.payload.successCodes : false;
	const timeOutSeconds =  typeof(data.payload.timeOutSeconds) == 'number' && data.payload.timeOutSeconds % 1 === 0 && data.payload.timeOutSeconds <= 5 ? data.payload.timeOutSeconds : false;

	if (protocol && url && method && successCodes && timeOutSeconds) {
		//get tokens from headers
		const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

		//Look up user token
		_data.read('tokens', token, (err, tokenData) => {
			if (!err && tokenData) {
				const userPhone = tokenData.phone;

				//look up user
				_data.read('users', userPhone, (err, userData) => {
					if (!err && userData) {
						const userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : []; 

						//verify user has less than max number of checks
						if (userChecks.length < config.maxCheckLimit) {
							//create random id for check 
							const checkId = helpers.createRandomString(20);

							// create check object and include users phone
							const checkObj = {
								'id': checkId,
								userPhone,
								protocol,
								'url': url,
								'method': method,
								'successCodes': successCodes,
								'timeOutSeconds': timeOutSeconds
							}

							_data.create('checks', checkId, checkObj, (err) => {
								if (!err) {
									// add check id to user object
									userData.checks = userChecks;
									userData.checks.push(checkId);

									_data.update('users', userPhone, userData, (err) => {
										if (!err) {
											callback(200, checkObj);
										} else{
											callback(500, {'Error': 'Could not update user with new check'})
										}
									});

								} else {
									callback(500, {'Error': 'Could not create new check'});
								}
							});
						} else {
							callback(400, {'Error': `The user already has the ,maximum number of checks (max: ${config.maxCheckLimit})`});
						}

					} else {
						callback(403);
					}
				});
			} else {
				callback(403);
			}
		});
	} else {
		callback(400,  {'Error': 'Missing required inputs or input are invalid'});
	}
}

// checks - get
// required: id
// optional: none
handlers._checks.get = (data, callback) => {
	// check phone is valid
	const id = typeof(data.queryStringObj.id) == 'string' && data.queryStringObj.id.trim().length == 20 ? data.queryStringObj.id.trim() : false;
	if (id) {
		// Look up checks id

		_data.read('checks', id, (err, checkData) => {
			if (!err && checkData) {
				//get tokens from headers
				const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

				//verify token is for given users for belongs to user who created check
				handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
					if (tokenIsValid) {
						// return checkData

						callback(200, checkData);
					} else {
						callback(403, {'Error': 'Missing required token in header or token is invalid'});
					}
				});
			} else {
				callback(404);
			}
		});
	} else {
		callback(400, {'Error': 'Missing required field'});
	}
};

//checks - put
// required: id
// optional: all other data

handlers._checks.put = (data, callback) => {
	//only let an auth user update their own object and nobody elses

	 // check for required field
	const id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;

	// check for optional fields
	const protocol =  typeof(data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
	const url =  typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
	const method =  typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > 0 ? data.payload.method : false;
	const successCodes =  typeof(data.payload.successCodes) == 'object' && data.payload.successCodes.length > 0 && data.payload.successCodes instanceof Array ? data.payload.successCodes : false;
	const timeOutSeconds =  typeof(data.payload.timeOutSeconds) == 'number' && data.payload.timeOutSeconds % 1 === 0 && data.payload.timeOutSeconds <= 5 ? data.payload.timeOutSeconds : false;

	// Error if phone is invalid in all cases
	if (id) {
		if (protocol || url || method || successCodes || timeOutSeconds) {
			//check if check exists
			_data.read('checks', id, (err, checkData) => {
				if (!err && checkData) {
					const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

					//verify token is for given users for belongs to user who created check
					handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
						if (tokenIsValid) {
							// update necessary fields

							if (protocol) {
								checkData.protocol = protocol;
							}

							if (url) {
								checkData.url = url;
							}

							if (method) {
								checkData.method = method;
							}

							if (successCodes) {
								checkData.successCodes = successCodes;
							}

							if (timeOutSeconds) {
								checkData.timeOutSeconds = timeOutSeconds;
							}

							// store new updates
							_data.update('checks', id, checkData, (err) => {
								if(!err) {
									callback(200, {'Sucess': `${id} has been updated`});
									console.log('Updated check!')
								} else {
									callback(500, {'Error': 'Error updating contents'})
								}
							});
						} else {
							callback(403, {'Error': 'Missing required token in header or token is invalid'});
						}
					});
				} else {
					callback(400, {'Error': 'check does not exist'});
				}
			});
		} else {
			callback(400, {'Error': 'Missing fields to update'});
		}
	} else {
		callback(400, {'Error': 'Missing required field'});
	}
};


// checks - delete
// required data: id
// optional data none
handlers._checks.delete = (data, callback) => {
	const id = typeof(data.queryStringObj.id) == 'string' && data.queryStringObj.id.trim().length == 20 ? data.queryStringObj.id.trim() : false;
	if (id) {

		//look up and see if check exists
		_data.read('checks', id, (err, checkData) => {
			if (!err && checkData) {
				//get tokens from headers
				const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

				//verify token is for given users
				handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
					if (tokenIsValid) {
						_data.delete('checks', id, (err) => {
							if(!err) {

								_data.read('users', checkData.userPhone, (err, readData) => {
									if (!err && readData) {

										const userChecks = typeof(readData.checks) == 'object' && readData.checks instanceof Array ? readData.checks : []; 

										// remove deleted check from list

										checkToDelete = userChecks.indexOf(id);

										if (checkToDelete > -1) {
											userChecks.splice(checkToDelete, 1); 

											// store new updates
											_data.update('users', checkData.userPhone, readData, (err) => {
												if(!err) {
													callback(204);
													console.log(`Deleted check ${id}`);
												} else {
													callback(500, {'Error': 'Error updating User\'s contents'})
												}
											});

										} else {
											callback(500, {'Error': 'Could not find check id on user\'s object. There was an error while removing the check'});
										}

									} else {
										callback(500, {'Error': 'Could not find specified user who created check. Could remove check id'});
									}
								});

							} else {
								callback(500, {"Error": `Could not delete specified check id ${checkData.id}`});
							}
						});

					} else {
						callback(403, {'Error': 'Missing required token in header or token is invalid'});
					}
				});
			} else {
				callback(400, {'Error': 'check id does not exist'});
			}
		});
	} else {
		callback(400, {'Error': 'Missing required field'});
	}
}


//not found handler 
handlers.notFound = (data, callback) => {
	callback(404)
}; 

module.exports = handlers;


