sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"./model/models"
], function (UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("gb.wf.cer.purchase.init.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);
			
			var contextModel = new sap.ui.model.json.JSONModel();
			this.setModel(contextModel, "pur");

			var positionModel = new sap.ui.model.json.JSONModel();
			
			var dataObject = { data : [
				{PositionNum:10}, {PositionNum:20}, {PositionNum:30}, {PositionNum:40}, {PositionNum:50}, {PositionNum:60}, {PositionNum:70}, {PositionNum:80}, {PositionNum:90}, {PositionNum:100}
			]};
			
			positionModel.setData(dataObject);
			this.setModel(positionModel, "pos");
			var bucketId = this.createUUID();
			this.getModel("pur").setProperty("/bucketId", bucketId);
		},
		
		
		createUUID: function () {
			//WORKAROUND weil Feld REQ_ID in der Entität vom Typ Number ist. Wenn das geändert ist, muss der auskommentierte Code wieder rein.
			var c = 1;
		    var d = new Date(),
        	m = d.getMilliseconds() + "",
        	u = ++d + m + (++c === 10000 ? (c = 1) : c);
			return u;
		/*	
			var dt = new Date().getTime();
			var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
				var r = (dt + Math.random() * 16) % 16 | 0;
				dt = Math.floor(dt / 16);
				return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
			});
			return uuid;
		}
		*/
		}
	});
});