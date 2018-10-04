// library for storing and editing data

const fs =  require('fs');
const path =  require('path');
const helpers = require('./helpers');

const lib = {};

// base directory of data
lib.baseDir = path.join(__dirname, '/../.data/')

lib.create = (dir, file, data, callback) => {
	//open file for writing

	fs.open(lib.baseDir+dir+'/'+file+'.json', 'wx', (err, fileDescriptor) => {
		if (!err && fileDescriptor) {
			//convert data to string
			const stringData = JSON.stringify(data);

			// write to file and close
			fs.writeFile(fileDescriptor, stringData, (err) => {
				if(!err) {
					fs.close(fileDescriptor, (err) => {
						if(!err) {
							callback(false);
						} else {
							callback('Error close to new file');
						}
					});
				} else {
					callback('Error writing to new file');
				}
			});
		} else {
			callback('Could not create new file, it may already exists');
		}
	});
}

// read file
lib.read = (dir, file, callback) => {
	fs.readFile(lib.baseDir+dir+'/'+file+'.json', 'utf-8', (err, data) => {
		if (!err && data) {
			const parsedData = helpers.parseJsonToObject(data);
			callback(false, parsedData)
		} else {
			callback(err, data);
		}
		
	});
};

// update file
lib.update = (dir, file, data, callback) => {
	// open file
	fs.open(lib.baseDir+dir+'/'+file+'.json', 'r+', (err, fileDescriptor) => {
		if (!err && fileDescriptor) {
			const stringData = JSON.stringify(data);

			// Truncate content of file first
			fs.ftruncate(fileDescriptor, (err) => {
				if(!err) {
					// write to file and close it
					fs.writeFile(fileDescriptor, stringData, (err) => {
						if (!err) {
							fs.close(fileDescriptor, (err) => {
							if(!err) {
								callback(false);
							} else {
								callback('Error when closing the updated file');
							}
					});
						} else {

						}
					});

				} else {
					callback('Error when truncating file', err)
				}
			});
		} else {
			callback('Could not open file for updating, it may not exisit');
		}
	});
};

lib.delete = (dir, file, callback) => {
	//unlink, removing file from file system
	fs.unlink(lib.baseDir+dir+'/'+file+'.json', (err) => {
		if(!err) {
			callback(false);
		} else {
			callback('Error while deleting file', err)
		}
	});
};

// list all items in directory
lib.list = (dir, callback) => {
  fs.readdir(lib.baseDir+dir+'/', (error, data) => {
    if (!err && data && data.length > 0) {
      let trimmedFileNames = [];
      data.forEach((fileName) => {
        trimmedFileNames.push(fileName.replace('.json', ''));
        callback(trimmedFileNames);
      })
    } else {
      callback(err, data)
    }
  });
}

module.exports = lib; 