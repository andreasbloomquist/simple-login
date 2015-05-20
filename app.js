var express = require('express'),
    bodyParser = require('body-parser'),
    db = require("./models"),
    session = require("express-session"),
    path = require("path"),
    app = express();

app.use(bodyParser.urlencoded({extended: true}))

app.use(session({
	secret: 'super sectre',
	resave: false,
	saveUninitialized: true
}));

var views = path.join(process.cwd(), "views");

app.use("/", function (req, res, next){
	//function to log people in
	//takes the user id from the db, and sets an attribute in the session to the id of the user
	req.login = function (user) {
		// sets session to store the user id from db
		req.session.userId = user._id;
	};

	// fetches the user associated with the session
	req.currentUser = function(cb) {
		// queries db to get the user associated with the session id created on login
		db.User
			.findOne({
				_id: req.session.userId
			}, 
			function (err, user){
				req.user = user;
				cb(null, user);
			});
		};

	// resets the session to null so that the current user can't be found
	req.logout = function () {
		req.session.userId = null;
		req.user = null;
	}
	next();
});

app.get("/signup", function (req, res) {
	res.sendFile(path.join(views, "signup.html"));
});

app.post("/signup", function(req, res){
	var user = req.body.user;
	db.User.
		createSecure(user.email, user.password, function (err, user){
		req.login(user);
		res.redirect("/profile");
	});
});

app.post("/login", function (req, res){
	var user = req.body.user;
	db.User
		.authenticate(user.email, user.password,
		function (err, user) {
			req.login(user);
			res.redirect("/profile");
	});
});

app.get("/login", function(req, res) {
	res.sendFile(path.join(views, "login.html"));
});

app.get("/profile", function (req, res) {
	var user = req.body.user;

	req.currentUser( function (err, user) {
		res.sendFile(path.join(views, "profile.html"))
		// res.sendFile(path.join(views, "profile.html"));
	});
});

app.get("/", function (req, res){
	console.log(req.session)
	var currentSession = req.session.userId;
	if (currentSession) {
		res.redirect("/profile");
	} else {
		res.redirect("/login");
	}
})

app.post("/logout", function (req, res){
	req.logout();
	res.redirect("/login");
})

app.listen(3000, function () {
  console.log("SERVER RUNNING");
});