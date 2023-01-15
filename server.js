//Vashiran Vaitheeswaran
//COMP 2406
//Assignment 4
//Server of webpage

//Initialize modules
const express = require('express');
const app = express();
const fs = require("fs");
const mc = require("mongodb").MongoClient;
const { ObjectId } = require('bson');
app.set("view engine", "pug");
app.use(express.static("public"));
const session = require("express-session");
//initialize session data storage
const MongoDBStore = require('connect-mongodb-session')(session);
let store = new MongoDBStore({
  uri: 'mongodb://localhost:27017/a4',
  collection: 'mySessions'
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Initialize session data
app.use(
  session({
    secret: "some secret key",
    store: store, //Used to store session data
    resave: true, //save session data after every request
    saveUninitialized: false, //stores session data if not already done
  })
);

//Require and mount user router
let userRouter = require("./user-router");
app.use("/users", userRouter);

//initialize session data for router to access
app.locals.loggedIn = false;
app.locals.username = "";

//request for home page
app.get("/", (req, res, next) => {

  //check if user is logged in then render proper homepage
  if (req.session.isLoggedIn === true) {
    res.render("welcome", { auth: true });

  } else {
    res.render("welcome", { auth: false });

  }


});

//request to login
app.post("/login", (req, res) => {

  //stop request if user is already logged in
  if (req.session.isLoggedIn) {
    res.status(200).send("Already logged in.");
    return;
  }

  //connect to mongoDB database
  mc.connect("mongodb://localhost:27017/", function (err, client) {
    if (err) throw err;
    console.log("Connected to database.");

    let db = client.db('a4');

    //find username entered by user in database
    db.collection("users").findOne({ username: req.body.username }, function (err, result) {
      if (err) throw err;

      //send 404 error if user does not exist
      if (result.length === 0) {
        res.status(404).send("User does not exist");
        return;
      }

      //if the password entered matches the password in the database, log in the user
      if (result.password === req.body.password) {
        //modify session data and redirect user to homepage
        req.session.isLoggedIn = true;
        app.locals.loggedIn = true;
        req.session.username = req.body.username;
        app.locals.username = req.body.username;
        res.status(200);
        res.redirect("/");
      } else {//send 404 error if the password is not correct
        res.status(404).send("Invalid credentials");
      }

      //close the client connection
      client.close();

    });


  });


});

//request for order form
app.get("/orderform.html", function (req, res) {
  //load order form html file
  fs.readFile("orderform.html", function (err, data) {
    if (err) {
      res.statusCode = 500;
      res.write("Server error.");
      res.end();
      return;
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html");
    res.write(data);
    res.end();
  });
});

//request to handle submitted order data
app.post("/orders", function (req, res) {

  req.body.customer = req.session.username;

  //connect to mongoDB database
  mc.connect("mongodb://localhost:27017/", function (err, client) {
    if (err) throw err;
    console.log("Connected to database.");

    let db = client.db('a4');

    //add order to orders collection
    db.collection("orders").insertOne(req.body, function (err, result) {
      if (err) throw err;

      res.status(200);
      res.end();
    });



  });

});


//request to get specific order page
app.get("/orders/:oid", function (req, res) {
  //connect to mongoDB database
  mc.connect("mongodb://localhost:27017/", function (err, client) {
    if (err) throw err;
    console.log("Connected to database.");

    let db = client.db('a4');

    //get requested order from order server storage
    db.collection("orders").find({ _id: ObjectId(req.params.oid) }).toArray(function (err, reqOrd) {
      if (err) throw err;


      //find the user data of the customer
      db.collection("users").findOne({ username: reqOrd[0].customer }, function (err, result) {
        if (err) throw err;

        //send 404 error if the user is private and they are not logged in
        if (result.privacy === true && reqOrd[0].customer != req.session.username) {
          res.status(404).send("Order requested is made by a private customer");
        } else {

          //render appropiate page if their not logged in
          if (req.session.username.localeCompare("") === 0 || req.session.username == null) {
            reqOrd[0].id = req.params.oid;
            res.render("order", { order: reqOrd[0] });
            res.status(200);
          } else {//render appropiate page if they are logged in
            reqOrd[0].id = req.params.oid;
            res.render("orderIn", { order: reqOrd[0] });
            res.status(200);
          }
        }
      });
    });

  });


});

app.get("/profile", (req, res) => {

  //connect to mongoDB database
  mc.connect("mongodb://localhost:27017/", function (err, client) {
    if (err) throw err;
    console.log("Connected to database.");

    let db = client.db('a4');

    //find currently logged in user's profile
    db.collection("users").findOne({ username: req.session.username }, function (err, result) {
      if (err) throw err;


      //find all orders belonging to the user
      db.collection("orders").find({ customer: result.username }).toArray(function (err, orders) {
        result.orders = orders;

        //render profile page
        let authorized = true;
        res.render("userIn", { user: result, authorized: authorized });
        res.status(200);
      });

    });


  });
});

//request to log out user
app.get("/logout", (req, res) => {

  //modify session data and redirect user to homepage
  req.session.isLoggedIn = false;
  app.locals.loggedIn = false;
  req.session.username = "";
  app.locals.username = "";
  res.status(200);
  res.redirect("/");
});

app.listen(3000);
console.log("Server listening at http://localhost:3000");
