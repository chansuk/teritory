angular.module('teritory', ['ionic', 'teritory.controllers', 'teritory.services'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
	
	$ionicPlatform.registerBackButtonAction(function () {
		if (condition) {
			alert('close app');
			navigator.app.exitApp();
		} else {
			alert('handle back');
		}
	}, 100);
})

.config(function($stateProvider, $urlRouterProvider) {
 $stateProvider

    .state('home', {
      url: "/home",
      templateUrl: "templates/home.html"
    })

    .state('checkin', {
      url: '/checkin',
      templateUrl: "templates/checkin.html"
    })
 		
 		.state('login', {
      url: '/login',
      templateUrl: "templates/login.html"
    })
 	
 		.state('allocation', {
      url: '/allocation',
      templateUrl: "templates/allocation.html"
    })

  $urlRouterProvider.otherwise('/home');

});

