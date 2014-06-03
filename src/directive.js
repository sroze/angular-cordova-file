angular.module('angular-cordova-file')
    .directive('cordovaFile', function ($injector, $q, $timeout, $parse, CordovaFile) {
        var sourcesMapping = typeof Camera != "undefined" ? {
            camera: Camera.PictureSourceType.CAMERA,
            photoLibrary: Camera.PictureSourceType.PHOTOLIBRARY
        } : {};

        /**
         * Request picture from specified source.
         *
         * @param sourceType
         * @returns promise
         */
        function requestPictureFromSource (sourceType, options) {
            var deferred = $q.defer();

            navigator.camera.getPicture(function (fileUri) {
                if (fileUri.indexOf("://") == -1) {
                    fileUri = 'file://'+fileUri;
                } else if (fileUri.substr(0, 10) == 'content://') {
                    // Currently not supported by Android because of a bug
                    // @see https://issues.apache.org/jira/browse/CB-5398
                    return deferred.reject('Image provider not supported');
                }

                var file = CordovaFile.fromUri(fileUri);
                file.set('contentType', 'image/png');

                deferred.resolve([file]);
            }, function (reason) {
                deferred.reject(reason);
            }, angular.extend({
                quality: 100,
                sourceType: sourceType,
                destinationType: Camera.DestinationType.FILE_URI,
                encodingType: Camera.EncodingType.PNG,
                correctOrientation: true
            }, options));

            return deferred.promise;
        }

        /**
         * Modal controller of input.
         *
         */
        function fileInputController ($scope, $modalInstance, options)
        {
            function getPictureFromSource (sourceType) {
                requestPictureFromSource(sourceType, options).then(function(files) {
                    $modalInstance.close(files);
                }, function (reason) {
                    $modalInstance.dismiss(reason);
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
                var fn = $parse(attributes.cordovaFile),
                    options = {};

                if (attributes.options) {
                    scope.$watch('options', function (value) {
                        options = value || options;
                    });
                }

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

                        if (attributes.source !== undefined) {
                            if (!(attributes.source in sourcesMapping)) {
                                throw new Error(attributes.source+' data source not found');
                            }

                            requestPictureFromSource(sourcesMapping[attributes.source], options).then(function (files) {
                                $timeout(function() {
                                    fn(scope, {
                                        $files : files,
                                        $event : {}
                                    });
                                });
                            }, function (reason) {
                                alert(reason);
                            });
                        } else if ($injector.has('$modal')) {
                            var modalInstance = $injector.get('$modal').open({
                                templateUrl: 'template/cordova-file/choice.html',
                                controller: fileInputController,
                                resolve: {
                                    options: function () {
                                        return options;
                                    }
                                }
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
                        } else {
                            throw new Error('If no `data-source` attribute is specified, `$modal` must be available' +
                                ' (see `angular-ui-bootstrap` or another implementation)');
                        }
                    }
                });
            }
        };
    });