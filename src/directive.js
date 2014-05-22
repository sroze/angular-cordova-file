'use strict';

angular.module('angular-cordova-file')
    .directive('cordovaFile', function ($modal, $timeout, $parse, CordovaFile) {
        /**
         * Modal controller of input.
         *
         */
        function fileInputController ($scope, $modalInstance)
        {
            function getPictureFromSource (sourceType) {
                navigator.camera.getPicture(function (fileUri) {
                    if (fileUri.indexOf("://") == -1) {
                        fileUri = 'file://'+fileUri;
                    } else if (fileUri.substr(0, 10) == 'content://') {
                        // Currently not supported by Android because of a bug
                        // @see https://issues.apache.org/jira/browse/CB-5398
                        return $modalInstance.dismiss('Image provider not supported');
                    }

                    var file = CordovaFile.fromUri(fileUri);
                    file.set('contentType', 'image/png');

                    $modalInstance.close([file]);
                }, function (message) {
                    $modalInstance.dismiss(message);
                }, {
                    quality: 100,
                    sourceType: sourceType,
                    destinationType: Camera.DestinationType.FILE_URI,
                    encodingType: Camera.EncodingType.PNG,
                    correctOrientation: true
                });
            }

            $scope.close = function() {
                $modalInstance.dismiss('canceled');
            };

            $scope.takePicture = function () {
                getPictureFromSource(Camera.PictureSourceType.CAMERA);
            };

            $scope.fromLibrary = function () {
                getPictureFromSource(Camera.PictureSourceType.PHOTOLIBRARY);
            };
        }

        return {
            link: function (scope, element, attributes) {
                var fn = $parse(attributes['cordovaFile']);

                element.on('change', function (e) {
                    if (typeof Camera == "undefined") {
                        var files = [], fileList, i;
                        fileList = e.target.files;
                        if (fileList != null) {
                            for (i = 0; i < fileList.length; i++) {
                                files.push(CordovaFile.fromFile(fileList.item(i)));
                            }
                        }

                        $timeout(function() {
                            fn(scope, {
                                $files : files,
                                $event : e
                            });
                        });
                    }
                });

                element.on('click', function (event) {
                    if (typeof Camera != "undefined") {
                        event.preventDefault();

                        var modalInstance = $modal.open({
                            templateUrl: 'template/cordova-file/choice.html',
                            controller: fileInputController
                        });

                        modalInstance.result.then(function (files) {
                            $timeout(function() {
                                fn(scope, {
                                    $files : files,
                                    $event : {}
                                });
                            });
                        }, function (reason) {
                            alert(reason);
                        });

                        scope.$on('$destroy', function () {
                            modalInstance.dismiss('Scope destroyed');
                        });
                    }
                });
            }
        };
    });