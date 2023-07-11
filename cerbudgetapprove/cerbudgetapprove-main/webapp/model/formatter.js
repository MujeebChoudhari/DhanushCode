sap.ui.define([], function () {
	"use strict";

	return {
		/**
		 * Rounds the currency value to 2 digits
		 * 
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {string} formatted currency value with 2 digits
		 */
		currencyValue : function (sValue) {
			if (!sValue) { return ""; }

			return parseFloat(sValue).toFixed(2);
		},

		currencyValueEUR : function (sValue) {
			if (!sValue) { return ""; }

			var oCurrencyFormatter = Intl.NumberFormat([
				"en-US"
			], {
				style : "currency",
				currency : "EUR",
				currencyDisplay : "code",
				maximumFractionDigit : 2
			});
			return oCurrencyFormatter.format(sValue);
		},
		
		dateTimeFormatterNoSeconds: function(dDate) {
		    if (dDate === null || dDate === undefined) {
		        return null;
		    }
		    var sCurrentLocale = sap.ui.getCore().getConfiguration().getLanguage();
		    var oDateoptions = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' };
		    return dDate.toLocaleDateString('de_DE', oDateoptions);
		},
		
		numbersIn_enUS: function(sValue){
			if (sValue === null || sValue === undefined) {
		        return null;
		    }
			return Intl.NumberFormat('en-US',{ minimumFractionDigits: 2 }).format(sValue);
			
		},
		
		numbersIn_en_US_WithCurrency: function(sValue){
		    if (sValue === null || sValue === undefined) {
        		return null;
    		}
			var oNumberFormatter =  Intl.NumberFormat('en-US',{ minimumFractionDigits: 2 });
			var sValue = oNumberFormatter.format(sValue)+' '+ 'EUR';
			return sValue;
		},
		
		In_en_US_WithCurrency: function(sValue){
		    if (sValue === null || sValue === undefined) {
        		return null;
    		}
			var oNumberFormatter =  Intl.NumberFormat('en-US',{ minimumFractionDigits: 2 });
			var sValue = oNumberFormatter.format(sValue);
			return sValue;
		},
		
		roleChange: function(sRole){
			if(sRole==="CONTROLLING"){
				sRole = "Controlling";
			}else if(sRole==="REQUESTER"){
				sRole = "Requester";
			}
			return sRole;
		}

	};
});