var app = angular
  .module('rollingUpdates', [
    'ngRoute',
  ])

  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: '../views/start.html',
        controller: 'rollingUpdatesController'
      })
      .when('/deployments', {
        templateUrl: '../views/deployments.html',
        controller: 'rollingUpdatesController'
      })
      .when('/containers', {
        templateUrl: '../views/containers.html',
        controller: 'rollingUpdatesContainerController'
      })
      .when('/haproxy', {
        templateUrl: '../views/haproxy.html',
        controller: 'rollingUpdatesController'
      })
      .when('/:id', {
        templateUrl: '../views/redeploy.html',
        controller: 'rollingUpdatesContainerController'
      })
      .otherwise({
        redirectTo: '/'
      });

  });
