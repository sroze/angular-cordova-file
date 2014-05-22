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
        'bower_components/angular-mocks/angular-mocks.js'
    ]
};

if (exports) {
    exports.files = modelFiles;
}