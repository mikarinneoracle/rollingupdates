var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');
var auth = require('basic-auth');
var exec = require('child_process').exec;
var swaggerJSDoc = require('swagger-jsdoc');
var port = process.env.PORT || process.env.npm_package_config_port;
var username = process.env.USER || '';
var password = process.env.PASS || '';
var haproxyurl = process.env.HAPROXY_URL || '';
var host = process.env.ADMIN_HOST || '';
var bearer = process.env.BEARER || '';
var app = express();

// swagger definition
var swaggerDefinition = {
  info: {
    title: 'Swagger UI and REST tool for OCCS Stacks management with HAproxy',
    version: '1.2.2',
    description: 'Stacks management tool for Oracle Container Cloud Stacks that implement HAproxy. Mika Rinne, ORACLE, 2017',
  },
  basePath: '/',
};

// options for the swagger docs
var options = {
  // import swaggerDefinitions
  swaggerDefinition: swaggerDefinition,
  // path to the API docs
  apis: ['./server.js'],
};

// initialize swagger-jsdoc
var swaggerSpec = swaggerJSDoc(options);

// serve swagger
app.get('/swagger.json', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use(bodyParser.json());
app.use(express.static(__dirname));

app.use(function(req, res, next) {
    var user = auth(req);

    if(!username || !password)
    {
      return res.status(500).json({ "error": "username/password not properly configured." });
    }

    if (user === undefined || user['name'] !== username || user['pass'] !== password) {
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm="Hastacktool"');
        res.end('Unauthorized');
    } else {
        next();
    }
});


/**
 * @swagger
 * /haproxy/info:
 *   get:
 *     tags:
 *       - HAproxy info
 *     description: When properly configured returns HAproxy info via stats.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: HAProxy stdout and stderr.
 *         schema:
 *           properties:
 *            stdout:
 *              type: string
 *            stderr:
 *              type: string
 *       500:
 *         description: Request failed.
 *         schema:
 *           properties:
 *            error:
 *              type: string
 */
app.get('/haproxy/info', function(req, res) {
  exec('echo "show servers state nginx_80" | /usr/bin/nc -U /tmp/haproxy',
    function (error, stdout, stderr) {
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
      if (error !== null) {
        console.log('exec error: ' + error);
        return res.status(500).json({ "error": error });
      } else {
        res.send({ "stdout": stdout, "stderr": stderr });
      }
  });
});

/**
 * @swagger
 * /haproxy/{oper}/{name}/{container}:
 *   get:
 *     tags:
 *       - HAproxy operation
 *     description: Executes HAproxy operation for a server.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: oper
 *         description: Operation either 'enable or 'disable'
 *         in: path
 *         required: true
 *         type: string
 *       - name: name
 *         description: HAproxy name e.g. nginx_80
 *         in: path
 *         required: true
 *         type: string
 *       - name: container
 *         description: Backend container id for which the proxy operation (enable/disable) is executed.
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: List of containers.
 *         schema:
 *           properties:
 *            stdout:
 *              type: string
 *            stderr:
 *              type: string
 *       500:
 *         description: Request failed.
 *         schema:
 *           properties:
 *            error:
 *              type: string
 */
app.get('/haproxy/:oper/:name/:id', function(req, res) {
  var backendName = req.params.name;
  var id = req.params.id;
  var oper = req.params.oper;
  var cmd = 'echo "' + oper + ' server ' + backendName + '/' + id + '"  | /usr/bin/nc -U /tmp/haproxy';
  console.log("HAPROXY " + oper + ' ' + id);
  console.log(cmd);
  exec(cmd,
    function (error, stdout, stderr) {
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
      if (error !== null) {
        console.log('exec error: ' + error);
        //res.send({ "error": error });
        return res.status(500).json({ "error": error });
      } else {
        res.send({ "stdout": stdout, "stderr": stderr });
      }
  });
});

/**
 * @swagger
 * /recycle/{name}/{container}:
 *   get:
 *     tags:
 *       - Recycle container
 *     description: Recycles a container.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: name
 *         description: HAproxy name e.g. nginx_80
 *         in: path
 *         required: true
 *         type: string
 *       - name: container
 *         description: Backend container id to be recycled.
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Recycling started succesfully.
 *         schema:
 *           properties:
 *            status:
 *              type: string
 *       500:
 *         description: Request failed.
 *         schema:
 *           properties:
 *            error:
 *              type: string
 */
app.get('/recycle/:name/:id', function(req, res) {
  var backendName = req.params.name;
  var id = req.params.id;
  var oper = 'disable';
  var cmd = 'echo "' + oper + ' server ' + backendName + '/' + id + '"  | /usr/bin/nc -U /tmp/haproxy';
  console.log("HAPROXY disable " + id);
  exec(cmd,
    function (error, stdout, stderr) {
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
      if (error !== null) {
        console.log('exec error: ' + error);
      }
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
            var response = { 'status' : 'OK' };
            res.send(JSON.stringify(response));
    		}
    		if(error)
    		{
    				 console.log(error);
             return res.status(500).json({ "error": error });
    		}
      });
  });
});

/**
 * @swagger
 * /scale/{deployment}/{qty}/{name}:
 *   get:
 *     tags:
 *       - Scale deployment
 *     description: Scales or shrinks 'backend's for a deployment.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: deployment
 *         description: Id of the deployment to be scaled.
 *         in: path
 *         required: true
 *         type: string
 *       - name: qty
 *         description: Number of backend containers to be scaled or shrinked to.
 *         in: path
 *         required: true
 *         type: string
 *       - name: name
 *         description: HAProxy name for HAproxy control.
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: List of containers and their quantities.
 *         schema:
 *           properties:
 *            qty:
 *              type: object
 *       500:
 *         description: Request failed.
 *         schema:
 *           properties:
 *            error:
 *              type: string
 */
app.get('/scale/:deployment/:qty/:name', function(req, res) {
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
      console.log(body);
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
          exec(cmd,
            function (error, stdout, stderr) {
              console.log('error: ' + error);
              console.log('stdout: ' + stdout);
              console.log('stderr: ' + stderr);
          });
        }
      }
      request(postScaling, function (error, response, body) {
        if(body.deployment.quantities)
        {
          console.log(body.deployment.quantities);
          res.send({ 'qty' : body.deployment.quantities });
        } else {
          console.log('error');
          res.status(302).json( { 'error' : body });
        }
      });
    }
  });
});

/**
 * @swagger
 * /containers/{deployment}/{key}:
 *   get:
 *     tags:
 *       - Containers
 *     description: Gets the list of Docker containers of a deployment. Filter by a key e.g. 'backend', use '*' for all.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: deployment
 *         description: Id of the deployment
 *         in: path
 *         required: true
 *         type: string
 *       - name: key
 *         description: Key for filtering by name. Use '*' for all.
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: List of containers.
 *         schema:
 *           properties:
 *            containers:
 *              type: array
 *            allContainersOK:
 *              type: boolean
 *              description: Returns true if all containers are in 'running' state, otherwise false.
 *       500:
 *         description: Request failed.
 *         schema:
 *           properties:
 *            error:
 *              type: string
 */
app.get('/containers/:deployment/:key', function(req, res) {
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
            if(data.containers)
            {
              var containers = data.containers;
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
                if(!key || key == '*')
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
				 return res.status(500).json({ "error": error });
		}
  });
});

app.listen(port, function() {
  	console.log('server listening on port ' + port);
    console.log('admin host ip ' + host);
    console.log('bearer ' + bearer);
    if(!username || !password)
    {
      console.log("Alert: username/password not configured.");
    }
});
