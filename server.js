var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');
var auth = require('basic-auth');
var port = process.env.PORT;
var username = process.env.USER || 'demo';
var password = process.env.PASS || 'demo';
var app = express();

module.exports = app;

app.use(bodyParser.json());
app.use(express.static(__dirname));

// "https://140.86.10.95/api/v2/deployments/nodejs-sticky-20170220-143459/containers/"

var host        = 'https://140.86.10.95';
var deployment  = 'nodejs-sticky-20170220-143459';
var bearer      = 'a09332c280ddb89e';
var key         = 'backend';

var getContainers = {
  url: host + '/api/v2/deployments/' + deployment + '/containers/',
  method: 'GET',
  headers: {
      Authorization: 'Bearer ' + bearer
  },
  rejectUnauthorized: false,
}

app.get('/containers', function(req, res) {
  request(getContainers, function (error, response, body) {
		if(response)
		{
        var selectedContainers = [];
				if(body)
				{
						var data = JSON.parse(body);
            var containers = data.containers;
            for(var i = 0; i < containers.length; i++) {
              var obj = {};
              obj.name = containers[i].container_name;
              obj.id = containers[i].container_id;
              obj.state= containers[i].state;
              if(obj.name.indexOf(key) !== -1)
              {
                selectedContainers.push(obj);
              }
            }
				}
        var response = {};
        response.containers = selectedContainers;
        response.deployment = deployment;
        response.key        = key;
        res.send(JSON.stringify(response));
		}
		if(error)
		{
				 console.log(error);
				 res.send({ "error": error });
		}
  });
});

app.get('/kill/:id', function(req, res) {
  var id = req.params.id;
  var killContainer = {
    url: host + '/api/v2/containers/' + id + '/kill',
    method: 'POST',
    headers: {
        Authorization: 'Bearer ' + bearer
    },
    rejectUnauthorized: false,
  }
  request(killContainer, function (error, response, body) {
		if(response)
		{
        var response = {};
        res.send(JSON.stringify(response));
		}
		if(error)
		{
				 console.log(error);
				 res.send({ "error": error });
		}
  });
});

app.listen(port, function() {
  	console.log('server listening on port ' + port);
});
