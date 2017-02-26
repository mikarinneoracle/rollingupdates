var app = angular
  .module('rollingUpdates', [
    'ngRoute',
  ])

  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: '../views/containers.html',
        controller: 'rollingUpdatesController'
      })
      .when('/:id', {
        templateUrl: '../views/redeploy.html',
        controller: 'rollingUpdatesController'
      })
      .otherwise({
        redirectTo: '/'
      });

  });
