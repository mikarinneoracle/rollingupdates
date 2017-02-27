app.controller('rollingUpdatesController', function($location, $http, $rootScope, $scope, $routeParams, $interval, $timeout)
{
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
				console.log("Reloading at 5000ms");
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

	$scope.select = function(deployment) {
		$rootScope.deployment = deployment.id;
		var location = '/containers';
		$location.path(location);
	}

	$scope.filter = function(key) {
		$rootScope.key = key;
	}

	$scope.setup = function(data) {
		$rootScope.host = data.host;
		$rootScope.bearer = data.bearer;
		var location = '/deployments';
		$location.path(location);
	}

});
