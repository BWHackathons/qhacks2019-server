/* Modules */
var request = require('request');
var querystring = require('querystring');

/* Constants */
const PLAYLIST_NAME = "Konvoi";

/* Main Functions */
function getDevices(auth, callback)
{
	get("https://api.spotify.com/v1/me/player/devices", auth, function(err, resp, body){
		if (!err && resp.statusCode == 200) {
			callback(JSON.parse(body).devices);
		}else{
			console.log(JSON.stringify(body));
		}
	});
}

function setDevice(auth, device, play=false, callback=undefined)
{
	put("https://api.spotify.com/v1/me/player", {device_ids: [device], play: play}, auth, function(err, resp, body){
			if (!err && resp.statusCode == 204) {
				console.log("Device set success");
				if(callback)
					callback(true);
			}else{
				console.log(resp.statusCode + "/HTTP");
				console.log(JSON.stringify(body));
				if(callback)
					callback(false);
			}
		});
}

function play(auth, contextUri=undefined, callback=undefined)
{
	put("https://api.spotify.com/v1/me/player/play", {context_uri: contextUri?contextUri:null}, auth, function(err, resp, body){
		if (!err && resp.statusCode == 204) {
			console.log("Play success");
			if(callback)
				callback(true);
		}else{
			console.log(resp.statusCode + "/HTTP");
			console.log(JSON.stringify(body));
			if(callback)
				callback(false);
		}
	});
}

function pause(auth, callback=undefined)
{
	put("https://api.spotify.com/v1/me/player/pause", {}, auth, function(err, resp, body){
		if (!err && resp.statusCode == 204) {
			console.log("Pause success");
			if(callback)
				callback(true);
		}else{
			console.log(resp.statusCode + "/HTTP");
			console.log(JSON.stringify(body));
			if(callback)
				callback(false);
		}
	});
}

function createPlaylist(auth, userId, code, callback)
{
	var params = {
		name: PLAYLIST_NAME + "-" + code,
		public: false,
		collaborative: false,
		description: "Playlist created and used by SpotDJ for room " + code + "."
	};
	console.log("Creating playlist for: " + userId);
	post("https://api.spotify.com/v1/users/" + userId + "/playlists", params, auth, function(err, resp, body){
		if (!err && (resp.statusCode == 200 || resp.statusCode == 201)) {
			//callback(JSON.parse(body).id);
			callback(body.id);
		}else{
			console.log(JSON.stringify(body));
		}
	});
}

function addToPlaylist(auth, userId, list, songs, callback)
{
	var requrl = "https://api.spotify.com/v1/users/" + userId + "/playlists/" + list + "/tracks";
	console.log(requrl);
	var params = {
		uris: songs
	};
	console.log(JSON.stringify(params));
	post(requrl, params, auth, function(err, resp, body){
		if (!err && (resp.statusCode == 200 || resp.statusCode == 201)) {
			callback(true);
		}else{
			console.log(JSON.stringify(body));
			callback(false);
		}
	});
}

function removeFromPlaylist(auth, code, songs)
{
	//This is more complicated than expected. Needs more consideration
}

function reorderPlaylist(auth, userId, code, oldPos, newPos)
{
	var data = {
		range_start: oldPos,
		range_length: 1,
		insert_before: newPos>oldPos ? newPos+1 : newPos
	};
	put("https://api.spotify.com/v1/users/" + userId + "/playlists/" + code + "/tracks", data, auth, function(err, resp, body){
		if (!err && resp.statusCode == 200) {
			callback(JSON.parse(body));
		}else{
			console.log(JSON.stringify(body));
		}
	});
}

function unfollowPlaylist(auth, userId, code)
{
	del("https://api.spotify.com/v1/users/" + userId + "/playlists/" + code + "/followers", auth, {}, function(err, resp, body){
		if (!err && resp.statusCode == 200) {
			callback(JSON.parse(body));
		}else{
			console.log(JSON.stringify(body));
		}
	});
}

function search(auth, query, type, callback)
{
	var url = "https://api.spotify.com/v1/search?";
	var params = {q: query, type: type};

	url += querystring.stringify(params);

	get(url, auth, function(err, resp, body){
		if (!err && resp.statusCode == 200) {
			callback(JSON.parse(body));
		}else{
			console.log(JSON.stringify(body));
		}
	});
}

function getTrackInfo(auth, id, callback)
{
	get("https://api.spotify.com/v1/tracks/" + id, auth, function(err, resp, body){
		if (!err && resp.statusCode == 200) {
			callback(JSON.parse(body));
		}else{
			console.log(JSON.stringify(body));
		}
	});
}

/* Helper Functions */
function del(url, auth, params, callback)
{
	var options = {
		method: "DELETE",
		url: url,
		json: params,
		headers: {
			"Authorization": "Bearer " + auth,
			"Content-Type": "application/json"
		}
	};
	request(options, callback);
}

function get(url, auth, callback)
{
	var options = {
		method: "GET",
		url: url,
		headers: {
			"Authorization": "Bearer " + auth
		}
	};
	request(options, callback);
}

function post(url, params, auth, callback)
{
	var options = {
		method: "POST",
		url: url,
		json: params,
		headers: {
			"Authorization": "Bearer " + auth,
			"Content-Type": "application/json"
		}
	};
	request(options, callback);
}

function put(url, params, auth, callback)
{
	var options = {
		method: "PUT",
		url: url,
		json: params,
		headers: {
			"Authorization": "Bearer " + auth
		}
	};
	request(options, callback);
}

/* Module Exports */
module.exports = {
	getDevices,
	setDevice,
	play,
	pause,
	createPlaylist,
	unfollowPlaylist,
	getTrackInfo,
	search,
	addToPlaylist,
	reorderPlaylist,
	removeFromPlaylist,
	PLAYLIST_NAME
};