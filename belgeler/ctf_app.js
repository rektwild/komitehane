'use strict';
angular.module('app', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngTouch',
    'ngStorage',
    'uiGmapgoogle-maps',
    'ui.router',
    'ui.bootstrap',
    'ui.load',
    'oc.lazyLoad',
    'angular-carousel',
    'pascalprecht.translate',
    '720kb.socialshare',
    'angulartics',
    'angulartics.google.analytics',
    'updateMeta',
    'angular.filter',
    'vcRecaptcha'
    //'youtube-embed'
]).run(['$rootScope', '$templateCache', function ($rootScope, $templateCache) {
    $rootScope.lang = angular.element(document.querySelector('html')).attr("lang");
    $rootScope.siteKey = angular.element(document.querySelector('#site')).attr("content");
}]);



