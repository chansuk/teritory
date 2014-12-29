var appServ = angular.module('teritory.services', [])

appServ.factory('geoLoc',function($rootScope,$location,$q){
	function distanceLoc(lat1, lon1, lat2, lon2, unit){
		var radlat1 = Math.PI * lat1/180;
		var radlat2 = Math.PI * lat2/180;
		var radlon1 = Math.PI * lon1/180;
		var radlon2 = Math.PI * lon2/180;
		var theta = lon1-lon2;
		var radtheta = Math.PI * theta/180;
		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		dist = Math.acos(dist);
		dist = dist * 180/Math.PI;
		dist = dist * 60 * 1.1515;
		if (unit=="K") { dist = dist * 1.609344 }
		if (unit=="N") { dist = dist * 0.8684 }
		return dist.toFixed(2) * 1000;
	}
	
	return{
		
		onError:function(error){
			console.log('code: '    + error.code    + '\n' +
						'message: ' + error.message + '\n'
			);
		},
		
		onSuccess:function(position){
			var dist = distanceLoc($rootScope.qrLat, $rootScope.qrLong,position.coords.latitude,position.coords.longitude,'K');
			$rootScope.rangeDistance = dist;
			$rootScope.curLat 	= position.coords.latitude;
			$rootScope.curLong 	= position.coords.longitude;
			
		},
		getCurrent:function(){
			var deferred = $q.defer();
			navigator.geolocation.getCurrentPosition(function(position){
				var dist = distanceLoc($rootScope.qrLat, $rootScope.qrLong,position.coords.latitude,position.coords.longitude,'K');
				$rootScope.rangeDistance = dist;
				$rootScope.curLat 	= position.coords.latitude;
				$rootScope.curLong 	= position.coords.longitude;
				deferred.resolve(position);
			},function(error){
				console.log('code: '    + error.code    + '\n' +
							'message: ' + error.message + '\n'
				);
				deferred.reject(error);
			});
			return deferred.promise;
		}
	}
});

appServ.factory('QRScanService', [function () {

  return {
    scan: function(success, fail) {
      cordova.plugins.barcodeScanner.scan(
        function (result) { success(result); },
        function (error) { fail(error); }
      );
    }
  };

}]);

appServ.factory('API',function ($http,$rootScope,postData,$q) {
	var result = '';
  return {
    getDataQR: function(id) {
			var deferred = $q.defer();
			$http.get('http://106.186.19.105:8000/api/getOutlet?id='+id).
			success(function(data, status, headers, config) {
				deferred.resolve(data);
			}).error(function(data, status, headers, config) {
				deferred.reject(status);
			});
			return deferred.promise;
    },
		checkIn:function(idOutlet,vActivity){
			var canvId	= window.localStorage['userData.id'];
			vActivity		=	encodeURI(vActivity);
			
			var deferred = $q.defer();
			$http.get('http://106.186.19.105:8000/api/checkIn?idOutlet='+idOutlet+'&canvId='+canvId+'&vActivity='+vActivity).
			success(function(data, status, headers, config) {
				deferred.resolve(data);
			}).error(function(data, status, headers, config) {
				deferred.reject(status);
			});
			return deferred.promise;
		},
		assignLoc:function(idOutlet){
			var curLat	= $rootScope.curLat;
			var curLong	= $rootScope.curLong;
			
			var deferred = $q.defer();
			$http.get('http://106.186.19.105:8000/api/assignLoc?idOutlet='+idOutlet+'&curLat='+curLat+'&curLong='+curLong).
			success(function(data, status, headers, config) {
				deferred.resolve(data);
			}).error(function(data, status, headers, config) {
				deferred.reject(status);
			});
			return deferred.promise;
		},
		getHistCanvas:function(){
			var idUser = window.localStorage['userData.id'];
			var deferred = $q.defer();
			$http.get('http://106.186.19.105:8000/api/getHistory?id='+idUser).
			success(function(data, status, headers, config) {
				deferred.resolve(data);
			}).error(function(data, status, headers, config) {
				deferred.reject(status);
			});
			return deferred.promise;
		}
  };

});

appServ.factory('sessionData',function ($http,$rootScope) {
	return {
    setOn: function(data) {
			localStorage.setItem("userData.id", data.data.id);
			localStorage.setItem("userData.location", data.data.location);
			localStorage.setItem("userData.name", data.data.name);
			localStorage.setItem("userData.type", data.data.type);
			localStorage.setItem("userData.user", data.data.user);
    },
		clear:function(){
			localStorage.setItem("userData.id", '');
			localStorage.setItem("userData.location", '');
			localStorage.setItem("userData.name", '');
			localStorage.setItem("userData.type", '');
			localStorage.setItem("userData.user", '');
		}
  };

});

appServ.factory('userLogin',function($rootScope, $location,$http,sessionData,$q) {
  $rootScope.isLoggedIn = false;
	$rootScope.isLoggedIn = window.localStorage['isLoggedIn'];
	//localStorage.setItem("isLoggedIn", false);
	$rootScope.$on('user.logout', function() {
    $rootScope.isLoggedIn = false;
		localStorage.setItem("isLoggedIn", $rootScope.isLoggedIn);
		sessionData.clear();
   	$location.path('/login');
  });
	
		
  return {
    isLoggedIn: function() { return $rootScope.isLoggedIn; },
    login: function(user, pass) {
			var deferred = $q.defer();
			$http.get('http://106.186.19.105:8000/api/signIn?user='+user+'&pass='+pass).
			success(function(data, status, headers, config) {
				deferred.resolve(data);
			}).error(function(data, status, headers, config) {
				deferred.reject(status);
			});
			return deferred.promise;
    },
    logout: function() {
			$rootScope.$broadcast('user.logout');
    },
		validLogin: function(){
			var anu = window.localStorage['isLoggedIn'];
			//console.log(anu);
			if($rootScope.isLoggedIn==true||$rootScope.isLoggedIn=='true'){
				$location.path('/home');
			}else{
				$location.path('/login');
			}
			
		}
  }
});

appServ.factory("postData",function(){function n(n,t){var e=t();return e["Content-type"]="application/x-www-form-urlencoded; charset=utf-8",r(n)}function r(n){if(!angular.isObject(n))return null==n?"":n.toString();var r=[];for(var t in n)if(n.hasOwnProperty(t)){var e=n[t];r.push(encodeURIComponent(t)+"="+encodeURIComponent(null==e?"":e))}var o=r.join("&").replace(/%20/g,"+");return o}return n});