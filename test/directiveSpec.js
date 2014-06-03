describe("cordovaFile directive", function () {
    var elm, scope,
        modalMock, modalDeferred;

    beforeEach(module('angular-cordova-file'));
    beforeEach(module('ui.bootstrap.modal'));
    beforeEach(inject(function($rootScope, $compile) {
        scope = $rootScope.$new();
        scope.onFiles = function ($files) {};
    }));

    beforeEach(inject(function($modal, $q) {
        modalMock = $modal;
        modalDeferred = $q.defer();

        spyOn(modalMock, "open").andReturn({result: modalDeferred.promise});
    }));

    function compileDirective(tpl) {
        // inject allows you to use AngularJS dependency injection
        // to retrieve and use other services
        inject(function($compile) {
            elm = $compile(tpl)(scope);
        });

        // $digest is necessary to finalize the directive generation
        scope.$digest();
    }

    describe("with a cordova environment", function () {
        var navigatorMock,
            getPictureDeferred;

        beforeEach(inject(function($modal, $window, $q) {
            $window.Camera = {
                PictureSourceType: {
                    CAMERA: 1,
                    PHOTOLIBRARY: 2
                },
                DestinationType: {
                    FILE_URI: 1
                },
                EncodingType: {
                    PNG: 1
                }
            };

            getPictureDeferred = $q.defer();

            navigatorMock = navigator;
            navigatorMock.camera = {getPicture: function () {}};
            spyOn(navigatorMock.camera, "getPicture").andReturn(getPictureDeferred.promise);
        }));

        it("should open modal", function () {
            compileDirective('<input type="file" cordova-file="onFiles($files)" />');

            elm.triggerHandler('click');

            expect(modalMock.open).toHaveBeenCalled();
        });

        it("shouldn't open modal if dataSource attribute", function () {
            compileDirective('<input type="file" cordova-file="onFiles($files)" data-source="camera" />');
            elm.triggerHandler('click');

            expect(modalMock.open).not.toHaveBeenCalled();
            expect(navigatorMock.camera.getPicture).toHaveBeenCalled();
        });
    });

    describe("with a web environment", function () {
        beforeEach(inject(function($modal, $window) {
            $window.Camera = undefined;
        }));

        it("shouldn't open modal on click", function () {
            compileDirective('<input type="file" cordova-file="onFiles($files)" />');

            elm.triggerHandler('click');

            expect(modalMock.open).not.toHaveBeenCalled();
        });
    });
});