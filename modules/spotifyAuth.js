/* This file based off of https://github.com/spotify/web-api-auth-examples/blob/master/authorization_code/app.js */

/* Modules */
var querystring = require('querystring');
var request = require('request');

/* Constants */
const SCOPE = "user-read-private user-read-email user-read-playback-state user-modify-playback-state playlist-modify-private";
const STATEKEY = "konvoi_auth_state";
const CALLBACK_PATH = "/users/spotify/callback";

/* Module Globals */
var access_tokens = {};
var refresh_tokens = {};
var fullUserData = {};
/* Core Functions */

function init(app, appkeys)
{
		var REDIRECT_URI = "http://localhost" + CALLBACK_PATH;
		app.get('/users/spotify/login', function(req, res) {
				var state = generateRandomString(16);
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
			console.log(req.cookies);

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
						request.get(options, function(error, response, body) {
							fullUserData[state] = body;
						});

						access_tokens[state] = access_token;
						refresh_tokens[state] = refresh_token;

						// we can also pass the token to the browser to make requests from there
						res.redirect('/host');
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
}

function getAuthToken(user)
{
	if(access_tokens[user])
		return access_tokens[user];
	else
		return null;
}

function getUserData(user)
{
	if(access_tokens[user])
		return fullUserData[user];
	else
		return null;
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
		STATEKEY,
		getAuthToken,
		getUserData
};
