
angular.module('cesium.app.controllers', ['cesium.services'])

  .config(function($httpProvider) {
    'ngInject';

    //Enable cross domain calls
    $httpProvider.defaults.useXDomain = true;

    //Remove the header used to identify ajax call  that would prevent CORS from working
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
  })

  .config(function($stateProvider) {
    'ngInject';

    $stateProvider

      .state('app', {
        url: "/app",
        abstract: true,
        templateUrl: "templates/menu.html",
        controller: 'AppCtrl'
      })
    ;

  })

  .controller('AppCtrl', AppController)

  .controller('PluginExtensionPointCtrl', PluginExtensionPointController)

;


/**
 * Useful controller that could be reuse in plugin, using $scope.extensionPoint for condition rendered in templates
 */
function PluginExtensionPointController($scope, PluginService) {
  'ngInject';
  $scope.extensionPoint = PluginService.extensions.points.current.get();
}

/**
 * Abstract controller (inherited by other controllers)
 */
function AppController($scope, $rootScope, $ionicModal, $state, $ionicSideMenuDelegate, UIUtils, $q, $timeout,
  CryptoUtils, BMA, Wallet, APP_CONFIG, $ionicHistory, Device, $ionicPopover, $translate, $filter,
  Modals
  ) {
  'ngInject';

  $scope.search = { text: '', results: {} };
  $scope.config = APP_CONFIG;
  if (!$rootScope.walletData) {
    $rootScope.walletData = Wallet.data;
  }

  ////////////////////////////////////////
  // Load currencies
  ////////////////////////////////////////

  $scope.loadCurrencies = function() {
    return $q(function (resolve, reject){
      if (!!$rootScope.knownCurrencies) { // get list only once
        resolve($rootScope.knownCurrencies);
        return;
      }
      $rootScope.knownCurrencies = [];
      BMA.blockchain.parameters()
      .then(function(res) {
        $rootScope.knownCurrencies.push({
          name: res.currency,
          peer: BMA.node.url}
        );
        $scope.search.looking = false;
        resolve($rootScope.knownCurrencies);
      })
      .catch(UIUtils.onError('ERROR.GET_CURRENCY_PARAMETER'));
    });
  };

  ////////////////////////////////////////
  // Device Methods
  ////////////////////////////////////////

  $scope.isDeviceEnable = function() {
    return Device.isEnable();
  };

  $scope.scanQrCodeAndGo = function() {
    if (!Device.isEnable()) {
      return;
    }
    Device.camera.scan()
    .then(function(uri) {
      if (!uri) {
        return;
      }
      BMA.uri.parse(uri)
      .then(function(result){
        // If pubkey
        if (result && result.pubkey) {
          $state.go('app.wot_view_identity', {
            pubkey: result.pubkey,
            node: result.host ? result.host: null}
          );
        }
        else {
          UIUtils.alert.error(result, 'ERROR.SCAN_UNKNOWN_FORMAT');
        }
      })
      .catch(UIUtils.onError('ERROR.SCAN_UNKNOWN_FORMAT'));
    })
    .catch(UIUtils.onError('ERROR.SCAN_FAILED'));
  };

  ////////////////////////////////////////
  // Login & wallet
  ////////////////////////////////////////

  // Login and load wallet
  $scope.loadWallet = function() {
    return $q(function(resolve, reject){

      if (!Wallet.isLogin()) {
        $scope.showLoginModal()
        .then(function(walletData) {
          if (walletData) {
            $rootScope.viewFirstEnter = false;
            Wallet.loadData()
            .then(function(walletData){
              $rootScope.walletData = walletData;
              resolve(walletData);
            })
            .catch(UIUtils.onError('ERROR.LOAD_WALLET_DATA_ERROR', reject));
          }
          else { // failed to login
            reject('CANCELLED');
          }
        });
      }
      else if (!Wallet.data.loaded) {
        Wallet.loadData()
          .then(function(walletData){
            $rootScope.walletData = walletData;
            resolve(walletData);
          })
          .catch(UIUtils.onError('ERROR.LOAD_WALLET_DATA_ERROR', reject));
      }
      else {
        resolve(Wallet.data);
      }
    });
  };

  // Login
  $scope.login = function(state) {
    if (!Wallet.isLogin()) {
      $scope.showLoginModal()
      .then(function(walletData){
        UIUtils.loading.hide();
        if (walletData) {
          $state.go(state ? state : 'app.view_wallet');
        }
      });
    }
  };

  // Show login modal
  $scope.showLoginModal = function() {
    return Modals.showLogin()
    .then(function(formData){
      if (!formData) return;
      Wallet.data.settings.rememberMe = formData.rememberMe;
      if (Wallet.data.settings.rememberMe) {
        Wallet.data.settings.useLocalStorage = true;
        Wallet.store();
      }
      return Wallet.login(formData.username, formData.password);
    })
    .then(function(walletData){
      if (walletData) {
        $rootScope.walletData = walletData;
      }
      return walletData;
    })
    .catch(UIUtils.onError('ERROR.CRYPTO_UNKNOWN_ERROR'));
  };

  // Logout
  $scope.logout = function() {
    UIUtils.loading.show();
    Wallet.logout()
    .then(function() {
      $ionicSideMenuDelegate.toggleLeft();
      $ionicHistory.clearHistory();
      $ionicHistory.clearCache()
      .then(function() {
        UIUtils.loading.hide();
        $state.go('app.home');
      });
    })
    .catch(UIUtils.onError());
  };

  // Is connected
  $scope.isLogin = function() {
      return Wallet.isLogin();
  };

  // If connected and same pubkey
  $scope.isUserPubkey = function(pubkey) {
    return Wallet.isUserPubkey(pubkey);
  };

  ////////////////////////////////////////
  // Useful modals
  ////////////////////////////////////////

  // Open transfer modal
  $scope.showTransferModal = function(parameters) {
    $scope.loadWallet()
    .then(function(walletData){
      UIUtils.loading.hide();
      if (walletData) {
        return Modals.showTransfer(parameters);
      }
    })
    .then(function(result){
      if (result){
        UIUtils.alert.info('INFO.TRANSFER_SENT');
        $state.go('app.view_wallet');
      }
    });
  };

  ////////////////////////////////////////
  // Layout Methods
  ////////////////////////////////////////
  $scope.showFab = function(id, timeout) {
    if (!timeout) {
      timeout = 900;
    }
    $timeout(function () {
      // Could not use 'getElementById', because it return only once element,
      // but many fabs can have the same id (many view could be loaded at the same time)
      var fabs = document.getElementsByClassName('button-fab');
      _.forEach(fabs, function(fab){
        if (fab.id == id) {
          fab.classList.toggle('on', true);
        }
      });
    }, timeout);
  };


}

