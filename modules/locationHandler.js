/* Modules */


/* Core Functions */
function init(app, db) {
	app.all("/users/:id/location/:latlng", (req, res) => {
		let lat = req.params.latlng.split(",")[0];
		let lng = req.params.latlng.split(",")[1];
		db.serialize(() => {
			db.run("UPDATE users SET lat = ? AND lng = ? WHERE `userId` = ?", [lat, lng, req.params.id], (err) => {
				if(err){
					console.log(err);
					res.sendStatus(400);
				}else{
					res.sendStatus(200);
				}
			});
		});
	});

	app.all("/groups/:id/locations", (req, res) => {
		db.serialize(() => {
			db.all("SELECT `lat`, `lng`, `userId`, `bitmojiUrl` FROM users WHERE `group` = ?", [req.params.id], (err, data) => {
				if(err){
					console.log(err);
					res.sendStatus(400);
				}else{
					res.status(200).send(JSON.stringify(data));
				}
			})
		});
	});
}

module.exports = {
	init
};