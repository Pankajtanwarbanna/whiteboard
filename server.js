const express  = require('express');
const app = express();
const morgan = require('morgan');             // middleware to log http requests
const port = process.env.PORT || 4545;
const bodyParser = require('body-parser');

app.use(morgan('dev'));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));

// index page
app.get('*', function (req,res) {
    res.sendFile(__dirname + '/public/app/views/index.html');
});

// server listening on port
const server = app.listen(port, function () {
    console.log('Server running on port ' + port);
});

const io = require('socket.io')(server);

const activeBoards = {};
const drawRequests = {};

io.on('connection', function(socket) {

    socket.on('create_board', function(data) {
        const board = makeid();

        activeBoards[board] = {
            users: []
        };
        const user = {
            id: activeBoards[board].users.length + 1,
            name: data.name,
            is_admin: true,
            socket_id: socket.id
        };

        activeBoards[board].users.push(user);

        socket.join(board);

        socket.emit('connected_to_board', {
            board_id: board,
            user: user,
            users : activeBoards[board].users
        });

        io.to(board).emit('user_connected', activeBoards[board]);
    });

    socket.on('join_board', function(data) {
        if (data.board_id) {

            if(activeBoards[data.board_id] === undefined) {
                activeBoards[data.board_id] = {
                    users: []
                };
            }

            const user = {
                id: activeBoards[data.board_id].users.length + 1,
                name: data.name,
                socket_id: socket.id
            };
            if(data.newUser) {
                activeBoards[data.board_id].users.push(user);
            }
            socket.join(data.board_id);
            io.to(data.board_id).emit('user_connected', activeBoards[data.board_id]);

            socket.emit('connected_to_board', {
                board_id: data.board_id,
                user: user,
                users : activeBoards[data.board_id].users
            });
        }
    });

    socket.on('draw', function(data) {
        activeBoards[data.room].users.forEach((user) => {
            if(user.socket_id === data.sender_id) {
                if(user.is_admin || user.can_draw) {
                    io.to(data.room).emit('draw', data);
                } else {
                    io.to(data.room).emit('errorMessage', { sender_id : data.sender_id, messageType : 'drawPermissionDenied' });
                }
            }
        });
    });

    socket.on('clear_page', function(data) {
        if (data.room) {
            io.to(data.room).emit('clear_page', data);
        }
    });

    socket.on('makeMod', function (data) {
        activeBoards[data.room].users.forEach((user) => {
            if(user.socket_id === data.socket_id) {
                console.log('Mod added.')
                user.isMod = true;
            }
        });
        io.to(data.room).emit('activeUsers', activeBoards[data.room].users);
    });

    socket.on('removeMod', function (data) {
        activeBoards[data.room].users.forEach((user) => {
            if(user.socket_id === data.socket_id) {
                console.log('Mod removed.')
                user.isMod = false;
            }
        });
        io.to(data.room).emit('activeUsers', activeBoards[data.room].users);
    });

    socket.on('requestDraw', function (data) {

        if(drawRequests[data.room] === undefined) {
            drawRequests[data.room] = {
                requests : []
            };
        }

        let already = false;
        drawRequests[data.room].requests.forEach((request) => {
            if(request.socket_id === data.socket_id) {
                already = true;
            }
        });
        if(already === false) {
            drawRequests[data.room].requests.push(data);
        }

        io.to(data.room).emit('drawRequests', drawRequests[data.room].requests);

    });

    socket.on('allowDrawing', function (data) {

        activeBoards[data.room].users.forEach((user) => {
            if(user.socket_id === data.socket_id) {
                user.can_draw = true;
            }
        });

        drawRequests[data.room].requests.forEach((request) => {
            if(request.socket_id === data.socket_id) {
                request.approved = true;
            }
        });

        io.to(data.room).emit('drawRequests', drawRequests[data.room].requests);

    })

    socket.on('stopDrawing', function (data) {

        activeBoards[data.room].users.forEach((user) => {
            if(user.socket_id === data.socket_id) {
                user.can_draw = false;
            }
        });

        drawRequests[data.room].requests.forEach((request) => {
            if(request.socket_id === data.socket_id) {
                request.approved = false;
            }
        });

        io.to(data.room).emit('drawRequests', drawRequests[data.room].requests);

    })
});

function makeid() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

