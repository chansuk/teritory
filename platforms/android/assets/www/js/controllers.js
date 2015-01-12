var app = angular.module('teritory.controllers', [])

app.controller('homeCtrl', function($scope,$rootScope,$ionicModal,$ionicPopup,$location,$ionicLoading,QRScanService,API,userLogin) {
	
	$rootScope.hideBack = true;
	userLogin.validLogin();
	$scope.listHist	= '';
	$ionicLoading.show({
		template: 'Loading...'
	});
	API.getHistCanvas().then(function(data){
		$ionicLoading.hide();
		$scope.listHist	= data;
	});
	
	$scope.actScanQr = function(){
		
		/*
		var canvId			= window.localStorage['userData.id'];
		var idOutlet		= '001001001';
		API.getDataQR(idOutlet,canvId).then(function(data){
			$ionicLoading.hide();
			if(data=='null'){
				var alertPopup = $ionicPopup.alert({
					title: 'Information!',
					template: 'outlet is not available!'
				});
			}else{
				$rootScope.dataOutlet			= data;
				$location.path('/checkin');
			}
		});*/
		
		
		$ionicLoading.show({
			template: 'Loading...'
		});
		
		QRScanService.scan(function(result) {
			if(result.text.substring(0, 5) == '{"id"'){
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
					var canvId			= window.localStorage['userData.id'];
					//var idOutlet		= '002002001';
					API.getDataQR(idOutlet,canvId).then(function(data){
						$ionicLoading.hide();
						if(data=='null'){
							var alertPopup = $ionicPopup.alert({
								title: 'Information!',
								template: 'outlet is not in your area!'
							});
						}else{
							$rootScope.dataOutlet			= data;
							$location.path('/checkin');
						}
					});

				}
			}else{
				$ionicLoading.hide();
				$ionicPopup.alert({
					title: 'Information!',
					template: 'Invalid QR Code!'
				});
			}
		});
	}
	
	
});

app.controller('checkinCtrl', function($scope,$rootScope,$ionicPopup,$ionicLoading,$location,API,geoLoc,userLogin) {
	//userLogin.validLogin();
	$rootScope.hideBack = false;
	
	function loadInit(){
		$ionicLoading.show({template: 'Loading...'});
		$scope.outletDat	= $rootScope.dataOutlet;
		$scope.vActivity 	= {};
		var canvId				= window.localStorage['userData.id'];

		API.checkInStatus($rootScope.dataOutlet.id,canvId).then(function(data){
			$ionicLoading.hide();
			$scope.isChecked	= data.status;
		});
	}
	loadInit();
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
		var canvId	= window.localStorage['userData.id'];
			 
		$ionicLoading.show({
			template: 'Loading...'
		});

		API.getDataQR(idOutlet,canvId).then(function(data){
			if(data==null || data==''){
				$ionicPopup.alert({
					title: 'Information!',
					template: 'Outlet is not registered!'
				});
				$location.path('/home');
			}else{
				var locVal			= data.location;
				//console.log(data);
				if(locVal==null||locVal==''){
					
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
											
											loadInit();
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
					
				}else{
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
								$location.path('/home');
							});

						}else{
							API.checkIn(idOutlet,notes).then(function(data){
								$ionicLoading.hide();
								var alertPopup = $ionicPopup.alert({
									title: 'Information!',
									template: data.data
								});
								loadInit();
							});
						}
					});
				}
			}
		});
	}
	
	$scope.optStockList = [
    { text: "Starter Pack", value: "sp" },
    { text: "Voucher", value: "voucher" }
  ];
	
	$scope.data = {
    optStock: 'sp'
  };
	
	$scope.actAllocate = function(){
		var optSel	= $scope.data.optStock;
		var idOutlet= $rootScope.dataOutlet.id;
		var canvId	= window.localStorage['userData.id'];
		getAllocData(optSel,idOutlet,canvId);
	}
	
	function getAllocData(optSel,idOutlet,canvId){
		$ionicLoading.show({
			template: 'Loading...'
		});
		$rootScope.allocListData	= [];
		API.getAllocList(optSel,idOutlet,canvId,10,'').then(function(data){
			$rootScope.allocListData.optSel		= optSel;
			$rootScope.allocListData.idOutlet	= idOutlet;
			$rootScope.allocListData.canvId		= canvId;
			
			getLastCheckIn(idOutlet,canvId,data);
		});
	}
	
	function getLastCheckIn(idOutlet,canvId,allocData){
		API.getLastCheckIn(idOutlet,canvId).then(function(data){
			$ionicLoading.hide();
			if(data.status){
				if(allocData.data.length>0){
					$rootScope.allocList = allocData;
					$location.path('/allocation');
				}else{
					$ionicPopup.alert({
						title: 'Information!',
						template: 'Stock is not available!'
					});
				}
			}else{
				$ionicPopup.alert({
					title: 'Information!',
					template: data.data
				});
			}
		});
	}
});

