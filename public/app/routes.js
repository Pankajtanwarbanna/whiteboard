var app = angular.module('userRoutes', ['ngRoute'])

.config(function ($routeProvider, $locationProvider) {
    $routeProvider

        .when('/home', {
            templateUrl : '/app/views/index.html'
        })

        .when('/whiteboard/:boardId', {
            templateUrl : '/app/views/pages/whiteboard.html',
            controller : 'whiteboardCtrl',
            controllerAs : 'whiteboard'
        })

        .otherwise( { redirectTo : '/'});

    $locationProvider.html5Mode({
        enabled : true,
        requireBase : false
    })
});
