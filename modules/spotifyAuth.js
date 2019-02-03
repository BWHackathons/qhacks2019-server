/* This file based off of https://github.com/spotify/web-api-auth-examples/blob/master/authorization_code/app.js */

/* Modules */
var querystring = require('querystring');
var request = require('request');
var sapi = require('./sapi')

/* Constants */
const SCOPE = "user-read-private user-read-email user-read-playback-state user-modify-playback-state playlist-modify-private";
const STATEKEY = "konvoi_auth_state";
const CALLBACK_PATH = "/users/spotify/callback";

/* Module Globals */
var access_tokens = {};
var refresh_tokens = {};

var stateMap = {};

/* Core Functions */

function init(app, appkeys, db)
{
		var REDIRECT_URI = "http://10.217.11.57" + CALLBACK_PATH;
		app.get('/users/:id/spotify/login', function(req, res) {
				var state = generateRandomString(16);
				stateMap[state] = req.params.id;
				res.cookie(STATEKEY, state);

				console.log("Starting Spotify Auth for " + state);

				// your application requests authorization
				res.redirect('https://accounts.spotify.com/authorize?' +
						querystring.stringify({
								response_type: 'code',
								client_id: appkeys['spotify_client_id'],
								scope: SCOPE,
								redirect_uri: REDIRECT_URI,
								state: state
						}));
		});

		app.get(CALLBACK_PATH, function(req, res) {

			// your application requests refresh and access tokens
			// after checking the state parameter

			var code = req.query.code || null;
			var state = req.query.state || null;
			var storedState = req.cookies ? req.cookies[STATEKEY] : null;

			console.log("Received callback for " + state);
			console.log("Saved state is " + storedState);

			if (state === null || state !== storedState) {
				console.log("State Mismatch!");
				res.redirect('/#' +
					querystring.stringify({
						error: 'state_mismatch'
					}));
			} else {
				//res.clearCookie(STATEKEY);
				var authOptions = {
					url: 'https://accounts.spotify.com/api/token',
					form: {
						code: code,
						redirect_uri: REDIRECT_URI,
						grant_type: 'authorization_code'
					},
					headers: {
						'Authorization': 'Basic ' + (new Buffer(appkeys['spotify_client_id'] + ':' + appkeys['spotify_secret']).toString('base64'))
					},
					json: true
				};

				request.post(authOptions, function(error, response, body) {
					if (!error && response.statusCode === 200) {

						var access_token = body.access_token,
								refresh_token = body.refresh_token;

						var options = {
							url: 'https://api.spotify.com/v1/me',
							headers: { 'Authorization': 'Bearer ' + access_token },
							json: true
						};

						// use the access token to access the Spotify Web API
						request.get(options, function(error, response, fullUserData) {
							db.serialize(() => {
								db.get("SELECT `group` FROM users WHERE `userId` = ?", [stateMap[state]], (err, userData) => {
									if(err){
										console.log(err);
										res.sendStatus(400);
									}else{
										db.all("SELECT * FROM users WHERE `group` = ? AND `spotifyAccessToken` IS NOT NULL", [userData['group']], (err, rows) => {
											if(err){
												console.log(err);
												res.sendStatus(500);
											}else{
												db.run("UPDATE users SET `spotifyAccessToken` = ?, `spotifyRefreshToken` = ? WHERE `userId` = ?", [access_token, refresh_token, stateMap[state]], (err) => {
													if(err){
														console.log(err);
														res.sendStatus(500);
														return;
													}
												});

												if(rows.length == 0) {
													sapi.createPlaylist(access_token, fullUserData.id, userData['group'], (playlistId) => {
														if(playlistId != null) {
															db.run("UPDATE groups SET `ownerAccessToken` = ?, `ownerRefreshToken` = ?, `ownerSpotifyId` = ?, `spotifyPlaylistId` = ? WHERE `groupId` = ?", [access_token, refresh_token, fullUserData.id, playlistId, userData['group']], (err) => {
																delete stateMap[state];
																if(err){
																	console.log(err);
																	res.sendStatus(500);
																}else{
																	res.redirect('/users/spotify/success');
																}
															});
														}else{
															res.sendStatus(500);
														}
													});
													
												}else{
													res.redirect('/users/spotify/success');
												}
											}
										});
										
									}
								});
							});
						});	
					} else {
						res.redirect('/#' +
							querystring.stringify({
								error: 'invalid_token'
							}));
					}
				});
			}
		});

		app.get('/users/spotify/refresh_token', function(req, res) {

			// requesting access token from refresh token
			var refresh_token = req.query.refresh_token;
			var authOptions = {
				url: 'https://accounts.spotify.com/api/token',
				headers: { 'Authorization': 'Basic ' + (new Buffer(appkeys['spotify_client_id'] + ':' + appkeys['spotify_secret']).toString('base64')) },
				form: {
					grant_type: 'refresh_token',
					refresh_token: refresh_token
				},
				json: true
			};

			request.post(authOptions, function(error, response, body) {
				if (!error && response.statusCode === 200) {
					var access_token = body.access_token;
					res.send({
						'access_token': access_token
					});
				}
			});
		});

		app.all('/users/spotify/success', (req, res) => {
			res.status(200).send("Login successful! Please close this page and return to Konvoi.");
		});
}

/* Helper Functions */

var generateRandomString = function(length) {
	var text = '';
	var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	for (var i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
};

/* Module Exports */

module.exports = {
		init,
		STATEKEY
};
