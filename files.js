modelFiles = {
    src: [
        'src/global.js',
        'src/model.js',
        'src/directive.js'
    ],
    test: [
        'test/*Spec.js'
    ],
    angular: [
        'bower_components/angular/angular.js',
        'bower_components/angular-mocks/angular-mocks.js',
        'bower_components/angular-bootstrap/ui-bootstrap.js',
        'bower_components/ng-file-upload/angular-file-upload.js',
        'bower_components/angular-simple-model/release/angular-simple-model.js'
    ]
};

if (exports) {
    exports.files = modelFiles;
}