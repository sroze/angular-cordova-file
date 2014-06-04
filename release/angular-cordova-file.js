/**
 * Cordova files integration into AngularJS
 * @version v1.1.2
 * @link http://github.com/sroze/angular-cordova-file
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */

/* commonjs package manager support (eg componentjs) */
if (typeof module !== "undefined" && typeof exports !== "undefined" && module.exports === exports){
  module.exports = 'angular-cordova-file';
}

(function (window, angular, undefined) {
angular.module('angular-cordova-file', [
    'angular-simple-model', 'angularFileUpload'
]);
angular.module('angular-cordova-file')
    .factory('CordovaFile', function ($q, $upload, Model) {
        var CordovaFile = Model.extend({
            /**
             * Get the preview URL of file.
             *
             * @return promise
             */
            getPreviewUrl: function () {
                var deferred = $q.defer();

                if (this.has('dataUrl')) {
                    deferred.resolve(this.get('dataUrl'));
                } else if (this.has('uri')) {
                    if (window.resolveLocalFileSystemURL !== undefined) {
                        window.resolveLocalFileSystemURL(this.get('uri'), function (fileEntry) {
                            deferred.resolve(fileEntry.toURL());
                        });
                    } else {
                        deferred.resolve(this.get('uri'));
                    }
                } else if (this.has('file')) {
                    var reader = new FileReader();

                    reader.onloadend = function (e) {
                        deferred.resolve(e.target.result);
                    };
                    reader.onerror = function (reason) {
                        deferred.reject(reason);
                    };

                    reader.readAsDataURL(this.get('file'));
                } else {
                    deferred.reject('Unable to get preview URL');
                }

                return deferred.promise;
            },
            /**
             * Upload the file using `ng-file-upload` or `FileTransfer` if
             * available.
             *
             * @param options
             *  Must contain the following options:
             *  - url
             *  - fileKey
             *
             * @return promise
             */
            upload: function (options) {
                var deferred = $q.defer();
                options = options || {};

                if (typeof FileTransfer == "undefined") {
                    $upload.upload({
                        url: options.url,
                        method: options.method,
                        headers: options.headers,
                        withCredentials: options.withCredentials,
                        data: options.data,
                        file: this.get('file'),
                        fileFormDataName: options.fileKey
                    }).progress(function(evt) {
                        var percent = parseInt(100.0 * evt.loaded / evt.total);
                        deferred.notify(percent);
                    }).success(function(data, status, headers, config) {
                        deferred.resolve(data);
                    }).error(function(reason){
                        deferred.reject(reason);
                    });
                } else if (this.has('uri')) {
                    var uri = this.get('uri'),
                        uploadOptions = new FileUploadOptions();

                    uploadOptions.fileKey = options.fileKey;
                    uploadOptions.fileName = uri.substr(uri.lastIndexOf('/') + 1);
                    uploadOptions.mimeType = this.get('contentType');
                    uploadOptions.headers = options.headers;

                    uploadOptions.params = options.data;

                    var ft = new FileTransfer();
                    ft.onprogress = function (evt) {
                        var percent = parseInt(100.0 * evt.loaded / evt.total);
                        deferred.notify(percent);
                    };

                    ft.upload(
                        uri,
                        encodeURI(options.url),
                        function (result) {
                            // Deserialize json response
                            var response = angular.fromJson(result.response);
                            deferred.resolve(response);
                        },
                        function (error) {
                            deferred.reject(error);
                        },
                        uploadOptions
                    );
                } else {
                    deferred.reject('There\'s not URI');
                }

                return deferred.promise;
            }
        }, {
            fromFile: function (file) {
                return new CordovaFile({
                    file: file,
                    contentType: file.type
                });
            },
            fromUri: function (uri) {
                return new CordovaFile({
                    uri: uri
                });
            }
        });

        return CordovaFile;
    });
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
                    options = {},
                    source;

                if (attributes.options) {
                    scope.$watch(attributes.options, function (value) {
                        options = value || options;
                    });
                }

                if (attributes.source) {
                    scope.$watch(attributes.source, function (value) {
                        source = value;
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

                        if (source !== undefined) {
                            if (!(source in sourcesMapping)) {
                                throw new Error(source+' data source not found');
                            }

                            requestPictureFromSource(sourcesMapping[source], options).then(function (files) {
                                $timeout(function() {
                                    fn(scope, {
                                        $files : files,
                                        $event : {}
                                    });
                                });
                            }, function (reason) {
                                console.log('Unable to request picture');
                                console.log(reason);
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
                                console.log(reason);
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
    });})(window, window.angular);