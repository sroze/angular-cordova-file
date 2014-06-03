describe("cordovaFile directive", function () {
    var elm, scope,
        modalMock;

    beforeEach(module('angular-cordova-file'));
    beforeEach(inject(function($rootScope, $compile) {
        scope = $rootScope.$new();
        scope.onFiles = function ($files) {};
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
        var modalDeferred;

        beforeEach(inject(function($modal, $window, $q) {
            modalMock = $modal;
            modalDeferred = $q.defer();

            spyOn(modalMock, "open").andReturn({result: modalDeferred.promise});

            $window.Camera = {};
        }));

        it("should open modal", function () {
            compileDirective('<input type="file" cordova-file="onFiles($files)" />');

            elm.triggerHandler('click');

            expect(modalMock.open).toHaveBeenCalled();
        });
    });

    describe("with a web environment", function () {
        beforeEach(inject(function($modal, $window) {
            modalMock = $modal;
            spyOn(modalMock, "open");

            $window.Camera = undefined;
        }));

        it("shouldn't open modal on click", function () {
            compileDirective('<input type="file" cordova-file="onFiles($files)" />');

            elm.triggerHandler('click');

            expect(modalMock.open).not.toHaveBeenCalled();
        });
    });
});