const cors = require('cors');
const bodyParser = require('body-parser');
const express = require('express');

// CREATE EXPRESS APP
const app = express();
app.use(cors());
app.use(bodyParser.json());

// CONNECT TO FIREBASE
const admin = require('firebase-admin');
let serviceAccount = require('./testcred.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

let db = admin.firestore();
var authDB = db.collection('authentication');

app.post('/api/auth/addToken', (req, res) => {
  if (req.body != null) {
    try{
      req.body = JSON.parse(Object.keys(req.body)[0])
    }catch(err){
      req.body = req.body
    }

    var token = req.body.hash;
    var action = req.body.action;
    let start = new Date();
    let finish = new Date(start.setHours(start.getHours() + 2));

    let addDoc = authDB.add({
      hash: token,
      action: action,
      created: admin.firestore.Timestamp.fromDate(start),
      expired: admin.firestore.Timestamp.fromDate(finish)
    }).then(ref => {
      console.log('Added document with ID: ', ref.id);
      res.status(200).send({
        token: token
      });
    })
    .catch(err => {
      console.log('Error adding document', err);
      res.status(403).send({
        errorMessage: 'Could not add the token!'
      });
    });;
  }
  else{
    res.status(403).send({
      errorMessage: 'Could not add the token!'
    });
  }
});

app.post('/api/auth/checkToken', (req, res) => {
 
  if (req.body) {
    var token = req.body.hash;
    var action = req.body.action;

    let query = authDB.where('hash', '==', token)
      .where('action', '==', action)
      //.where('expired', '<', admin.firestore.Timestamp.fromDate(new Date()))
      .get()
      .then(snapshot => {
        if (snapshot.empty) {
          console.log('No matching documents.');
          res.status(403).send({
            errorMessage: 'Invalid token!'
          });
        } 
        else{
          let success = false;
          snapshot.forEach(doc => {
            console.log(doc.id, '=>', doc.data().expired.toDate() < new Date());
            if(doc.data().expired.toDate() < new Date()) {
              success = true;
            }
          });
          if(success){
            res.status(200).send({
              token: token
            });
          }
          else{
            res.status(403).send({
              errorMessage: 'Invalid token!'
            });
          }
        } 
      })
      .catch(err => {
        console.log('Error getting documents', err);
        res.status(403).send({
          errorMessage: 'Error getting documents!'
        });
      });
    }
    else{
      res.status(403).send({
        errorMessage: 'Provide any valid token!'
      }); 
    } 
});

app.listen(5000, () => console.log('Server started on port 5000'));
