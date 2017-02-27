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

app.get('/deployments/:host/:bearer', function(req, res) {
  var host = 'https://' + req.params.host;
  var bearer = req.params.bearer;
  var getDeployments = {
    url: host + '/api/v2/deployments/',
    method: 'GET',
    headers: {
        Authorization: 'Bearer ' + bearer
    },
    rejectUnauthorized: false,
  }
  request(getDeployments, function (error, response, body) {
		if(response)
		{
        var selectedDeployments = [];
				if(body)
				{
						var data = JSON.parse(body);
            var deployments = data.deployments;
            for(var i = 0; i < deployments.length; i++) {
              var obj = {};
              obj.id = deployments[i].deployment_id;
              if(deployments[i].stack)
              {
                var stack = deployments[i].stack;
                obj.name = stack.service_name;
                selectedDeployments.push(obj);
              }
            }
				}
        var response = {};
        response.deployments = selectedDeployments;
        res.send(JSON.stringify(response));
		}
		if(error)
		{
				 console.log(error);
				 res.send({ "error": error });
		}
  });
});

app.get('/containers/:host/:bearer/:deployment/:key', function(req, res) {
  var host = 'https://' + req.params.host;
  var bearer = req.params.bearer;
  var deployment = req.params.deployment;
  var key = req.params.key;
  var getContainers = {
    url: host + '/api/v2/deployments/' + deployment + '/containers/',
    method: 'GET',
    headers: {
        Authorization: 'Bearer ' + bearer
    },
    rejectUnauthorized: false,
  }
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
              if(key == '*')
              {
                selectedContainers.push(obj);
              } else if(obj.name.indexOf(key) !== -1)
              {
                selectedContainers.push(obj);
              }
            }
				}
        var response = {};
        response.containers = selectedContainers;
        res.send(JSON.stringify(response));
		}
		if(error)
		{
				 console.log(error);
				 res.send({ "error": error });
		}
  });
});

app.get('/kill/:host/:bearer/:id', function(req, res) {
  var host = 'https://' + req.params.host;
  var bearer = req.params.bearer;
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
