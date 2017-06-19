var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');
var exec = require('child_process').exec;
var port = process.env.PORT || process.env.npm_package_config_port;
var haproxy_username = process.env.HA_USER || 'occsdemo';
var haproxy_password = process.env.HA_PASS || 'occspass';
var haproxyurl = process.env.HAPROXY_URL || '';
var app = express();

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
            if(deployments && deployments.length > 0)
            {
              for(var i = 0; i < deployments.length; i++) {
                console.log(deployments[i]);
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
  var allContainersOK = true;
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
                if(containers && containers.length > 0)
                {
                    for(var i = 0; i < containers.length; i++) {
                      var obj = {};
                      //console.log(containers[i]);
                      obj.name = containers[i].container_name;
                      if(obj.name[0] != '/')
                      {
                        obj.name = '/' + obj.name;
                      }
                      obj.id = containers[i].container_id;
                      obj.state= containers[i].state;
                      if(obj.state != 'Running')
                      {
                        allContainersOK = false;
                      }
                      if(key == '*')
                      {
                        selectedContainers.push(obj);
                      } else if(obj.name.indexOf(key) !== -1)
                      {
                        selectedContainers.push(obj);
                      }
                    }
                }
    		}
            var response = {};
            response.containers = selectedContainers;
            response.allContainersOK = allContainersOK;
            res.send(JSON.stringify(response));
		}
		if(error)
		{
				 console.log(error);
				 res.send({ "error": error });
		}
  });
});

app.get('/haproxy/info', function(req, res) {
  exec('echo "show servers state nginx_80" | /usr/bin/nc -U /tmp/haproxy',
    function (error, stdout, stderr) {
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
      if (error !== null) {
        console.log('exec error: ' + error);
        res.send({ "error": error });
      } else {
        res.send({ "stdout": stdout, "stderr": stderr });
      }
  });
});

app.get('/haproxy/htmlinfo/:backend/:rows', function(req, res) {
  var backendName = req.params.backend;
  var rowCount = parseInt(req.params.rows);
  if(haproxyurl)
  {
    var auth = new Buffer(haproxy_username + ':' + haproxy_password).toString('base64');
    var getHaproxy = {
      url: haproxyurl,
      method: 'GET',
      headers: {
        Authorization: 'Basic ' + auth
      }
  	}
    request(getHaproxy, function (error, response, body) {
      var content = "";
      var i,n;
      if(body)
      {
        var rows = body.split('\n');
        var foundRow = -1;
        for(i=0; i < rows.length; i++)
        {
          if(rows[i].indexOf(backendName) > -1)
          {
            foundRow = i;
            n = foundRow + rowCount + 5;
            break;
          }
        }
        if(foundRow > -1)
        {
          content += rows[4];
          for(i=11; i < 67; i++)
          {
            content += rows[i];
          }
          for(i=foundRow - 1; i < n; i++)
          {
            content += rows[i];
          }

          /*
          for(i=n; i < n+2; i++)
          {
            content += rows[i];
          }
          */

        }
      }
      res.send( content );
    });
  } else {
    res.send('');
  }
});

app.get('/haproxy/:oper/:name/:serverId', function(req, res) {
  var backendName = req.params.name;
  var serverId = req.params.serverId;
  var oper = req.params.oper;
  var cmd = 'echo "' + oper + ' server ' + backendName + '/' + serverId + '"  | /usr/bin/nc -U /tmp/haproxy';
  console.log("HAPROXY " + oper + ' ' + serverId);
  console.log(cmd);
  exec(cmd,
    function (error, stdout, stderr) {
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
      if (error !== null) {
        console.log('exec error: ' + error);
        res.send({ "error": error });
      } else {
        res.send({ "stdout": stdout, "stderr": stderr });
      }
  });
});

app.get('/kill/:host/:bearer/:id', function(req, res) {
  var host = 'https://' + req.params.host;
  var bearer = req.params.bearer;
  var id = req.params.id;
  console.log("KILL " + id);
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

app.get('/scale/:host/:bearer/:deployment/:qty/:name', function(req, res) {
  var host = 'https://' + req.params.host;
  var bearer = req.params.bearer;
  var deployment = req.params.deployment;
  var qty = req.params.qty;
  var backendName = req.params.name;

  var getContainers = {
    url: host + '/api/v2/deployments/' + deployment + '/containers/',
    method: 'GET',
    headers: {
        Authorization: 'Bearer ' + bearer
    },
    rejectUnauthorized: false,
  }

  var postScaling = {
    url: host + '/api/v2/deployments/' + deployment,
    method: 'PUT',
    headers: {
        Authorization: 'Bearer ' + bearer
    },
    rejectUnauthorized: false,
    body: {
      "deployment_id":deployment,
      "desired_state":1,
      "placement":{ "pool_id" : "default" },
      "quantities": { "backend" : parseInt(qty) },
      "subtype":"stack"
    },
    json: true
  }
  request(getContainers, function (error, response, body) {
  	if(body)
  	{
      var data = JSON.parse(body);
      var containers = data.containers;
      var selectedContainers = [];
      for(var i = 0; i < containers.length; i++) {
        var obj = {};
        obj.name = containers[i].container_name;
        if(obj.name[0] != '/')
        {
          obj.name = '/' + obj.name;
        }
        obj.id = containers[i].container_id;
        obj.state= containers[i].state;
        if(obj.name.indexOf('backend') !== -1)
        {
          selectedContainers.push(obj);
        }
      }
      if(selectedContainers.length > qty)
      {
        console.log("NEED TO MANIPULATE HAPOXY " + selectedContainers.length + " > " + qty);
        for(var i = selectedContainers.length -1; i > qty - 1; i--) {
          console.log(selectedContainers[i].name + " " + selectedContainers[i].id);
          var oper = 'disable';
          var cmd = 'echo "' + oper + ' server ' + backendName + '/' + selectedContainers[i].id + '"  | /usr/bin/nc -U /tmp/haproxy';
          console.log("HAPROXY " + oper + ' ' + selectedContainers[i].id);
          console.log(cmd);
          var proxyStatus = '';
          exec(cmd,
            function (error, stdout, stderr) {
              console.log('error: ' + error);
              console.log('stdout: ' + stdout);
              console.log('stderr: ' + stderr);
              if(error)
              {
                proxyStatus = error;
              }
          });
        }
      }
      request(postScaling, function (error, response, body) {
        if(body.deployment.quantities)
        {
          console.log(body.deployment.quantities);
          res.send({ 'qty' : body.deployment.quantities, 'haproxy' :  proxyStatus });
        } else {
          console.log('error');
          res.status(302).json( { 'error' : body });
        }
      });
    }
  });
});

app.listen(port, function() {
  	console.log('server listening on port ' + port);
});
