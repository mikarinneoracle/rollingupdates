app.controller('rollingUpdatesContainerController', function($location, $http, $rootScope, $scope, $routeParams, $interval, $timeout, $sce)
{
	if($location.path() == '/containers')
	{
		if($rootScope.deployment)
		{
			var key;
			if(!$rootScope.key)
			{
				key = '*';
			} else {
				key = $rootScope.key;
			}
			$http.get('/containers/' + $rootScope.host + '/' + $rootScope.bearer + '/' + $rootScope.deployment + '/' + key).success(function(response, err) {
				$scope.containers = response['containers'];
				$scope.deployment = $rootScope.deployment;
				$scope.allContainersOk = response['allContainersOK'];
				console.log("Reloading at 1000ms");
				if($rootScope.interval)
				{
					$interval.cancel($rootScope.interval); // Kill the existing reloader before creating a new one if exists
				}
				$rootScope.interval = $interval( function(){ $scope.callAtInterval($http, $rootScope); }, 1000);
			});
		} else {
			var location = '/';
			$location.path(location);
		}
	}

	if ($routeParams.id) {
			$interval.cancel($rootScope.interval); // Kill the existing reloader before creating a new one
			$http.get('/haproxy/disable/' + $rootScope.haproxybackend + '/' + $routeParams.id).success(function(response, err) {
				if(response.error)
				{
					$rootScope.haproxyerror = response.error.cmd;
				}
				$http.get('/kill/' + $rootScope.host + '/' + $rootScope.bearer + '/' + $routeParams.id).success(function(response, err) {
					$timeout( function(){ $scope.reloadAndRedirect($location); }, 2000);
				});
			});
	}

	$scope.callAtInterval = function($http, $rootScope) {
		console.log('Reloading ..');
		var key;
		if(!$rootScope.key)
		{
			key = '*';
		} else {
			key = $rootScope.key;
		}
		/*
		$http.get('/haproxy/info').success(function(response, err) {
			//console.log(response.error);
			//console.log(response.stdout);
			//console.log(response.stderr);
			$scope.haproxy = response.stdout;
		});
		*/
		$http.get('/containers/' + $rootScope.host + '/' + $rootScope.bearer + '/' + $rootScope.deployment + '/' + key).success(function(response, err) {
			$scope.containers = response['containers'];
			$scope.deployment = $rootScope.deployment;
			$scope.allContainersOk = response['allContainersOK'];
			if($rootScope.scalingCounter)
			{
					$rootScope.scalingCounter++;
					if($rootScope.scalingCounter > 10)
					{
							$rootScope.scaling = "";
							$rootScope.scalingCounter = 0;
					}
			}
			var name = $rootScope.haproxybackend;
			var count = 0;
			// Filter 'backend's to get counter for HAproxy
			for(var i = 0; i < $scope.containers.length; i++) {
				if($scope.containers[i].name.indexOf('backend') > -1)
				{
					count++;
				}
			}
			$http.get('/haproxy/htmlinfo/' + name + '/' + count).success(function(response, err) {
				$scope.haproxy = $sce.trustAsHtml(response);
			});
		});
  }

	$scope.reloadAndRedirect = function($location) {
		console.log('Reloading and redirecting..');
		var location = '/containers';
		$location.path(location);
  }

});
