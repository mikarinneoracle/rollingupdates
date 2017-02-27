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
