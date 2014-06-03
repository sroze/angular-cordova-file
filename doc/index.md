## Example

### Template

```
<input type="file" cordova-file="setFiles($files)" />

<p ng-show="isLoading">Loading...</p>
<div ng-show="imagePreviews">
    <img ng-src="{{ imagePreview }}" />
    <button ng-click="upload()">Upload</button>
</div>
```

**Note:** you could use the `data-source` attribute to specify `'camera'` or `'photoLibrary'` to remove the 'ui.bootstrap.modal'
dependency.

**Note:** you can use `data-options` attribute to extend (or override) options passed to `navigator.camera.getPicture`.

### Controller

```
angular.module('foo')
    .controller('MyController', function () {
        $scope.setFiles = function (files) {
            $scope.isLoading = true;

            files[0].getPreviewUrl().then(function(url) {
                $scope.imagePreview = url;

                $scope.upload = function () {
                    files[0].upload({
                        url: 'http://example.com/your/upload/endpoint',
                        fileKey: 'file',
                        data: {
                            some: 'extra',
                            keys: 'here'
                        },
                        headers: {}
                    }).then(function() {
                        alert('Successfully uploaded !');
                    })['finally'](function() {
                        $scope.isLoading = false;
                    });
                }
            })['finally'](function() {
                $scope.isLoading = false;
            });
        }
    });
```

