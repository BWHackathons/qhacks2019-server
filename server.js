var express = require('express');
var morgan = require('morgan');
var serveStatic = require('serve-static');
var bodyParser = require('body-parser');
var fs = require('fs');
var path_module = require('path');
var _ = require("lodash");
var sqlite = require("sqlite3");

const PORT = 80; //443 for HTTPS


var db = new sqlite.Database("Konvoi.sqlite", (err) => {
	if(err){
		console.log("DB.RIP = TRUE");
		process.exit(1);
	}

	db.serialize(() => {
		db.run("CREATE TABLE `groups` ( `groupId` TEXT NOT NULL UNIQUE, `destAddr` TEXT NOT NULL, PRIMARY KEY(`groupId`) )");
		db.run("CREATE TABLE `users` ( `userId` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE, `group` TEXT, `type` INTEGER NOT NULL, `bitmojiId` TEXT, FOREIGN KEY (`group`) references groups(`groupId`) )");
	});

	console.log("DB Connection Succeeded");
});

var httpApp = express();
httpApp.set('port', process.env.PORT || PORT);
httpApp.use(morgan("dev"));
httpApp.use(bodyParser.json());
httpApp.use(bodyParser.urlencoded({extended:true}));

var httpServer = httpApp.listen(httpApp.get('port'), () =>
{
	console.log("Express HTTP server listening on port " + httpApp.get('port'));

	httpApp.all("/groups/create", (req, res) => {

	});
});


// when we're dying, clean up
process.on('exit', (code) => {
	db.close();
});