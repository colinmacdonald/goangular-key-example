/* jshint browser: true */
/* global angular */

/**
 * @fileOverview
 *
 * This file contains an example, only designed for use during development
 */

'use strict';

// Create an AngularJS application module
var app = angular.module('auth', ['ngRoute', 'goangular']);

app.config(['$routeProvider', '$goConnectionProvider',
  function($routeProvider, $goConnectionProvider) {
    var url = window.connectUrl || 'YOUR_CONNECT_URL';
    var origin = window.location.origin;
    var path = window.location.pathname;
    var returnTo = origin + path;

    $goConnectionProvider.$set(url);
    $goConnectionProvider.$loginUrl(['GitHub', 'Twitter', 'Facebook']);

    $goConnectionProvider.$logoutUrl(returnTo);

    $routeProvider
      .when('/', {
        templateUrl: 'views/home.html',
        controller: 'homeCtrl'
      })
      .when('/profile', {
        templateUrl: 'views/profile.html',
        controller: 'profileCtrl',
        access: 'authenticated'
      })
      .when('/restricted', {
        templateUrl: 'views/restricted.html',
        controller: 'restrictedCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  }
]);

app.factory('permissions', function ($goConnection) {
    return {
      authorized: function(accessLevel) {
        var permission;

        switch ($goConnection.isGuest) {
          case true:
            permission = 'guest';
            break;
          case false:
            permission = 'authenticated';
            break;
          default:
            permission = null;
        }

        if (permission === accessLevel) {
          return true;
        }

        return false;
      }
   };
});

app.controller('mainCtrl',
  function($scope, $route, $location, $goConnection, $goUsers, permissions) {
    $scope.conn = $goConnection;
    $scope.users = $goUsers();
    $scope.users.$self();

    $goConnection.$ready().then(function() {
      $scope.$on('$routeChangeStart', routeAuthorized);

      function routeAuthorized(scope, next) {
        var route = next || $route.current;
        var accessLevel = route.access;

        if (accessLevel && !permissions.authorized(accessLevel)) {
          $location.path('/restricted');
        }
      }

      routeAuthorized();
    });
  }
);

app.controller('homeCtrl', function($scope) {
  $scope.title = 'Home';
});

app.controller('profileCtrl', function($scope) {
  $scope.title = 'Profile';
});

app.controller('restrictedCtrl', function($scope) {
  $scope.title = 'Restricted';
});

app.directive('access', function($goConnection, permissions) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      function authenticate() {
        var accessLevel = attrs.access;

        if (accessLevel && !permissions.authorized(accessLevel)) {
          element.hide();

        } else {
          element.show();
        }
      }

      $goConnection.$ready().then(function() {
        authenticate();
      });
    }
  };
});
