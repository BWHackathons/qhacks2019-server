/* Modules */


/* Core Functions */
function init(app, db) {
	app.post("/users/:id/location", (req, res) => {
		console.log(req.body.lat + ", " + req.body.lng);
		db.serialize(() => {
			db.run("UPDATE users SET (`lat`, `lng`) = (?, ?) WHERE `userId` = ?", [parseFloat(req.body.lat), parseFloat(req.body.lng), req.params.id], (err) => {
				if(err){
					console.log(err);
					res.status(400).send({});
				}else{
					res.status(200).send({});
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