app.controller('loginStateCtrl', function($ionicPlatform,$scope) {
	$scope.version = '';
	$ionicPlatform.ready(function() {
    cordova.getAppVersion(function(version) {
			$scope.version = 'v '+version;
			
		});
	});
});

app.controller('loginCtrl', function($ionicPlatform,$scope,$ionicLoading,$ionicPopup,$rootScope,$location,userLogin,sessionData) {
	userLogin.validLogin();
	$scope.pPass = '';
	$scope.pUser = '';
	$scope.version = '';
	
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
	
});

app.controller('mainCtrl', function($scope,userLogin,API) {
	//$cordovaSplashscreen.show();
	userLogin.validLogin();
	$scope.actLogOut = function(){
		userLogin.logout();
	}
	
});

app.controller('allocationCtrl', function($scope,$rootScope,$location,$ionicLoading,$ionicPopup,userLogin,API) {
	$rootScope.hideBack 	= false;
	$scope.dataAllocation = $rootScope.allocList.data;
	$scope.dataType 			= $rootScope.allocList.type;
	var tapLoad	= 1;
	var limit 	= 20;
	
	$scope.actAddAlloc		= function(dataType,dataStock){
		addStock(dataType,String(dataStock));
	}
	
	$scope.inpSearch	= '';
	$scope.actSearch	= function(){
		searchList();
	}
	
	$scope.actLoadMore= function(){
		loadMore();
	}
	
	function loadMore(){
		if(limit==10) limit=20;
		var optSel	= $rootScope.allocListData.optSel;
		var idOutlet= $rootScope.allocListData.idOutlet;
		var canvId	= $rootScope.allocListData.canvId;
		var inpSearch	= $scope.inpSearch;
		
		$ionicLoading.show({template: 'Loading...'});
		API.getAllocList(optSel,idOutlet,canvId,limit,inpSearch).then(function(data){
			$ionicLoading.hide();
			$scope.dataAllocation = data.data;
			$scope.dataType 			= data.type;
			limit = limit+10;
		});
	}
	
	function searchList(){
		limit		= 10;
		var optSel	= $rootScope.allocListData.optSel;
		var idOutlet= $rootScope.allocListData.idOutlet;
		var canvId	= $rootScope.allocListData.canvId;
		var inpSearch	= $scope.inpSearch;
		$ionicLoading.show({template: 'Loading...'});
		API.getAllocList(optSel,idOutlet,canvId,limit,inpSearch).then(function(data){
			$ionicLoading.hide();
			$scope.dataAllocation = data.data;
			$scope.dataType 			= data.type;
		});

	}
	
	function addStock(dataType,dataStock){
		var outletNm			= $rootScope.dataOutlet.name;
		var outletId			= String($rootScope.dataOutlet.id);
		var confirmPopup 	= $ionicPopup.confirm({
			title: 'Information',
			template: 'Add stock into '+outletNm+' ?'
	 	});
					
		confirmPopup.then(function(res) {
			if(res){
				$ionicLoading.show({template: 'Loading...'});
				API.addStock(outletId,dataStock,dataType).then(function(data){
					$ionicLoading.hide();
					$ionicPopup.alert({
						title: 'Information!',
						template: data.data
					});
					reLoadList(10);
				});
			}
		});
		
	}
	
	function reLoadList(limit){
		limit 	= limit;
		$ionicLoading.show({template: 'Loading...'});
		var optSel	= $rootScope.allocListData.optSel;
		var idOutlet= $rootScope.allocListData.idOutlet;
		var canvId	= $rootScope.allocListData.canvId;
		API.getAllocList(optSel,idOutlet,canvId,limit,'').then(function(data){
			$ionicLoading.hide();
			$scope.dataAllocation = data.data;
			$scope.dataType 			= data.type;
		});

	}
	
	
});