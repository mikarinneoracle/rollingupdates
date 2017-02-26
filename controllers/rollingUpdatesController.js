app.controller('rollingUpdatesController', function($location, $http, $rootScope, $scope, $routeParams, $interval, $timeout)
{
	if($location.path() == '/')
	{
		$http.get('/containers').success(function(response, err) {
			$scope.deployment = response['deployment'];
			$scope.key = response['key'];
			$scope.containers = response['containers'];
			console.log("Reloading at 5000ms");
			$rootScope.interval = $interval( function(){ $scope.callAtInterval($http); }, 3000);
		});
	}

	if ($routeParams.id) {
			$interval.cancel($rootScope.interval); // Kill the existing reloader before creating a new one
			$http.get('/kill/' + $routeParams.id).success(function(response, err) {
				$timeout( function(){ $scope.reloadAndRedirect($location); }, 2000);
			});
	}

	$scope.callAtInterval = function($http) {
		console.log('Reloading ..');
		$http.get('/containers').success(function(response, err) {
			$scope.deployment = response['deployment'];
			$scope.containers = response['containers'];
		});
  }

	$scope.reloadAndRedirect = function($location) {
		console.log('Reloading and redirecting..');
		var location = '/';
		$location.path(location);
  }

});
