/* jshint browser: true */
/* global angular */

var app = angular.module('keyExample', ['ngRoute', 'goangular']);

app.config(['$routeProvider', '$goConnectionProvider',
  function($routeProvider, $goConnectionProvider) {
    var url = window.connectUrl || 'YOUR_CONNECT_URL';

    $goConnectionProvider.$set(url);

    $routeProvider
      .when('/recent', {
        templateUrl: 'views/recent.html',
        controller: 'recentCtrl'
      })
      .when('/ask', {
        templateUrl: 'views/ask.html',
        controller: 'askCtrl'
      })
      .when('/question/:id', {
        templateUrl: 'views/question.html',
        controller: 'questionCtrl'
      })
      .when('/search', {
        templateUrl: 'views/search.html',
        controller: 'searchCtrl'
      })
      .otherwise({
        redirectTo: '/recent'
      });
  }
]);

app.controller('mainCtrl', function($scope, $goKey, $goUsers) {
  $scope.questions = $goKey('questions').$sync();

  $scope.users = $goUsers();
  $scope.users.$self();
});

app.controller('recentCtrl', function($scope) {
  $scope.title = 'Recent Questions';
});

app.controller('askCtrl', function($scope, $location, $timeout) {
  $scope.title = 'Ask a Question';

  $scope.ask = function() {
    $scope.buttonText = 'Loading...';

    var question = {
      title: $scope.questionTitle,
      body: $scope.questionBody,
      user: $scope.users.$local.displayName
    };

    $scope.questionTitle = '';
    $scope.questionBody = '';

    $scope.questions.$add(question).then(function(result) {
      var id = result.context.addedKey.split('/').pop();

      $timeout(function() {
        $location.path('/question/' + id);
        $scope.buttonText = 'Ask!';
      }, 500);
    });
  };
});

app.controller('questionCtrl', function($scope, $routeParams, $timeout, $goKey) {
  $scope.id = $routeParams.id;

  $scope.comments = $goKey('comments').$key($scope.id).$sync();

  $scope.comments.$post = function() {
    var comment = {
      body: $scope.newComment,
      user: $scope.users.$local.displayName,
      userId: $scope.users.$local.id
    };

    $scope.comments.$add(comment).then(function() {
      $scope.newComment = '';
    });
  };

  $scope.comments.$edit = function(id) {
    if ($scope.editButton === 'Edit') {
      $scope.editButton = 'Submit';

    } else {
      var comment = $scope.comments[id].editText;
      $scope.comments.$key(id).$key('body').$set(text);

      $scope.editText = '';
      $scope.editButton = 'Edit';
    }
  };

  $scope.comments.$remove = function(id) {
    $scope.comments.$key(id).$remove();
  };

  var timeoutId = null;

  $scope.comments.$off('add');

  $scope.comments.$on('add', { local: true }, function() {
    $scope.notification = true;

    $timeout.cancel(timeoutId);

    timeoutId = $timeout(function() {
      $scope.notification = false;
      timeoutId = null;
    }, 2000);
  });
});

app.controller('searchCtrl', function($scope, $routeParams, $goKey) {
  $scope.title = 'Search for a Question';
});

app.directive('enter', function() {
  return {
    restrict: 'A',
    link: function($scope, element, attrs) {
      element.bind('keydown', function(event) {
        var key = (event.which) ? event.which : event.keyCode;

        if (key !== 13) {
          return;
        }

        $scope.$eval(attrs.enter);
      });
    }
  };
});

app.directive('comments', function() {
  return {
    scope: {
      comments: '=',
      localUser: '=localUser'
    },
    restrict: 'A',
    templateUrl: 'templates/comments.html'
  };
});

app.directive('comment', function($goKey) {
  return {
    restrict: 'E',
    templateUrl: 'templates/comment.html',
    require: '^comments',
    controller: function($scope) {
      $scope.editButton = 'Edit';

      $scope.edit = function(id) {
        if ($scope.editButton === 'Edit') {
          $scope.editButton = 'Submit';

        } else {
          var commentBody = $scope.comments.$key(id).$key('body');

          commentBody.$set($scope.editText).then(function() {
            $scope.editText = '';
            $scope.editButton = 'Edit';
          });
        }
      };

      $scope.remove = function(id) {
        $scope.comments.$key(id).$remove();
      };
    }
  };
});
