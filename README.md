# Collab Tool

Simple collaboration app for [Startup Engineering Assignment](https://ocw.cs.pub.ro/courses/se/assignment/01).

### Public endpoint

The applicaiton is live at http://collabtool.valinet.ro.

Most recent source code is available at https://github.com/valinet/collabtool.

### Details

The project is split in 2 parts:

* `api` - This is the server/backend/API, which communicates with the database and offers an authenticated endpoint that clients can use to query and manage the database.
* `client` - This is the web application that runs in the browser. It conencts to the API to query for data, displays the obtained information, and furtheron it utilizes the API to perform management tasks, like editing or deleting entries.

### Points of interest

* I have also implemented basic authentication. Upon opening the application (connect to port 3000 in the browser), you will be asked for credentials. You can use username `student` and password `student`. The server will issue a JWT token that will be stored as a cookie on the client and is valid for 1 hour. Every API call besides `POST /login` has to be authenticated using such a token.
* In order to ease and speed up the implementation, I have abstractized the boards, list of cards, and cards themselves as the same object with the same properties and stored them in the database. Each object contains an entry with a "link" (the id) of another object, if the case, thus allowing relationships like board-card list, card list-card to exist. The rendering is slightly altered depending on whetehr the object is at the top leve or some other object's child, in order to achieve the differentiation between the board list and card list.

### Prerequisites

* Tested on Ubuntu 22.04 LTS with systemd.
* [nodejs](https://github.com/nodesource/distributions)
* [mongodb](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/)

After installing mongodb, make sure to enable and start the service using `systemctl enable mongod && systemctl start mongod`.

### Configure server

```
cd api
npm install
npm start
```

Server now listens on port 3001. To make it permanent, adjust and install the `misc/collabtool_api.service` file in `/etc/systemd/system` and then `systemctl daemon-reload && systemctl enable collabtool_api && systemctl start collabtool_api`.

### Configure client

```
cd client
npm install --legacy-peer-deps
npm run dev
```

Client now listens on port 3000. To make it permanent, adjust and install the `misc/collabtool_client.service` file in `/etc/systemd/system` and then `systemctl daemon-reload && systemctl enable collabtool_client && systemctl start collabtool_client`.
