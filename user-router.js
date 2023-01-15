//Vashiran Vaitheeswaran
//COMP 2406
//Assignment 4
//User router

//import modules
const express = require('express');
const path = require('path');
const fs = require("fs");
const pug = require("pug");
const mc = require("mongodb").MongoClient;
const { ObjectId } = require('bson');


//Create the router
let router = express.Router();

//request to load register page
router.get("/register", loadRegPage);

//request to load search page
router.get("/search", loadSearchPage);

//request to register user
router.post("/regUser", registerUser);

//request to search database for users
router.post("/searchUser", searchUser);

//request to get specific user's page
router.get("/:uid", getUser);

//request to change privacy setting of user
router.post("/changePriv", changePriv);

//store search name
let name = "";

let db;
//connect to mongoDB database
mc.connect("mongodb://localhost:27017/", function (err, client) {
    if (err) throw err;


    //Select the database by name
    db = client.db('a4');
    findUsers(null, null);
    loadUser(null, null);

});


//render register page
function loadRegPage(req, res, next) {

    res.render("register", { error: false });

}

function registerUser(req, res, next) {

    //get user data from text fields
    let u = {};
    u.username = req.body.name;
    u.password = req.body.pass;
    u.privacy = false;

    //connect to mongoDB database
    mc.connect("mongodb://localhost:27017/", function (err, client) {
        if (err) throw err;
        console.log("Connected to database.");


        let db = client.db('a4');

        //attempt to find user in database with the same name
        db.collection("users").find({ username: u.username }).toArray(function (err, result) {

            //re-render register page with error if there is already a user with the same name
            if (result.length != 0) {
                res.render("register", { error: true });
                return;
            }

            //insert user into database
            db.collection("users").insertOne(u, function (err, result) {
                if (err) throw err;

                console.log(result);
                //Close the client connection
                client.close();
                res.statusCode = 200;
                res.setHeader("Content-Type", "text/html");
                //modify session data and redirect user to homepage
                req.session.isLoggedIn = true;
                req.app.locals.loggedIn = true;
                req.session.username = u.username;
                req.app.locals.username = u.username;
                res.redirect("../")
            });
        });



    });

}

//request function to load search page depending on whether the user is logged in or not
function loadSearchPage(req, res, next) {

    //user is logged in
    if (req.app.locals.loggedIn == true) {
        fs.readFile("search_In.html", function (err, data) {
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
    } else {//user is logged out
        fs.readFile("search_Out.html", function (err, data) {
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
    }

}

//request function to get name from search field then send it to search for users
function searchUser(req, res, next) {
    name = req.body.name;
    findUsers(req, res);
}

//find users with search name contained in their username
function findUsers(req, res) {

    //find users with search name contained in username
    db.collection("users").find({ username: { $regex: `${name}`, $options: 'i' }, privacy: false }).toArray(function (err, result) {
        if (err) throw err;

        if (res != null) {
            //render list page based on whether user is logged in or not
            if (req.app.locals.loggedIn == true) {
                res.render("listIn", { users: result });
            } else {
                res.render("list", { users: result });
            }
        }
    });
}

let findId = null;

//request function that gets requested id from link to load a user
function getUser(req, res) {
    findId = new ObjectId(req.params.uid);
    loadUser(req, res);

}

//function that loads the page of a specific user
function loadUser(req, res) {

    //find user with the same id as the one obtained from the link
    db.collection("users").find({ _id: findId }).toArray(function (err, result) {
        if (err) throw err;

        if (res != null) {

            //send 404 error if the users account is private and the user is not logged in
            if (result[0].privacy == true && req.app.locals.username.localeCompare(result[0].username) != 0) {
                res.status(404).send("User requested is private");
                return;
            }

            //find all orders belonging to the user
            db.collection("orders").find({ customer: result[0].username }).toArray(function (err, orders) {
                result[0].orders = orders;

                let authorized = false;

                //render page of user depending on whether they are logged in or not
                if (req.app.locals.loggedIn == true) {

                    //authorize the user to change privacy setting if they are logged in
                    if (req.app.locals.username.localeCompare(result[0].username) === 0) {
                        authorized = true;
                    }
                    res.render("userIn", { user: result[0], authorized: authorized });
                } else {
                    res.render("user", { user: result[0] });
                }

            });



        }
    });
}

//request function to change privacy of user
function changePriv(req, res, next) {

    //initialize boolean value
    let boolVal = null;

    //reset page if the user did not select an option
    if (JSON.stringify(req.body) === JSON.stringify({})) {
        res.redirect("../profile");
        return;
    }


    if (req.body.mode.localeCompare("true") === 0) {//set boolean value to true if true is selected
        boolVal = true;
    } else if (req.body.mode.localeCompare("false") === 0) {//set boolean value to false if false is selected
        boolVal = false;
    }

    //update privacy setting of user, then reset page
    db.collection("users").updateOne({ username: req.app.locals.username }, { $set: { privacy: boolVal } });
    res.redirect("../profile");
    res.status(200);
}


//Export the router object, so it can be mounted in the server.js file
module.exports = router;
