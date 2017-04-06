app.controller('rollingUpdatesController', function($location, $http, $rootScope, $scope, $routeParams, $interval, $timeout)
{
	if(!$rootScope.haproxybackend)
	{
		$rootScope.haproxybackend = 'nginx_80';
	}
	if($location.path() == '/deployments')
	{
		if($rootScope.host && $rootScope.bearer)
		{
			$http.get('/deployments/' + $rootScope.host + '/' + $rootScope.bearer).success(function(response, err) {
				$scope.deployments = response['deployments'];
			});
		} else {
			var location = '/';
			$location.path(location);
		}
	}

	$scope.select = function(deployment) {
		$rootScope.deployment = deployment.id;
		var location = '/containers';
		$location.path(location);
	}

	$scope.filter = function(key) {
		$rootScope.key = key;
	}

	$scope.setbackend = function(haproxybackend) {
		$rootScope.haproxybackend = haproxybackend;
	}

	$scope.recycle = function(containers) {
		$rootScope.haproxyerror = "";
		if($rootScope.recycle)
		{
			$interval.cancel($rootScope.recycle); // Kill the existing reloader before creating a new one if exists
		}
		$rootScope.recycleContainers = containers;
		$rootScope.recycle = $interval( function(){ $scope.recycleInterval($http, $rootScope); }, 1000);
	}

	$scope.recycleInterval = function($http, $rootScope) {
		if($rootScope.recycleContainers.length == 0)
		{
			$rootScope.recycledContainer = null;
			$interval.cancel($rootScope.recycle);
		} else {
			if(!$rootScope.recycledContainer)
			{
				console.log("Recycling first container");
				var id = $rootScope.recycleContainers[0].id;
				$http.get('/haproxy/disable/' + $rootScope.haproxybackend + '/' + id).success(function(response, err) {
					if(response.error)
					{
						$rootScope.haproxyerror = response.error.cmd;
					}
					$http.get('/kill/' + $rootScope.host + '/' + $rootScope.bearer + '/' + id).success(function(response, err) {
						$rootScope.recycledContainer = id;
						$rootScope.recycleContainers.shift();
					});
				});
			} else {
				var key;
				if(!$rootScope.key)
				{
					key = '*';
				} else {
					key = $rootScope.key;
				}
				$http.get('/containers/' + $rootScope.host + '/' + $rootScope.bearer + '/' + $rootScope.deployment + '/' + key).success(function(response, err) {
					var containers = response.containers;
					var allOk = true;
					for(var i = 0; i < containers.length; i++) {
						if(containers[i].id == $rootScope.recycledContainer)
						{
							allOk = false; // Was found, not yet redeployed ...
						} else {
							if(containers[i].state != 'Running')
							{
								allOk = false; // Some of the (new) containers still loading ..
							}
						}
					}
					if(allOk)
					{
						var doContinue = true;
						$http.get('/haproxy/htmlinfo').success(function(response, err) {
							if(response)
							{
								for(var i = 0; i < containers.length; i++) {
									if(response.indexOf(containers[i].id) == -1)
									{
										doContinue = false;
										console.log(containers[i].id + ' was not found from haproxy info .. awaiting .. ');
									} else {
										console.log(containers[i].id + ' found in haproxy data');
									}
								}
							} else {
								console.log('haproxy info returned invalid reponse');
								console.log(response);
							}
							console.log('Continue recycling: ' + doContinue);
							if(doContinue)
							{
								console.log("ALL BACK RUNNING, recycling next ...");
								var id = $rootScope.recycleContainers[0].id;
								$http.get('/haproxy/disable/' + $rootScope.haproxybackend + '/' + id).success(function(response, err) {
									if(response.error)
									{
										$rootScope.haproxyerror = response.error.cmd;
									}
									$http.get('/kill/' + $rootScope.host + '/' + $rootScope.bearer + '/' + id).success(function(response, err) {
										$rootScope.recycledContainer = id;
										$rootScope.recycleContainers.shift();
									});
								});
							}
						});
					}
				});
			}
		}
	}

	$scope.setup = function(data) {
		$rootScope.host = data.host;
		$rootScope.bearer = data.bearer;
		var location = '/deployments';
		$location.path(location);
	}

});
