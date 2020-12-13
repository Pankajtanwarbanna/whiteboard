angular.module('socketServices',[])

.service('socket', ['$q', '$rootScope',
        function($q, $rootScope) {
            var socket;

            return {
                join: function(board_id, user) {
                    var defer = $q.defer();

                    socket = io();

                    socket.on('connected_to_board', function(data) {
                        if(localStorage.length === 0) {
                            localStorage.board_id = data.board_id;
                            localStorage.user = JSON.stringify(data.user);
                        }
                        defer.resolve(data);
                    });

                    let newUser = true;
                    if(localStorage.length > 0) {
                        if(board_id === localStorage.board_id) {
                            newUser = false;
                        }
                    }

                    socket.emit('join_board', {
                        board_id: board_id || localStorage.board_id,
                        name: user.name || localStorage.name || 'Guest User',
                        newUser : newUser
                    });

                    return defer.promise;
                },
                create: function() {
                    var defer = $q.defer();
                    socket = io();

                    socket.on('connected_to_board', function(data) {
                        localStorage.board_id = data.board_id;
                        localStorage.user = JSON.stringify(data.user);
                        defer.resolve(data);
                    });

                    socket.emit('create_board', {
                        name: 'Guest User'
                    });

                    return defer.promise;
                },
                is_connected: function() {
                    if (socket) {
                        return true;
                    } else {
                        return false;
                    }
                },
                getSocket: function() {
                    return socket;
                },
                connect: function() {
                    socket = io();
                    return socket;
                },
                send: function(event_name, data) {
                    if (event_name && data) {
                        socket.emit(event_name, data);
                    }
                },
                getOrJoin: function(room_id, userName) {
                    var defer = $q.defer();
                    if (socket) {
                        defer.resolve(socket);
                    } else {
                        this.join(room_id, {
                            name: userName
                        }).then(function(data) {
                            socket.users = data.users;
                            defer.resolve(socket);
                        });
                    }
                    return defer.promise;
                },
                connection: function() {
                    var defer = $q.defer();
                    defer.resolve(socket);
                    return defer.promise;
                }
            }
        }
    ]);
