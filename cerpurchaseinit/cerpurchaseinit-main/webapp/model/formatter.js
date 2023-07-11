sap.ui.define(["sap/ui/core/format/DateFormat"], function (DateFormat) {
	"use strict";

	return {
		/**
		 * Rounds the currency value to 2 digits
		 * 
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {string} formatted currency value with 2 digits
		 */

		/*		currencyValue : function (sValue) {
					if (!sValue) { return ""; }

					return parseFloat(sValue).toFixed(2);
				},
				*/
		tabDate: function (val) {
			var df = DateFormat.getDateInstance({
				style: "medium"
			});
			if (val) {
				return (df.format(val));
			}
		},
		tabeDate: function (val) {
			var options = {
				year: 'numeric',
				month: 'short',
				day: 'numeric'
			};
			if (val) {
				return (val.toLocaleDateString("en-US", options));
			}
		},

		currencyValue: function (sValue) {
			if (!sValue) {
				return "";
			}
			var oCurrencyFormatter = Intl.NumberFormat([
				"en-US"
			], {
				// style : "currency",
				// currency : "EUR",
				// currencyDisplay : "symbol",
				maximumFractionDigit: 2
			});

			var sResult = oCurrencyFormatter.format(sValue);
			// return sResult;
			return sResult.slice(0, -1).trim();
		},

		// currencyValue : function(sValue){
		// 	if (!sValue) { return ""; }
		// 	var oFormat = sap.ui.core.format.NumberFormat.getCurrencyInstance({
		// 	    "currencyCode": "EUR",
		// 	    "pattern": "##,##0.00",
		// 	    "decimalSeparator": ".",
		// 	    "groupingSeparator": ","			    
		// 	});
		// 	return oFormat.format(sValue);
		// },

		currencyValueWithCurrCode: function (sValue) {
			if (!sValue) {
				return "";
			}

			var oCurrencyFormatter = Intl.NumberFormat([
				"en-US"
			], {
				// style : "currency",
				// currency : "EUR",
				// currencyDisplay : "code",
				maximumFractionDigit: 2
			});

			var sResult = oCurrencyFormatter.format(sValue);
			return sResult;

		},

		In_en_DE_WithCurrency: function (sValue) {
			if (sValue === null || sValue === undefined) {
				return null;
			}
			var oNumberFormatter = Intl.NumberFormat('en-US', {
				minimumFractionDigits: 2
			});
			var sValue = oNumberFormatter.format(sValue);
			return sValue;
		},

		numbersIn_en_DE_WithCurrency: function (sValue) {
			if (sValue === null || sValue === undefined) {
				return null;
			}
			var oNumberFormatter = Intl.NumberFormat('en-US', {
				minimumFractionDigits: 2
			});
			var sValue = oNumberFormatter.format(sValue) + ' ' + 'EUR';
			return sValue;
		},

		currencyValueEUR: function (sValue) {
			if (!sValue) {
				return "";
			}

			var oCurrencyFormatter = Intl.NumberFormat([
				"en-US"
			], {
				// style : "currency",
				// currency : "EUR",
				// currencyDisplay : "symbol",
				maximumFractionDigit: 2
			});
			return oCurrencyFormatter.format(sValue);
		}

	};
});