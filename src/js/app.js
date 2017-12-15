/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */

var UI = require('ui');
var Clay = require('clay');
var sb = require('bitcoin');
var Settings = require('settings');
var clayConfig = require('config');
var clay = new Clay(clayConfig, null, { autoHandleEvents: false });

var Feature = require('platform/feature');
var ajax = require('ajax');

// Global UI 
var splashCard = new UI.Card();
var routesMenu = new UI.Menu();
var fail_bg = '#b30000';
 
var primary = '#111111';
var secondary = '#DDDDDD';

var prices = [];
var wallets = [];

// Gets this all going
loadPrices();

function displaySplashScreen(message, bg_color){
  
  // Text element to inform user
  splashCard = new UI.Card({
    status: {
      separator: 'none',
    },
    title: message,
    titleColor:'#FFFFFF',
    textAlign:'center',
    backgroundColor: Feature.color(bg_color, 'black')
  });
  
  splashCard.show();
}


/**
 * Builds a menu item with routes data
 * @param data for menu
 */
function displayStuff(){
  // Construct Menu to show to user
	
	var menuView = [];
	
	if(wallets.length > 0)
	{
		var priceAmount = (wallets[0].base=="BTC") ? prices[0].amount : prices[1].amount;
		var fixAmount = priceAmount * sb.toBitcoin(wallets[0].balance);
		menuView.push({
			subtitle:sb.toBitcoin(wallets[0].balance)+((wallets[0].base=="BTC") ? " BTC" : " LTC"),
			title:parseFloat(fixAmount).toFixed(2)
		});
	}
	
	if(wallets.length > 1)
	{
    var priceAmount = (wallets[1].base=="BTC") ? prices[0].amount : prices[1].amount;
		var fixAmount = priceAmount * sb.toBitcoin(wallets[1].balance);
		menuView.push({
			subtitle:sb.toBitcoin(wallets[1].balance) +((wallets[1].base=="BTC") ? " BTC" : " LTC"),
			title:parseFloat(fixAmount).toFixed(2)
		});
	}
		
	menuView.push({
		title:prices[0].amount,
		icon:'images/btcicon.png',
		subtitle:prices[0].currency+" Coinbase"
	});

	menuView.push({
		title:prices[1].amount,
		icon:'images/ltcicon.png',
		subtitle:prices[1].currency+" Coinbase"
	});
	

	
  // Add data & style to menu
  routesMenu = new UI.Menu({
    status: {
      separator: 'none',
    },
    backgroundColor: Feature.color(primary, 'black'),
    highlightBackgroundColor: Feature.color(secondary, 'white'),
    textColor: Feature.color(secondary, 'white'),
    highlightTextColor: Feature.color('#222222', 'black'),
    sections: [{
      items: menuView
    }]
  });

  // Show the Menu, hide the splash
  routesMenu.show();
  splashCard.hide(); 
}

/**
 * Ajax call for route data.
 */
function loadPrices(){
  displaySplashScreen('Downloading Data...', primary);
	var currency = Settings.option("KEY_EXCHANGE_CUR") == null ? "USD" : Settings.option("KEY_EXCHANGE_CUR");
  var getBTCPrice = "https://api.coinbase.com/v2/prices/BTC-"+currency+"/spot";
	var getLTCPrice = "https://api.coinbase.com/v2/prices/LTC-"+currency+"/spot";
  // Make the request for route data
	
  ajax(
    {
      url: getBTCPrice,
      type: 'json'
    },
    function(data) {
      // Success
			
			prices.push({
				base:data.data.base,
				amount:data.data.amount,
				currency:data.data.currency
			});

			ajax(
				{
					url: getLTCPrice,
					type: 'json'
				},
				function(data) {
					// Success
					prices.push({
						base:data.data.base,
						amount:data.data.amount,
						currency:data.data.currency
					});
					loadBTCWallet();
				},
				function(error) {
					// Failure!
					displaySplashScreen('Failed to load LTC.', fail_bg);
				}
			);
    },
    function(error) {
      // Failure!
      displaySplashScreen('Failed to load BTC.', fail_bg);
    }
  );
}

function loadBTCWallet(){
	var balanceBTCUrl = "https://api.blockcypher.com/v1/btc/main/addrs/"+Settings.option("KEY_BTC_ADDRESS_1")+"/balance";
	if(Settings.option("KEY_BTC_ADDRESS_1") != null && Settings.option("KEY_BTC_ADDRESS_1") != "")
	{
		ajax(
			{
				url: balanceBTCUrl,
				type: 'json'
			},
			function(data) {
				// Success

				wallets.push({
					balance:data.final_balance,
					address:data.address,
					base:"BTC"
				});

				loadLTCWallet();
			},
			function(error) {
				// Failure!
				displaySplashScreen('Failed to load BTC Wallet.', fail_bg);
			}
		);
	}else{
		loadLTCWallet();
	}
}

function loadLTCWallet(){
	var balanceLTCUrl = "https://api.blockcypher.com/v1/ltc/main/addrs/"+Settings.option("KEY_LTC_ADDRESS_1")+"/balance";
	
	if(Settings.option("KEY_LTC_ADDRESS_1") != null && Settings.option("KEY_LTC_ADDRESS_1") != "")
	{
		ajax(
			{
				url: balanceLTCUrl,
				type: 'json'
			},
			function(data) {
				// Success
				wallets.push({
					balance:data.final_balance,
					address:data.address,
					base:"LTC"
				});

				displayStuff();
			},
			function(error) {
				// Failure!
				displaySplashScreen('Failed to load LTC Wallet.', fail_bg);
			}
		);
	}else{
		displayStuff();
	}
}
  
Pebble.addEventListener('showConfiguration', function(e) {
  Pebble.openURL(clay.generateUrl());
});

Pebble.addEventListener('webviewclosed', function(e) {
  if (e && !e.response) {
    return;
  }
  var dict = clay.getSettings(e.response);
  Settings.option(dict);
	prices = [];
  wallets = [];
	routesMenu.hide();
  splashCard.hide();
	loadPrices();
});