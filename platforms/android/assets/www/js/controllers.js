var app = angular.module('teritory.controllers', [])

app.controller('homeCtrl', function($scope,$rootScope,$ionicModal,$ionicPopup,$location,$ionicLoading,QRScanService,API,userLogin) {
	$rootScope.hideBack = true;
	userLogin.validLogin();
	$scope.listHist	= '';
	API.getHistCanvas().then(function(data){
			$scope.listHist	= data;
	});
	
	$scope.actScanQr = function(){
		$ionicLoading.show({
			template: 'Loading...'
		});
		
		QRScanService.scan(function(result) {
			if (result.cancelled) {
				$ionicLoading.hide();
				$ionicModal.fromTemplate('').show().then(function() {
					$ionicPopup.alert({
						title: 'QR Scan Cancelled',
						template: 'You cancelled it!'
					});
				});
			}else{
				
				var dataQr 			= JSON.parse(result.text);
				var idOutlet		= dataQr.id;
				//var idOutlet		= '001001003';
				API.getDataQR(idOutlet).then(function(data){
					$ionicLoading.hide();
					if(data!='null'){
						$rootScope.dataOutlet			= data;
						$location.path('/checkin');
					}else{
						var alertPopup = $ionicPopup.alert({
							title: 'Information!',
							template: 'outlet is not registered!'
						});
					}
				});
			}
		});
	}
	
	
});

app.controller('checkinCtrl', function($scope,$rootScope,$ionicPopup,$ionicLoading,$location,API,geoLoc,userLogin) {
	//userLogin.validLogin();
	$rootScope.hideBack = false;
  $scope.outletDat	= $rootScope.dataOutlet;
	$scope.vActivity 	= {};
	$scope.actCheckIn	= function(){
		 var myPopup = $ionicPopup.show({
				template: '<textarea ng-model="vActivity.notes" rows="5"></textarea>',
				title: 'Describe your activity',
				scope: $scope,
				buttons: [
					{ text: 'Cancel' },
					{
						text: '<b>Save</b>',
						type: 'button-positive',
						onTap: function(e) {
							if (!$scope.vActivity.notes) {
								e.preventDefault();
							} else {
								return $scope.vActivity.notes;
							}
						}
					},
				]
			});
			myPopup.then(function(res) {
				if(res){
					asignCheckIn(res);
				}
			});
	}
	
	function asignCheckIn(notes){
		var watchID	= navigator.geolocation.watchPosition(geoLoc.onSuccess, geoLoc.onError,{ enableHighAccuracy: true });
		var idOutlet= $rootScope.dataOutlet.id;
					
		$ionicLoading.show({
			template: 'Loading...'
		});

		API.getDataQR(idOutlet).then(function(data){
			if(data!=null){
				var locVal			= data.location;
				if(locVal!=null){
					var nameVal			= data.name;
					var locDet			= locVal.split(',');
					$rootScope.qrLat 	= locDet[0];
					$rootScope.qrLong	= locDet[1];

					

					geoLoc.getCurrent().then(function(data){
						navigator.geolocation.clearWatch(watchID);
						if($rootScope.rangeDistance>1000){
							$ionicLoading.hide();
							var alertPopup = $ionicPopup.alert({
								title: 'Information!',
								template: 'You are not in '+nameVal+' location<br> Please check in at location!'
							});
							alertPopup.then(function(res) {
								$ionicLoading.hide();
							});

						}else{
							API.checkIn(idOutlet,notes).then(function(data){
								$ionicLoading.hide();
								var alertPopup = $ionicPopup.alert({
									title: 'Information!',
									template: data.data
								});
								$location.path('/home');
							});
						}
					});
				}else{
					$ionicLoading.hide();
					var confirmPopup = $ionicPopup.confirm({
						 title: 'Warning',
						 template: 'Undefined outlet location,<br> Assign location this outlet?'
					 });
					 confirmPopup.then(function(res) {
						 if(res) {
							$ionicLoading.show({template: 'Updating...'});

							geoLoc.getCurrent().then(function(data){
								navigator.geolocation.clearWatch(watchID);
								API.assignLoc(idOutlet).then(function(data){
									$ionicLoading.hide();
									if(data.status){
										$ionicLoading.show({template: 'Check in...'});
										API.checkIn(idOutlet,notes).then(function(data){
											$ionicLoading.hide();
											var alertPopup = $ionicPopup.alert({
												title: 'Information!',
												template: data.data
											});
											$location.path('/home');
										});
									}else{
										var alertPopup = $ionicPopup.alert({
											title: 'Information!',
											template: data.data
										});
										$location.path('/home');
									}


								});
							});

						 }
					 });
				}
			}else{
				$ionicPopup.alert({
					title: 'Information!',
					template: 'Outlet is not registered!'
				});
				$location.path('/home');
			}
		});
	}
});

app.controller('loginCtrl', function($scope,$ionicLoading,$ionicPopup,$rootScope,$location,userLogin,sessionData) {
	userLogin.validLogin();
	$scope.pPass = '';
	$scope.pUser = '';


	$scope.actLogin = function() {
		var pPass	= $scope.pPass;
		var pUser	= $scope.pUser;
		$ionicLoading.show({
			template: 'Sign in...'
		});
		userLogin.login(pUser,pPass).then(function(data){
			$ionicLoading.hide();
			
			if(data.status){
				$rootScope.isLoggedIn = true;
				localStorage.setItem("isLoggedIn", true);
				$location.path('/home');
				sessionData.setOn(data);
			}else{
				$ionicPopup.alert({
					title: 'Warning!',
					template: 'Login failed!'
				});
				$rootScope.isLoggedIn = false;
				localStorage.setItem("isLoggedIn", false);
				sessionData.clear();
				$location.path('/login');
			}
		});
	}
	
	document.addEventListener("backbutton", onBackKeyDown, false);
	function onBackKeyDown(e) {
		e.preventDefault();
	}
});

app.controller('mainCtrl', function($scope,userLogin) {
	//$cordovaSplashscreen.show();
	userLogin.validLogin();
	$scope.actLogOut = function(){
		userLogin.logout();
	}
});