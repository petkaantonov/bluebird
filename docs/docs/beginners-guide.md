---
id: beginners-guide
title: Beginner's Guide
---

[beginners-guide](unfinished-article)

proper implementation of bluebird will help you chain your function synchronously.

Example 1 :

Code :

    var express = require('express');
    var fs = require('fs');
    var app = express();

    
    app.get('/index', function(req,res){
    var index =fs.readFile('./views/index.html', 'utf8') //Async function
    res.send(index)
    });
    var port = process.env.PORT || 3000
    app.listen(port, function () {
        console.log("Server is running at:" + port)
    })

In above code, it is suppose to fetch the index.html file and then send the response. But when you run it, it will not return you anything but an empty page.
Reason : fs.readFile is an async methods, so even before read operation is completed action is passed to next command which is res.send.
         So empty response is sent.
         
## Solution with bluebird

code :

      var express = require('express');
      var promise = require('bluebird');
      var fs = require('fs');
      var app = express();
      var index;
      var getIndex = function(){ 
         return new promise(function(resolve,reject){

          fs.readFile('./views/index.html', 'utf8', function(err,data){
          if(err){
           reject(err);
          }
          else{
            index=data;
            resolve(index);
          }
              })
          })
      };

      app.get('/index', function(req,res){
          getIndex().then( function(){ //bluebird promise objects make sures that next command is executed only once promise is either                                            resolved or rejected.
          res.send(index)
          });
      })

      var port = process.env.PORT || 3000
      app.listen(port, function () {
          console.log("Server is running at:" + port)
      })
