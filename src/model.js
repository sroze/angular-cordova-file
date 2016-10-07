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
                    // Android Quirk to prevent problems uploading to a Nginx server.
                    uploadOptions.chunkedMode = false;

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