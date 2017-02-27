app.controller('rollingUpdatesContainerController', function($location, $http, $rootScope, $scope, $routeParams, $interval, $timeout)
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
				console.log("Reloading at 3000ms");
				if($rootScope.interval)
				{
					$interval.cancel($rootScope.interval); // Kill the existing reloader before creating a new one if exists
				}
				$rootScope.interval = $interval( function(){ $scope.callAtInterval($http, $rootScope); }, 3000);
			});
		} else {
			var location = '/';
			$location.path(location);
		}
	}

	if ($routeParams.id) {
			$interval.cancel($rootScope.interval); // Kill the existing reloader before creating a new one
			$http.get('/kill/' + $rootScope.host + '/' + $rootScope.bearer + '/' + $routeParams.id).success(function(response, err) {
				$timeout( function(){ $scope.reloadAndRedirect($location); }, 2000);
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
		$http.get('/containers/' + $rootScope.host + '/' + $rootScope.bearer + '/' + $rootScope.deployment + '/' + key).success(function(response, err) {
			$scope.containers = response['containers'];
			$scope.deployment = $rootScope.deployment;
		});
  }

	$scope.reloadAndRedirect = function($location) {
		console.log('Reloading and redirecting..');
		var location = '/containers';
		$location.path(location);
  }

});
