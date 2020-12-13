angular.module('whiteboardDirective',['socketServices'])

    .directive('whiteboard', ['socket',

        function(socket) {
            // Runs during compile
            return {
                link: function($scope, iElm, iAttrs, controller) {
                    var canvas = $(iElm).get()[0];
                    paper.setup(canvas);
                    var path;
                    var tool = new paper.Tool();
                    tool.minDistance = 2;

                    //Variables to handle the textTool
                    var start, end, tempPath;

                    $scope.$watch('textTool', function() {
                        var textArea = $(".tempareas");
                        if (textArea.length > 0) {
                            var text = textArea.val();
                            var pointText = new paper.PointText(start);
                            pointText.content = text;
                            pointText.fontSize = 16;
                            pointText.fillColor = $scope.activeColor;
                        }
                        $(".tempareas").remove();
                    });

                    tool.onMouseDown = function(event) {

                        if ($scope.pencilTool || $scope.eraserTool) {
                            path = new paper.Path();
                            path.strokeColor = $scope.activeColor;

                            if ($scope.activePenSize)
                                path.strokeWidth = $scope.activePenSize;
                        }

                        if ($scope.textTool) {
                            var textArea = $(".tempareas");
                            if (textArea.length > 0) {
                                var text = textArea.val();
                                var pointText = new paper.PointText(start);
                                pointText.content = text;
                                pointText.fontSize = 16;
                                pointText.fillColor = $scope.activeColor;
                                $scope.$emit('whiteboard_draw', {
                                    tool: 'textTool',
                                    pointText: pointText.exportJSON(),
                                });
                            }
                            $(".tempareas").remove();

                            start = event.point;


                        }

                        var activeTool;
                        if ($scope.pencilTool) {
                            activeTool = 'pencilTool'
                        } else if ($scope.eraserTool) {
                            activeTool = 'eraserTool';
                        } else if ($scope.textTool) {
                            activeTool = 'textTool';
                        }
                    }

                    tool.onMouseDrag = function(event) {
                        if ($scope.socket) {
                            var activeTool;
                            if ($scope.pencilTool) {
                                activeTool = 'pencilTool'
                            } else if ($scope.eraserTool) {
                                activeTool = 'eraserTool';
                            } else if ($scope.textTool) {
                                activeTool = 'textTool';
                            }
                        }

                        if ($scope.pencilTool || $scope.eraserTool) {
                            path.add(event.point);
                        }

                        if ($scope.textTool) {
                            if (tempPath) {
                                tempPath.remove();

                            }
                            end = event.point;
                            tempRect = new paper.Rectangle(start, end);

                            tempPath = new paper.Path.Rectangle(tempRect);
                            tempPath.fillColor = '#e9e9ff';
                        }
                    }

                    tool.onMouseUp = function(event) {
                        if ($scope.textTool) {
                            tempPath.remove();
                            $("body").append("<textarea class='tempareas' style='position:absolute; top:" + (start.y + 75) + "px; left:" + start.x + "px; width: " + (end.x - start.x) + "px; height:" + (end.y - start.y) + "px;'></textarea>")
                            $(".tempareas").focus();
                        }

                        if ($scope.pencilTool || $scope.eraserTool) {
                            $scope.$emit('whiteboard_draw', {
                                tool: 'pencilTool',
                                path: path.exportJSON(),
                                color: $scope.activeColor,
                                penSize: $scope.activePenSize,
                                activity: 'up'
                            });
                        }
                    };

                    $scope.$on('draw', function(ev, data) {
                        if ($scope.me.socket_id !== data.sender) {
                            if (data.tool === 'pencilTool') {
                                remotePath = new paper.Path();
                                remotePath.importJSON(data.path);
                                paper.view.draw();
                            }
                            if (data.tool === 'textTool') {
                                var pointText = new paper.PointText();
                                pointText.importJSON(data.pointText);
                                paper.view.draw();
                            }
                        }
                    });

                    $scope.$on('clear_page', function() {
                        paper.project.clear();
                        paper.view.draw();
                    });
                }
            };
        }
    ]);
