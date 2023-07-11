sap.ui.define([ "sap/ui/core/format/NumberFormat","sap/ui/core/format/DateFormat"]
, function (NumberFormat,DateFormat) {
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
		tabDate : function(val){
			var df = DateFormat.getDateInstance({ style: "medium" });
			if(val){
				return (df.format(val));
			}
		},

		currencyValueEUR : function (sValue) {
			if (!sValue) { return ""; }
			var oCurrencyFormatter = Intl.NumberFormat([
				"de-US"
			], {
				style : "currency",
				currency : "EUR",
				// currencyDisplay : "symbol",
				maximumFractionDigit : 2
			});
			return oCurrencyFormatter.format(sValue);
		},
		
		formatBlank: function(sValue, oValue) {
			if(sValue !== null) {
			if (oValue === "" || oValue === null) {
				return sValue;
			} 
			else if (oValue !== "" || oValue !== null) {
				return sValue+" "+"("+oValue+")";
			}
			}
			else {
				return "";
			}
		},
		
		currencyWithoutSymbol : function(sValue){
			if (!sValue) { return ""; }
			var oFloatNumberFormat = NumberFormat.getCurrencyInstance();
	        return oFloatNumberFormat.format(sValue);
        },
        
        In_en_DE_WithCurrency: function(sValue){
		    if (sValue === null || sValue === undefined) {
        		return null;
    		}
			var oNumberFormatter =  Intl.NumberFormat('en-US',{ minimumFractionDigits: 2 });
			var sValue = oNumberFormatter.format(sValue);
			return sValue;
		},
        
        numbersIn_en_DE_WithCurrency: function(sValue){
		    if (sValue === null || sValue === undefined) {
        		return null;
    		}
			var oNumberFormatter =  Intl.NumberFormat('en-US',{ minimumFractionDigits: 2 });
			var sValue = oNumberFormatter.format(sValue)+' '+ 'EUR';
			return sValue;
		},
			currencyValueWithCurrCode : function (sValue) {
			if (!sValue) { return ""; }

			var oCurrencyFormatter = Intl.NumberFormat([
				"en-US"
			], {
				// style : "currency",
				// currency : "EUR",
				// currencyDisplay : "code",
				maximumFractionDigit : 2
			});
			
			var sResult= oCurrencyFormatter.format(sValue);
			return sResult;

		},
		

	};
});