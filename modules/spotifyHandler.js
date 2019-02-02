/* Modules */
var querystring = require('querystring');
var request = require('request');
var sapi = require('./sapi');

/* Core Functions */
function init(app, db) {
	app.all("/groups/:groupId/music/search/:query", (req, res) => {
		res.sendStatus(501);
	});

	app.all("/groups/:groupId/music/add/:song", (req, res) => {
		res.sendStatus(501);
	});

	app.all("/groups/:groupId/music/play", (req, res) => {
		db.serialize(() => {
			db.all("SELECT * FROM users WHERE `group` = ? AND `spotifyAccessToken` IS NOT NULL", [req.params.groupId], (err, rows) => {
				if(err){
					console.log(err);
					res.sendStatus(404);
				}else{

					for(let i=0; i<rows.length; i++) {
						row = rows[i];
						sapi.getDevices(row['spotifyAccessToken'], (devices) => {
							let existingPlayer = false;
							for(let j=0; j<devices.length; j++) {
								dev = devices[j];
								if(dev.is_active) {
									existingPlayer = true;
									break;
								}
							}
							if(!existingPlayer) {
								sapi.setDevice(row['spotifyAccessToken'], devices[0].id, true, (status) => {
									if(status) {
										res.sendStatus(200);
									}else{
										res.sendStatus(500);
									}
								});
							}else{
								sapi.play(row['spotifyAccessToken'], (playStatus) => {
									if(playStatus)
										res.sendStatus(200);
									else
										res.sendStatus(500);
								});
							}
						});
					}
				}
			});
			
		});
	});

	app.all("/groups/:groupId/music/pause", (req, res) => {
		db.serialize(() => {
			db.all("SELECT * FROM users WHERE `group` = ? AND `spotifyAccessToken` IS NOT NULL", [req.params.groupId], (err, rows) => {
				if(err){
					console.log(err);
					res.sendStatus(404);
				}else{

					for(let i=0; i<rows.length; i++) {
						row = rows[i];
						sapi.getDevices(row['spotifyAccessToken'], (devices) => {
							let existingPlayer = false;
							for(let j=0; j<devices.length; j++) {
								dev = devices[j];
								if(dev.is_active) {
									existingPlayer = true;
									break;
								}
							}
							if(existingPlayer) {
								console.log("")
								sapi.pause(row['spotifyAccessToken'], (pauseStatus) => {
									if(pauseStatus)
										res.sendStatus(200);
									else
										res.sendStatus(500);
								});
							}else{
								res.sendStatus(200);
							}
						});
					}
				}
			});
			
		});
	});
}

module.exports = {
	init
};