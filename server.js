var express = require('express');
var morgan = require('morgan');
var serveStatic = require('serve-static');
var bodyParser = require('body-parser');
var fs = require('fs');
var path_module = require('path');
var _ = require("lodash");
var sqlite = require("sqlite3");
var cookieParser = require("cookie-parser");

var helpers = require("./modules/helpers");
var sapi = require("./modules/sapi");
var sauth = require("./modules/spotifyAuth");

var appkeys = require("./private/keys");

const PORT = 80; //443 for HTTPS

var db = new sqlite.Database("Konvoi.sqlite", (err) => {
	if(err){
		console.log("DB.RIP = TRUE");
		process.exit(1);
	}

	db.serialize(() => {
		db.run("CREATE TABLE IF NOT EXISTS `groups` ( `groupId` TEXT NOT NULL UNIQUE, `destAddr` TEXT, PRIMARY KEY(`groupId`) )");
		db.run("CREATE TABLE IF NOT EXISTS `users` ( `userId` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE, `group` TEXT, `type` INTEGER NOT NULL, `bitmojiId` TEXT, FOREIGN KEY (`group`) references groups(`groupId`) )");
	});

	console.log("DB Connection Succeeded");
});

var httpApp = express();
httpApp.set('port', process.env.PORT || PORT);
httpApp.use(morgan("dev"));
httpApp.use(bodyParser.json());
httpApp.use(bodyParser.urlencoded({extended:true}));
httpApp.use(cookieParser())

var httpServer = httpApp.listen(httpApp.get('port'), () =>
{
	console.log("Express HTTP server listening on port " + httpApp.get('port'));

	sauth.init(httpApp, appkeys);

	httpApp.all("/groups/create", (req, res) => {
		let code = helpers.generateCode();
		console.log(code);
		db.serialize(() => {
			db.run("INSERT INTO groups(groupId) VALUES (?)", [code], (err) => {
				if(err){
					console.log(err);
					res.sendStatus(500);
				}else{
					res.status(201).send(code);
				}
			});
		});
	});

	httpApp.all("/groups/join/:code", (req, res) => {
		db.serialize(() => {
			db.all("SELECT * FROM users WHERE `group`=?", [req.params.code], (err, rows) => {
				if(err){
					console.log(err);
					res.sendStatus(500);
				}else{
					let type = (rows.length == 0); //user type 0 is passenger, 1 is driver
					db.run("INSERT INTO users(`group`, `type`) VALUES (?, ?)", [req.params.code, type], (err) => {
						if(err){
							console.log(err);
							res.sendStatus(400);
						}else{
							db.get("SELECT * FROM users ORDER BY `userId` DESC LIMIT 1", (err, row) => {
								if(err){
									console.log(err);
									res.sendStatus(500);
								}else{
									console.log(row);
									res.status(200).send(JSON.stringify(row));
								}
							});	
						}
					});
				}
			});
		});
	});

	httpApp.all("/user/:userId/")

});


// when we're dying, clean up
process.on('exit', (code) => {
	db.close();
});