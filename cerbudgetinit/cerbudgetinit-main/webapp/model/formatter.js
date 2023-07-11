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
				"de-DE"
			], {
				style : "currency",
				currency : "EUR",
				currencyDisplay : "code",
				maximumFractionDigit : 2
			});
			return oCurrencyFormatter.format(sValue);
		},
		
		numbersIn_en_US: function(sValue){
		    if (sValue === null || sValue === undefined) {
        		return null;
    		}
			var oNumberFormatter =  Intl.NumberFormat('en-US',{ minimumFractionDigits: 2 });
			return oNumberFormatter.format(sValue);
		},
		
		numbersIn_en_US_WithCurrency: function(sValue){
		    if (sValue === null || sValue === undefined) {
        		return null;
    		}
			var oNumberFormatter =  Intl.NumberFormat('en-US',{ minimumFractionDigits: 2 });
			var sValue = oNumberFormatter.format(sValue)+' '+ 'EUR';
			/*var sValue = oNumberFormatter.format(sValue)+' '+ 'USD';*/
			return sValue;
		},
		
		In_en_DE_WithCurrency: function(sValue){
		    if (sValue === null || sValue === undefined) {
        		return null;
    		}
			var oNumberFormatter =  Intl.NumberFormat('en-US',{ minimumFractionDigits: 2 });
			var sValue = oNumberFormatter.format(sValue);
			/*var sValue = oNumberFormatter.format(sValue)+' '+ 'USD';*/
			return sValue;
			
		}

	};
});