// by Pankaj Tanwar
angular.module('mainController', ['userServices','socketServices','whiteboardDirective','btford.socket-io'])

/* Socket Service */
.service('SocketService', ['socketFactory', function SocketService(socketFactory) {
    return socketFactory({
        ioSocket: io.connect(window.location.origin)
    });
}])

.controller('mainController', function (socket,$scope,$location,SocketService,$rootScope,$routeParams) {
    let app = this;

    app.loadme = true;
    app.home = true;
    app.board_id = false;
    app.homeScreenErrorMsg = '';
    app.userName = '';

    if(localStorage.length > 0) {
        app.userName = JSON.parse(localStorage.user).name;
    }

    $rootScope.$on('$routeChangeStart', function (event, next, current) {
        if (next.$$route) {
            app.home = false;
        } else {
            app.home = true;
        }
    });

    SocketService.on('connect' , function () {
        console.log('User is connected.')
    });

    // Create a new white board
    app.create = function() {
        if(app.userName) {
            SocketService.on('connected_to_board', function(data) {
                localStorage.board_id = data.board_id;
                localStorage.user = JSON.stringify(data.user);
                $location.path("/whiteboard/" + data.board_id);
            });

            SocketService.emit('create_board', {
                name: app.userName
            });
        } else {
            app.homeScreenErrorMsg = 'Please enter your name to proceed.'
        }
    };

})

// whiteboard controller
.controller('whiteboardCtrl', function (socket,$scope,$location,SocketService,$rootScope,$routeParams) {

    let app = this;
    app.boardId = $routeParams.boardId;
    $scope.users = false;
    $scope.drawRequests = false;
    app.userName = '';
    app.userNameAvailable = false;

    if(localStorage.length > 0) {
        app.userName = JSON.parse(localStorage.user).name;
        app.userNameAvailable = true;
    } else {
        app.userName = 'Guest User'
    }

    app.joinNow = function() {
        app.userNameAvailable = true;
        localStorage.user = JSON.stringify({
            ...JSON.parse(localStorage.user),
            name : app.userName
        });
    };

    // Make Moderator
    app.makeMod = function(socket_id) {
        console.log('Making Mod')
        SocketService.emit('makeMod', {
            room : app.boardId,
            socket_id : socket_id
        });
    };

    // Make Moderator
    app.removeMod = function(socket_id) {
        console.log('Removing Mod')
        SocketService.emit('removeMod', {
            room : app.boardId,
            socket_id : socket_id
        });
    };

    // request draw
    app.requestDraw = function() {
        SocketService.emit('requestDraw', {
            room : app.boardId,
            name : JSON.parse(localStorage.user).name,
            socket_id : JSON.parse(localStorage.user).socket_id
        });
    };

    // allow drawing
    app.allowDrawing = function(socket_id) {
        SocketService.emit('allowDrawing', {
            room : app.boardId,
            socket_id : socket_id
        })
    };

    // stop drawing
    app.stopDrawing = function(socket_id) {
        SocketService.emit('stopDrawing', {
            room : app.boardId,
            socket_id : socket_id
        })
    };


    socket.getOrJoin($routeParams.boardId,app.userName).then(function(socket) {
        $scope.me = JSON.parse(localStorage.user);
        $scope.users = socket.users;
        socket.on('draw', function(data) {
            $scope.$emit('draw', data);
        });

        socket.on('clear_page', function(data) {
            $scope.$emit('clear_page', data);
        });

        socket.on('activeUsers', function(data) {
            console.log('Active users ', data);
            $scope.users = data;
            $scope.$apply();
            console.log($scope.users)
        });

        socket.on('errorMessage', function(data) {
            if(data.messageType === 'drawPermissionDenied' && data.sender_id === JSON.parse(localStorage.user).socket_id) {
                console.log('You can not draw now!')
                $scope.drawPermissionDeniedMessage = true;
                $scope.$apply();
            }
        });

        socket.on('drawRequests', function (data) {
            console.log('Draw Requests ' , data);
            $scope.drawRequests = data;
            data.forEach((request) => {
                if(request.socket_id === JSON.parse(localStorage.user).socket_id) {
                    $scope.drawPermissionDeniedMessage = !request.approved;
                    $scope.drawPermissionApproveMessage = request.approved;
                }
            });
            $scope.$apply();
        })
    });

    $scope.pencilTool = true;
    $scope.colorOne = true;
    $scope.thinPen = true;

    const colorObject = {
        colorOne: '#414141',
        colorTwo: '#009be7',
        colorThree: '#ed1c24',
        colorFour: '#4daf3e',
        colorFive: '#ff9300',
        colorSix: '#999999',
        colorSeven: '#662d91',
        colorEight: '#76817b'
    };

    const penSizes = {
        finePen: '1',
        thinPen: '3',
        mediumPen: '5',
        thickPen: '10'
    };

    $scope.activeColor = colorObject.colorOne;
    $scope.activePenSize = penSizes['thinPen'];

    let _activeColor, _activePenSize;

    $scope.changeTool = function(tool) {
        $scope.pencilTool = false;
        $scope.eraserTool = false;
        $scope.textTool = false;

        $scope[tool] = true;

        if ($scope.pencilTool) {
            $scope.activeColor = _activeColor;
            $scope.activePenSize = _activePenSize;
        }

        if ($scope.eraserTool) {
            _activeColor = $scope.activeColor;
            _activePenSize = $scope.activePenSize;
            $scope.activeColor = '#ffffff';
            $scope.activePenSize = 20;
        }

        if ($scope.textTool) {
            _activeColor = $scope.activeColor;
            _activePenSize = $scope.activePenSize;
        }
    };

    $scope.color = 'colorOne';
    $scope.size  = 'finePen';
    $scope.changeColor = function(color) {
        if (!$scope.eraserTool) {
            $scope.colorOne = false;
            $scope.colorTwo = false;
            $scope.colorThree = false;
            $scope.colorFour = false;
            $scope.colorFive = false;
            $scope.colorSix = false;
            $scope.colorSeven = false;
            $scope.colorEight = false;

            $scope[color] = true;
            $scope.activeColor = colorObject[color];
        }
    };

    $scope.changePenSize = function(penSize) {
        if (!$scope.eraserTool) {
            $scope.finePen = false;
            $scope.thinPen = false;
            $scope.mediumPen = false;
            $scope.thickPen = false;

            $scope[penSize] = true;
            $scope.activePenSize = penSizes[penSize];
        }
    };

    $scope.clearPage = function() {
        paper.project.clear();
        paper.view.draw();

        SocketService.emit('clear_page', {
            room: localStorage.board_id
        });
    };

    $scope.disconnect = function() {
        delete localStorage.user;
        delete localStorage.board_id;
        $location.path("/");
    };

    $scope.createShareLink = function() {
        window.prompt("Copy the below Team share link to invite your team members to collaborate...", window.location.origin + "/whiteboard/" + $routeParams.boardId);
    };

    $scope.$on('whiteboard_draw', function(e, data) {
        data.room = $routeParams.boardId;
        data.sender_id = $scope.me.socket_id;
        SocketService.emit('draw', data);
    });
})
