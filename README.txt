Author: Vashiran Vaitheeswaran

Source Files: add.png, orderform.html, orderform.js, remove.png, list.pug, listIn.pug, order.pug, orderIn.pug, register.pug,
user.pug, userIn.pug, welcome.pug, database-initializer.js, package-lock.json, package.json, search_In.html, search_Out.html,
server.js, user-router.js

Purpose: Create web server to do restaurant orders supporting user acocunts using mongoDB, session data, and authentication

Design Choices: Default html design using a unique register page, otherwise the design is duplicate to the ones
specified in the specifications

Instructions: 

*2 Terminals are needed to run the server

1. Use the first terminal to direct yourself desired directory

2. Make directory 'a4' using 'mkdir a4' command

3. Create database using 'mongod --dbpath=a4'

4. Use second terminal to direct yourself to '/assignment4-vashiran-v'

5. Install needed modules using 'npm install'

6. Initialize users using 'node database-initializer.js' (optional)

7. Run server with 'node server.js'

8. Go to prefered browser and go to 'http://localhost:3000' to start restaurant server