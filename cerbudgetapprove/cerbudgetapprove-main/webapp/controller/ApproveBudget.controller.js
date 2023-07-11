sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/UploadCollectionParameter",
	"sap/ui/unified/FileUploaderParameter",
	"sap/m/Dialog",
	"sap/m/Text",
	"sap/m/Button",
	"../model/formatter" 

], function (Controller, JSONModel, Filter, FilterOperator, UploadCollectionParameter, FileUploaderParameter, Dialog, Text, Button, Formatter) {
	"use strict";

	return Controller.extend("gb.wf.cer.budget.approve.controller.ApproveBudget", {
		formatter: Formatter,
		_sCompanyCode: undefined,
		_sCostCenter: undefined,
		_bType : undefined,
		_sInternalOrder: undefined,
		_requester: undefined,
		_requesterEmail: undefined,
		_requesterDisplayName: undefined,
		_isFirstTime: true,
		_PContext:"",
		
		onInit: function () {
			
			console.log("init in controller");
			var localModel = new sap.ui.model.json.JSONModel();
			localModel.setProperty("/isEditMode", false);
			this.getView().setModel(localModel, "lcl");
			var oContextModel = this.getOwnerComponent().getModel("ctx");
			var oInternalModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(oInternalModel, "InternalOrder");
			
			var Qtycheck = new sap.ui.model.json.JSONModel();
			Qtycheck.setProperty("/Qtycheck", true);
			this.getOwnerComponent().setModel(Qtycheck, "Qtycheck");
		
		//	this.getView().setModel(oContextModel, "budget");

	/*		oContextModel.attachRequestCompleted(function () {
				console.log("Attach attachRequestCompleted in cotroller");	
				this._sCompanyCode = oContextModel.getProperty("/legalEntity");
				this._sCostCenter = oContextModel.getProperty("/costCenter");
				this._sType = oContextModel.getProperty("/type");
				this._sInternalOrder = oContextModel.getProperty("/internalOrder");
				this._bindOrderComboWF();
				this._bindRadioButtons();
				this._bindVPComboBoxMF();
				this._bindChangeSupplementTable();
				
			}, this);
			*/
			console.log("Ende init in controller");	
			
		},
		// to enable select approver when budget amount changes in forwarded request [FR:987001413]
		_onChangesCtx:function(){
			var oModelData=this.getView().getModel("ctx").getData();
			this.getView().getModel("ctx").setProperty("/showApprovers",false);
			if(oModelData.requestedBudgetCurrentYear.toString()!==this._PContext.oInternalOrder.CurrentBudget){
			this.getView().getModel("ctx").setProperty("/showApprovers",true);
			}
			if(oModelData.requestdBudgetNextYear.toString()!==this._PContext.oInternalOrder.NextBudget){
			this.getView().getModel("ctx").setProperty("/showApprovers",true);
			}
			if(oModelData.legalEntityDisplayName!== this._PContext.legalEntityDisplayName){
			  this.getView().getModel("ctx").setProperty("/showApprovers",true);	
			}
			if(oModelData.costCenterDisplayName!==this._PContext.costCenterDisplayName){
				this.getView().getModel("ctx").setProperty("/showApprovers",true);
			}
			if(oModelData.internalOrderDisplayName!==this._PContext.internalOrderDisplayName){
				this.getView().getModel("ctx").setProperty("/showApprovers",true);
			}
			if(oModelData.type!==this._PContext.type){
				this.getView().getModel("ctx").setProperty("/showApprovers",true);
			}
		},

		onSelectLegalEntity: function (oEvent) {

			var oModel = this.getView().getModel("ctx");

			var costCenterComboBox = this.getView().byId("costCenterComboBoxwf");
			//if a new legal entity gets choosen the depending fields have to be cleared
			oModel.setProperty("/costCenter", undefined);

			var oSelectedItem = oEvent.getParameter("selectedItem");
			var oItemContext = oSelectedItem.getBindingContext("test");

			var sLegalEntityDisplayName = oItemContext.getProperty("CompanyCodeName");
			oModel.setData({
				legalEntityDisplayName: sLegalEntityDisplayName
			}, true);

			costCenterComboBox.setEnabled(true);
			costCenterComboBox.bindItems({
				path: "test>"+oItemContext.getPath() + "/to_CostCenter",
				length : 100000,
				template: new sap.ui.core.ListItem({
					key: "{test>CostCenter}",
					text: "{test>CostCenterName}",
					additionalText: "{test>CostCenterName}"
				})
			});
			
			var r = new sap.ui.model.json.JSONModel; /*added by Deeksha 02/11/2021*/
			var that = this;
			var oDataModel = this.getView().getModel("test");  
			var opath = oItemContext.getPath() + "/to_Currency";
                    oDataModel.read(opath, {
                    	success : function(oData, oResponse) {
                    		var oCurrency = oData;
                    		var oCurModel = new sap.ui.model.json.JSONModel();
			                that.getView().setModel(oCurModel, "Currency");
			                var currCode;
			                if(oData.Currency !== "USD") {
			                	currCode = "EUR";
			                }
			                else {
			                	currCode = oData.Currency;
			                }
			                that.getView().getModel("Currency").setData({"CurrencyCode":currCode});
			                that.getView().getModel("ctx").getData().currencyCode=currCode;
			                that.getView().getModel("ctx").setProperty("/currencyCode", currCode);
                    	},
                    	error : function(err){
                    		
                    	}
                    }); 
                    this._onChangesCtx();// [FR:987001413]
		},
		
		onSelectCostCenter: function (oEvent) {
			var oPurchaseModel = this.getView().getModel("ctx");
				oPurchaseModel.setProperty("/internalOrder", undefined);
				oPurchaseModel.setProperty("/internalOrderDisplayName", undefined);
			var oModel = this.getView().getModel("ctx");
			var internalOrderComboBox = this.getView().byId("internalOrderComboBoxWF");
			var legalEntityComboBox = this.getView().byId("legalEntityComboBoxWF");
			var opex = this.getView().byId("OC");
			var vpComboBox = this.getView().byId("vpComboBoxWF");
			var legalEntityKey = legalEntityComboBox.getSelectedKey();
			var oSelectedItem = oEvent.getParameter("selectedItem");
			var oItemContext = oSelectedItem.getBindingContext("test");
			var sCostCenterDisplayName = oItemContext.getProperty("CostCenterName");
			oModel.setData({
				costCenterDisplayName: sCostCenterDisplayName
			}, true);
			var costCenterKey = oSelectedItem.getKey();

			//bind internalOrders
			//internalOrderComboBox.setEnabled(true);
			var aFilter = [];
			aFilter.push(new Filter("CompanyCode", FilterOperator.EQ, legalEntityKey));
			aFilter.push(new Filter("CostCenter", FilterOperator.EQ, costCenterKey));
			if (opex.getSelected()) {
				aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "OC")); // = OPEX	
			} else {
				aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "IV")); // = CAPEX
			}

			// internalOrderComboBox.bindItems({
			// 	path: "test>/InternalOrder",
			// 	filters: aFilter,
			// 	length : 100000,
			// 	template: new sap.ui.core.ListItem({
			// 		key: "{test>OrderNumber}",
			// 		text: "{test>Description}",
			// 		additionalText: "{test>OrderNumber}"
			// 	})
			// });
			
			var tpath = "/InternalOrder";
			var oThis = this;
			var oDataModel = this.getOwnerComponent().getModel("test");
			var oInternal = this.getView().getModel("InternalOrder");
			oInternal.setData("");
			oInternal.setSizeLimit(100000);
			oDataModel.read(tpath, {
				filters: aFilter,
				success: function (oData, oResponse) {
					var oUserObject = {};
					oUserObject.Internal = oData.results;
					oInternal.setData(oUserObject);
					oThis.getView().setModel(oInternal, "IternalOrder");
				},
				error: function (err) {
					console.log(err); //disable Button next
				}
			});
			
			//bind vpApprovers
			vpComboBox.setEnabled(true);
			var aFilterVP = [];
			aFilterVP.push(new Filter("Zwfbukrs", FilterOperator.EQ, legalEntityKey));
			aFilterVP.push(new Filter("Zwfkstlh", FilterOperator.EQ, costCenterKey));
			aFilterVP.push(new Filter("Zwfrole1", FilterOperator.EQ, "VP"));
			
			var oModelTest = this.getView().getModel("test");
			
			var aResult = oModelTest.read("/SelectApprover", {
				filters: aFilterVP,
				success: function(data) {
					oModel.setProperty("/approvers/cfo/d/", data);
					
					console.log("Received Data");
					console.dir(data);
					console.dir(oModel);
				}
			});

/*			vpComboBox.bindItems({
				path: "test>/SelectApprover",
				sorter: {
					path: "SecondName"
				},
				filters: aFilterVP,

				template: new sap.ui.core.ListItem({
					key: "{test>Zwfdomain1}",
					text: "{test>SecondName}, {test>FirstName}"
				})
			});
*/
			//FUNCTION CALL
			var oBudgetModel = this.getView().getModel("ctx");
			this.getView().getModel("test").callFunction("/GetValidRequestors", {
				urlParameters: {
					Zwfdomain1: oBudgetModel.getProperty("/requester"),
					Zwfbukrs: legalEntityKey,
					Zwfkstlh: costCenterKey
				},
				success: function (oData, oResponse) {

					if (oResponse.data.results.length == 0) {
						//internalOrderComboBox.setEnabled(false);
						var erDialog = new Dialog({
							title: "Error",
							type: "Message",
							state: "Error",
							content: new Text({
								text: "Your not allowed to request budget for chosen legal Entity and Cost center."
							}),
							beginButton: new Button({
								text: "OK",
								press: function () {
									erDialog.close();
								}
							}),
							afterClose: function () {
								erDialog.destroy();
							}
						});
						erDialog.open();
					} /*else {
						internalOrderComboBox.setEnabled(true);

						oBudgetModel.setProperty("/requesterFirstName", oResponse.data.results[0].FirstName);
						oBudgetModel.setProperty("/requesterSecondName", oResponse.data.results[0].SecondName);
						oBudgetModel.setProperty("/Zwfmail1", oResponse.data.results[0].Zwfmail1);
						oBudgetModel.setProperty("/Zwfdomain1", oResponse.data.results[0].Zwfdomain1);
						oBudgetModel.setProperty("/Zwfname3", oResponse.data.results[0].Zwfname3);
						oBudgetModel.setProperty("/Zwfname4", oResponse.data.results[0].Zwfname4);
						oBudgetModel.setProperty("/Zwfmail2", oResponse.data.results[0].Zwfmail2);
						oBudgetModel.setProperty("/Zwfdomain2", oResponse.data.results[0].Zwfdomain2);
						oBudgetModel.setProperty("/requesterSecondName", oResponse.data.results[0].SecondName);
					}
*/
				}.bind(this),
				error: function (oError) {
					console.log(oError); //disable Button next
					//	this.getRouter().getTargets().display("userError");
				}.bind(this)
			});
			this._onChangesCtx(); // [FR:987001413]
		},
		
		handleValueHelpInternalOrder : function() {
			if (!this._oValueHelpDialog) {
				this._oValueHelpDialog = sap.ui.xmlfragment("gb.wf.cer.budget.approve.view.fragments.InternalOrderDialog", this);
				this.getView().addDependent(this._oValueHelpDialog);
			}
			
			// var legalEntityComboBox = this.getView().byId("legalEntityComboBox");
			// var legalEntityKey = legalEntityComboBox.getSelectedKey();
			// var costCenterComboBox = this.getView().byId("costCenterComboBox");
			// var costCenterKey = costCenterComboBox.getSelectedKey();
			// var aFilter = [];
			// aFilter.push(new Filter("CompanyCode", FilterOperator.EQ, legalEntityKey));
			// aFilter.push(new Filter("CostCenter", FilterOperator.EQ, costCenterKey));
			// 	var oOpex = this.getView().byId("OC");
			// if (oOpex.getSelected()) {
			// 	aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "OC")); // = OPEX	
			// } else {
			// 	aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "IV")); // = CAPEX
			// }
			
			// this._oValueHelpDialog.getBinding("items").filter(aFilter);
			// console.log(this._oValueHelpDialog.getBinding("items"));
			this._oValueHelpDialog.open();
		},
		
		handleSearchInternalOrder: function(oEvent) {
			var sValue = oEvent.getParameter("value");
		//	var oFilter = new Filter("Description", sap.ui.model.FilterOperator.Contains, sValue);
			
			// var legalEntityComboBox = this.getView().byId("legalEntityComboBox");
			// var legalEntityKey = legalEntityComboBox.getSelectedKey();
			// var costCenterComboBox = this.getView().byId("costCenterComboBox");
			// var costCenterKey = costCenterComboBox.getSelectedKey();
			
			
			var aFilter = [];
			aFilter.push(new Filter("Description", sap.ui.model.FilterOperator.Contains, sValue));
			// aFilter.push(new Filter("CompanyCode", FilterOperator.EQ, legalEntityKey));
			// aFilter.push(new Filter("CostCenter", FilterOperator.EQ, costCenterKey));
			// var oOpex = this.getView().byId("OC");
			// if (oOpex.getSelected()) {
			// 	aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "OC")); // = OPEX	
			// } else {
			// 	aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "IV")); // = CAPEX
			// }
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter(aFilter);
		},
		
		handleSuggest: function(oEvent){
			var sValue = oEvent.getParameter("suggestValue");
		//	var oFilter = new Filter("Description", sap.ui.model.FilterOperator.Contains, sValue);
			
			// var legalEntityComboBox = this.getView().byId("legalEntityComboBox");
			// var legalEntityKey = legalEntityComboBox.getSelectedKey();
			// var costCenterComboBox = this.getView().byId("costCenterComboBox");
			// var costCenterKey = costCenterComboBox.getSelectedKey();
			
			
			var aFilter = [];
			aFilter.push(new Filter("Description", sap.ui.model.FilterOperator.Contains, sValue));
			// aFilter.push(new Filter("CompanyCode", FilterOperator.EQ, legalEntityKey));
			// aFilter.push(new Filter("CostCenter", FilterOperator.EQ, costCenterKey));
			// var oOpex = this.getView().byId("OC");
			// if (oOpex.getSelected()) {
			// 	aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "OC")); // = OPEX	
			// } else {
			// 	aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "IV")); // = CAPEX
			// }
			var oBinding = oEvent.getSource().getBinding("suggestionItems");
			oBinding.filter(aFilter);
		},
		
		onSelectInternalOrder: function (oEvent) {
			var oModel = this.getView().getModel("ctx");
			// var oSelectedItem = oEvent.getParameter("selectedItem");
			var oSelectedItem = oEvent.getParameter("selectedContexts");
			//for suggestion: oEvent.getParameter("selectedItem").getText() | getKey()
			if (oSelectedItem && oSelectedItem.length) {
				var sOrderNumber = oSelectedItem[0].getObject().OrderNumber;
				var sOrderDescription = oSelectedItem[0].getObject().Description;
				var oPurchaseModel = this.getView().getModel("ctx");
				oPurchaseModel.setProperty("/internalOrder",sOrderNumber);
				oPurchaseModel.setProperty("/internalOrderDisplayName",sOrderDescription);
				
			// var oItemContext = oSelectedItem.getBindingContext("test");
			// var sInternalOrderDisplayName = oItemContext.getProperty("Description");
			// oModel.setData({
			// 	internalOrderDisplayName: sInternalOrderDisplayName
			// }, true);
			// var internalOrderComboBox = this.getView().byId("internalOrderComboBoxWF");
			// var internalOrderKey = internalOrderComboBox.getSelectedKey();

			var tableChangeSupplement = this.getView().byId("changeSupplementTable");

			var aFilter = [];
			aFilter.push(new Filter("InternalOrder", FilterOperator.EQ, sOrderNumber));
			tableChangeSupplement.bindRows({
				path: "test>/RequestedOrder",
				filters: aFilter
			});

			var oModelTest = this.getView().getModel("test");
			
			var aResult = oModelTest.read("/RequestedOrder", {
				filters: aFilter,
				success: function(data) {
					oModel.setProperty("/budgets/d/", data);
					
					console.log("Received Data");
					console.dir(data);
					console.dir(oModel);
				}
			});
			this._onChangesCtx(); // [FR:987001413]
			//tableChangeSupplement.getBinding("items").filter(aFilter);
			}
			
		},

		onTypeChange: function (oEvent) {
			var oPurchaseModel = this.getView().getModel("ctx");
				oPurchaseModel.setProperty("/internalOrder", undefined);
				oPurchaseModel.setProperty("/internalOrderDisplayName", undefined);
			var internalOrderComboBox = this.getView().byId("internalOrderComboBoxWF");
			var legalEntityComboBox = this.getView().byId("legalEntityComboBoxWF");
			var opex = this.getView().byId("OC");
			var legalEntityKey = legalEntityComboBox.getSelectedKey();
			var costCenterComboBox = this.getView().byId("costCenterComboBoxwf");
			var costCenterKey = costCenterComboBox.getSelectedKey();

			if (legalEntityKey !== "" && costCenterKey !== "") {
				var aFilter = [];
				aFilter.push(new Filter("CompanyCode", FilterOperator.EQ, legalEntityKey));
				aFilter.push(new Filter("CostCenter", FilterOperator.EQ, costCenterKey));
				if (opex.getSelected()) {
					aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "OC")); // = OPEX	
					oPurchaseModel.setData({type: "OC"}, true);
					oPurchaseModel.setData({typeDisplayText: "OPEX"}, true);
				} else {
					aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "IV")); // = CAPEX
					oPurchaseModel.setData({type: "IV"}, true);
					oPurchaseModel.setData({typeDisplayText: "CAPEX"}, true);
				}
				// internalOrderComboBox.bindItems({
				// 	path: "test>/InternalOrder",
				// 	filters: aFilter,
				// 	length : 10000,
				// 	template: new sap.ui.core.ListItem({
				// 		key: "{test>OrderNumber}",
				// 		text: "{test>Description}",
				// 		additionalText: "{test>OrderNumber}"
				// 	})
				// });
			var tpath = "/InternalOrder";
			var oThis = this;
			var oDataModel = this.getOwnerComponent().getModel("test");
			var oInternal = this.getView().getModel("InternalOrder");
			oInternal.setData("");
			oInternal.setSizeLimit(100000);
			oDataModel.read(tpath, {
				filters: aFilter,
				success: function (oData, oResponse) {
					var oUserObject = {};
					oUserObject.Internal = oData.results;
					oInternal.setData(oUserObject);
					oThis.getView().setModel(oInternal, "IternalOrder");
				},
				error: function (err) {
					console.log(err); //disable Button next
				}
			});
			this._onChangesCtx(); // [FR:987001413]
			}
		},
		
		_bindOrderComboWF: function () {
			// if(this._isFirstTime){
			// 	this._isFirstTime= false;
			// 	return;
			// }
/*			return new Promise(
				function(resolve, reject) {
					var internalOrderComboBoxWF = this.getView().byId("internalOrderComboBoxWF");
					var aFilter = [];
					aFilter.push(new Filter("CompanyCode", FilterOperator.EQ, this._sCompanyCode));
					aFilter.push(new Filter("CostCenter", FilterOperator.EQ, this._sCostCenter));
			//if (opex.getSelected()) {
					aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "OC")); // = OPEX
				var oComboBox = internalOrderComboBoxWF.bindItems({
					path: "test>/InternalOrder",
					filters: aFilter,
					template: new sap.ui.core.ListItem({
						key: "{test>OrderNumber}",
						text: "{test>Description}",
					additionalText: "{test>OrderNumber}"
				})
			});
					oComboBox.getBinding("items").attachDataReceived(function(){
    					alert("Success");
					
				  if(oComboBox !== null && oComboBox !== undefined){
				  	 resolve();
				  }else{
				  	reject();
				  }
        		}.bind(this));
*/        		
			var sCostCenter = this.getView().getModel("ctx").getProperty("/costCenter");
			var sLegalEntity = this.getView().getModel("ctx").getProperty("/legalEntity");
			var internalOrderComboBoxWF = this.getView().byId("internalOrderComboBoxWF");
			var aFilter = [];
			aFilter.push(new Filter("CompanyCode", FilterOperator.EQ, sLegalEntity));
			aFilter.push(new Filter("CostCenter", FilterOperator.EQ, sCostCenter));
			//if (opex.getSelected()) {
			aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "OC")); // = OPEX	
			//} else {
			//	aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "IV")); // = CAPEX
			//}
			
			
			// internalOrderComboBoxWF.bindItems({
			// 	path: "test>/InternalOrder",
			// 	filters: aFilter,
			// 	template: new sap.ui.core.ListItem({
			// 		key: "{test>OrderNumber}",
			// 		text: "{test>Description}",
			// 		additionalText: "{test>OrderNumber}"
			// 	})
			// });
			
			var tpath = "/InternalOrder";
			var oThis = this;
			var oDataModel = this.getOwnerComponent().getModel("test");
			var oInternal = this.getView().getModel("InternalOrder");
			oInternal.setData("");
			oInternal.setSizeLimit(100000);
			oDataModel.read(tpath, {
				filters: aFilter,
				success: function (oData, oResponse) {
					var oUserObject = {};
					oUserObject.Internal = oData.results;
					oInternal.setData(oUserObject);
					oThis.getView().setModel(oInternal, "IternalOrder");
				},
				error: function (err) {
					console.log(err); //disable Button next
				}
			});
			

			
			var costCenterComboBoxWF = this.getView().byId("costCenterComboBoxwf");
			costCenterComboBoxWF.bindItems({
				path: "test>/LegalEntity(\'"+sLegalEntity+"\')/to_CostCenter",
				template: new sap.ui.core.ListItem({
					key: "{test>CostCenter}",
					text: "{test>CostCenterName}",
					additionalText: "{test>CostCenter}"
				})
			});
			
			
			costCenterComboBoxWF.getBinding("items").attachDataReceived(function(){
    			console.log("Success");
    			this.getView().getModel("lcl").setProperty("/isEditMode", true);
			}.bind(this));

		},



		_bindRadioButtons: function(){
			if(this._sType === "OC"){
				this.getView().byId("OC_WF").setSelected(true);
				this.getView().byId("IV_WF").setSelected(false);
			}else if(this._sType === "IV"){
				this.getView().byId("OC_WF").setSelected(false);
				this.getView().byId("IV_WF").setSelected(true);
			}	
		},
		
		_bindVPComboBoxMF: function(){
			var oVPComboBox = this.getView().byId("vpComboBoxMF");
			var aFilterVP = [];
			aFilterVP.push(new Filter("Zwfbukrs", FilterOperator.EQ, this._sCompanyCode));
			aFilterVP.push(new Filter("Zwfkstlh", FilterOperator.EQ, this._sCostCenter));
			aFilterVP.push(new Filter("Zwfrole1", FilterOperator.EQ, "VP"));

			oVPComboBox.bindItems({
				path: "test>/SelectApprover",
				sorter: {
					path: "SecondName"
				},
				filters: aFilterVP,

				template: new sap.ui.core.ListItem({
					key: "{test>Zwfdomain1}",
					text: "{test>FirstName} {test>SecondName}"
				})
			});
		},

		onPressedEdit: function(oEvent){
			var oContextModel = this.getOwnerComponent().getModel("ctx");
			this._sCompanyCode = oContextModel.getProperty("/legalEntity");
			this._sCostCenter = oContextModel.getProperty("/costCenter");
			this._sType = oContextModel.getProperty("/type");
			this._sInternalOrder = oContextModel.getProperty("/internalOrder");
			this.getView().getModel("lcl").setProperty("/isEditMode", true); // Uncommented by Dhanush 
			this._bindOrderComboWF();//then(this._onSuccess(),this._onReject() );
		},
		
		_onSuccess: function(){
			this.getView().getModel("lcl").setProperty("/isEditMode", true);
		},
		_onReject: function(){
			console.log("_onReject");
		},
		
/*		onPressCallService: function(oEvent){
			
			var oModel = this.getView().getModel("test");
			var aResult = oModel.read("/LegalEntity", {
				success: function(data) {
					console.log("Received Data");
					console.dir(data);
				}
			});
			console.log("RESULT",oModel);
			var basePath = '/sap/opu/odata'; // WebIDE
			
			basePath = '/sap/fiori/cerbudgetapprove/sap/opu/odata'; // Fiori FLP
			/sap/fiori/cerbudgetapprove/sap/opu/odata/sap/Z_WORKFLOW_SRV/cauculateTotal
			$.ajax({
					url: basePath + "/sap/Z_WORKFLOW_SRV/LegalEntity",
					method: "GET",
					headers: {
						"X-CSRF-Token": "Fetch"
					},
					success: function (result, xhr, data) {
						var token = data.getResponseHeader("X-CSRF-Token");
						$.ajax({
							url: basePath + "/sap/Z_WORKFLOW_SRV/LegalEntity?$format=json",
							method: "GET",
							contentType: "application/json",

							headers: {
								"X-CSRF-Token": token
							},
							success: function(response){
								console.dir(response);
							},
							error:function(response){
								console.log(response);
							}
						});
					}.bind(this),
					error: function(response){
						console.log(response);
					}
				});
				
		},
*/	


//ORIGINAL
/*
		onSelectApprover: function (oEvent) {
			var oModelCtx = this.getView().getModel("ctx");
			var params = oEvent.getParameters();
			var sEmail = params.selectedItem.getBindingContext("ctx").getProperty("Zwfmail1");
			var sUserId = params.selectedItem.getBindingContext("ctx").getProperty("Zwfdomain1").toLowerCase();
			var sApproverName = params.selectedItem.getBindingContext("ctx").getProperty("FirstName") + " " + params.selectedItem.getBindingContext("ctx").getProperty("SecondName");
			oModelCtx.setProperty("/approverNameForStatusReport", sApproverName);
			oModelCtx.setProperty("/approver", sUserId);
			
			var sWorkflowStep = oModelCtx.getProperty("/workflowStep");
			var commentField = oModelCtx.getProperty("/defaultComment");
			if(oModelCtx.getProperty("/isForwarderSelected")){
				oModelCtx.setProperty("/isApproverChanged", false);
			}else{
				oModelCtx.setProperty("/isApproverChanged", true);
			}
			if (sWorkflowStep === 1) {
				oModelCtx.setProperty("/vpApprover", sApproverName);
				oModelCtx.setProperty("/vpMail", sEmail);
				oModelCtx.setProperty("/vpApproverId", sUserId);
				oModelCtx.setProperty("/reqComment", commentField);
			}else if (sWorkflowStep === 2) {
				oModelCtx.setProperty("/ccApprover", sApproverName);
				oModelCtx.setProperty("/ccMail", sEmail);
				oModelCtx.setProperty("/ccApproverId", sUserId);
				oModelCtx.setProperty("/vpComment", commentField);
			} else if (sWorkflowStep === 3) {
				oModelCtx.setProperty("/cfoApprover", sApproverName);
				oModelCtx.setProperty("/cfoMail", sEmail);
				oModelCtx.setProperty("/cfoApproverId", sUserId);
				oModelCtx.setProperty("/ccComment", commentField);
			} else if (sWorkflowStep === 4) {
				oModelCtx.setProperty("/md1Approver", sApproverName);
				oModelCtx.setProperty("/md1Mail", sEmail);
				oModelCtx.setProperty("/md1ApproverId", sUserId);
				oModelCtx.setProperty("/cfoComment", commentField);
			} else if (sWorkflowStep === 5) {
				oModelCtx.setProperty("/md2Approver", sApproverName);
				oModelCtx.setProperty("/md2Mail", sEmail);
				oModelCtx.setProperty("/md2ApproverId", sUserId);
				oModelCtx.setProperty("/md1Comment", commentField);
			} else if (sWorkflowStep === 6) {
				oModelCtx.setProperty("/ceoApprover", sApproverName);
				oModelCtx.setProperty("/ceoMail", sEmail);
				oModelCtx.setProperty("/ceoApproverId", sUserId);
				oModelCtx.setProperty("/md2Comment", commentField);
			} else if (sWorkflowStep === 7) {
				oModelCtx.setProperty("/cfoComment", commentField);
				oModelCtx.setProperty("/cfoMail", sEmail);
			}
		},


		onSelectForwarding: function(oEvent){
			var params = oEvent.getParameters();
			var sEmail = params.selectedItem.getBindingContext("ctx").getProperty("Email");
			var sUserId = params.selectedItem.getBindingContext("ctx").getProperty("Zwfdomain1").toLowerCase();
			var sApproverName = params.selectedItem.getBindingContext("ctx").getProperty("FirstName") + " " + params.selectedItem.getBindingContext("ctx").getProperty("SecondName");
			var sApproverNameFullName = params.selectedItem.getBindingContext("ctx").getProperty("Name");
			var sRole = params.selectedItem.getBindingContext("ctx").getProperty("Role");
			var oModel = this.getView().getModel("ctx");
			
			
			oModel.setProperty("/forwardToRole", sRole);
			this.getView().getModel("ctx").setProperty("/isForwarderSelected", true);
			if(sRole === 'NONE'){
				oModel.setProperty("/isForwardingToRequester",false);
				oModel.setProperty("/isForwardingToVP",false);
				oModel.setProperty("/isForwardingToCC",false);
				oModel.setProperty("/isForwardingToCFO",false);
				oModel.setProperty("/isForwardingToMD1",false);
				oModel.setProperty("/isForwardingToMD2",false);
			}else if(sRole ==='Requester'){
				oModel.setProperty("/isForwardingToRequester",true);
				oModel.setProperty("/isForwardingToVP",false);
				oModel.setProperty("/isForwardingToCC",false);
				oModel.setProperty("/isForwardingToCFO",false);
				oModel.setProperty("/isForwardingToMD1",false);
				oModel.setProperty("/isForwardingToMD2",false);
				oModel.setProperty("/fwdReqMail",sEmail);
				oModel.setProperty("/fwdReqId",sUserId);
				oModel.setProperty("/fwdReqApprover",sApproverNameFullName);
				
			}else if(sRole ==='VP'){
				oModel.setProperty("/isForwardingToRequester",false);
				oModel.setProperty("/isForwardingToVP",true);
				oModel.setProperty("/isForwardingToCC",false);
				oModel.setProperty("/isForwardingToCFO",false);
				oModel.setProperty("/isForwardingToMD1",false);
				oModel.setProperty("/isForwardingToMD2",false);
				oModel.setProperty("/fwdVPMail",sEmail);
				oModel.setProperty("/fwdVPId",sUserId);
				oModel.setProperty("/fwdVPApprover",sApproverNameFullName);

			}else if(sRole ==='CONTROLLING'){
				oModel.setProperty("/isForwardingToRequester",false);
				oModel.setProperty("/isForwardingToVP",false);
				oModel.setProperty("/isForwardingToCC",true);
				oModel.setProperty("/isForwardingToCFO",false);
				oModel.setProperty("/isForwardingToMD1",false);
				oModel.setProperty("/isForwardingToMD2",false);
				oModel.setProperty("/fwdCCMail",sEmail);
				oModel.setProperty("/fwdCCId",sUserId);
				oModel.setProperty("/fwdCCApprover",sApproverNameFullName);
			}else if(sRole ==='CFO'){
				oModel.setProperty("/isForwardingToRequester",false);
				oModel.setProperty("/isForwardingToVP",false);
				oModel.setProperty("/isForwardingToCC",false);
				oModel.setProperty("/isForwardingToCFO",true);
				oModel.setProperty("/isForwardingToMD1",false);
				oModel.setProperty("/isForwardingToMD2",false);
				oModel.setProperty("/fwdCFOMail",sEmail);
				oModel.setProperty("/fwdCFOId",sUserId);
				oModel.setProperty("/fwdCFOApprover",sApproverNameFullName);
			}else if(sRole ==='MD1'){
				oModel.setProperty("/isForwardingToRequester",false);
				oModel.setProperty("/isForwardingToVP",false);
				oModel.setProperty("/isForwardingToCC",false);
				oModel.setProperty("/isForwardingToCFO",false);
				oModel.setProperty("/isForwardingToMD1",true);
				oModel.setProperty("/isForwardingToMD2",false);
				oModel.setProperty("/fwdMD1Mail",sEmail);
				oModel.setProperty("/fwdMD1Id",sUserId);
				oModel.setProperty("/fwdMD1Approver",sApproverNameFullName);
			}else if(sRole ==='MD2'){
				oModel.setProperty("/isForwardingToRequester",false);
				oModel.setProperty("/isForwardingToVP",false);
				oModel.setProperty("/isForwardingToCC",false);
				oModel.setProperty("/isForwardingToCFO",false);
				oModel.setProperty("/isForwardingToMD1",false);
				oModel.setProperty("/isForwardingToMD2",true);
				oModel.setProperty("/fwdMD2Mail",sEmail);
				oModel.setProperty("/fwdMD2Id",sUserId);
				oModel.setProperty("/fwdMD2Approver",sApproverNameFullName);
			}
			console.log(sEmail,sUserId, sApproverName, sRole, sApproverNameFullName);
			this.onSelectApprover(oEvent);
		},
ENDE ORIGINAL		
		*/
		
//Anfang UMBAU
		onSelectApprover: function (oEvent) {
			var oModel = this.getView().getModel("ctx");
			oModel.setProperty("/isApproverChanged", true);
			oModel.setProperty("/forwardedToApprover", null);
			oModel.setProperty("/isForwarderSelected", false);
			// oModel.setProperty("/forwardedToApprover", null);
			this.setCommentsAndMailing(oEvent);
		},


		onSelectForwarding: function(oEvent){
			var params = oEvent.getParameters();
			var sEmail = params.selectedItem.getBindingContext("ctx").getProperty("Email");
			var sUserId = params.selectedItem.getBindingContext("ctx").getProperty("Zwfdomain1").toLowerCase();
			var sApproverName = params.selectedItem.getBindingContext("ctx").getProperty("FirstName") + " " + params.selectedItem.getBindingContext("ctx").getProperty("SecondName");
			var sApproverNameFullName = params.selectedItem.getBindingContext("ctx").getProperty("Name");
			var sRole = params.selectedItem.getBindingContext("ctx").getProperty("DeputyRole");
			var oModel = this.getView().getModel("ctx");
			oModel.setProperty("/isApproverChanged", false);
			oModel.setProperty("/selectedNextApprover", null);
			oModel.setProperty("/forwardToRole", sRole);
			this.getView().getModel("ctx").setProperty("/isForwarderSelected", true);
			if(sRole === 'NONE'){
				oModel.setProperty("/isForwardingToRequester",false);
				oModel.setProperty("/isForwardingToVP",false);
				oModel.setProperty("/isForwardingToCC",false);
				oModel.setProperty("/isForwardingToCFO",false);
				oModel.setProperty("/isForwardingToMD1",false);
				oModel.setProperty("/isForwardingToMD2",false);
				oModel.setProperty("/isForwardingToCEO",false);
			}else if(sRole ==='REQUESTER'){
				oModel.setProperty("/isForwardingToRequester",true);
				oModel.setProperty("/isForwardingToPJM",false);
				oModel.setProperty("/isForwardingToVP",false);
				oModel.setProperty("/isForwardingToCC",false);
				oModel.setProperty("/isForwardingToCFO",false);
				oModel.setProperty("/isForwardingToMD1",false);
				oModel.setProperty("/isForwardingToMD2",false);
				oModel.setProperty("/isForwardingToCEO",false);
				oModel.setProperty("/fwdReqMail",sEmail);
				oModel.setProperty("/fwdReqId",sUserId);
				oModel.setProperty("/fwdReqApprover",sApproverNameFullName);
			}else if(sRole ==='VP'){
				oModel.setProperty("/isForwardingToRequester",false);
				oModel.setProperty("/isForwardingToVP",true);
				oModel.setProperty("/isForwardingToCC",false);
				oModel.setProperty("/isForwardingToCFO",false);
				oModel.setProperty("/isForwardingToMD1",false);
				oModel.setProperty("/isForwardingToMD2",false);
				oModel.setProperty("/isForwardingToCEO",false);
				oModel.setProperty("/fwdVPMail",sEmail);
				oModel.setProperty("/fwdVPId",sUserId);
				oModel.setProperty("/fwdVPApprover",sApproverNameFullName);
			}else if(sRole ==='CONTROLLING'){
				oModel.setProperty("/isForwardingToRequester",false);
				oModel.setProperty("/isForwardingToVP",false);
				oModel.setProperty("/isForwardingToCC",true);
				oModel.setProperty("/isForwardingToCFO",false);
				oModel.setProperty("/isForwardingToMD1",false);
				oModel.setProperty("/isForwardingToMD2",false);
				oModel.setProperty("/isForwardingToCEO",false);
				oModel.setProperty("/fwdCCMail",sEmail);
				oModel.setProperty("/fwdCCId",sUserId);
				oModel.setProperty("/fwdCCApprover",sApproverNameFullName);
			}else if(sRole ==='CFO'){
				oModel.setProperty("/isForwardingToRequester",false);
				oModel.setProperty("/isForwardingToVP",false);
				oModel.setProperty("/isForwardingToCC",false);
				oModel.setProperty("/isForwardingToCFO",true);
				oModel.setProperty("/isForwardingToMD1",false);
				oModel.setProperty("/isForwardingToMD2",false);
				oModel.setProperty("/isForwardingToCEO",false);
				oModel.setProperty("/fwdCFOMail",sEmail);
				oModel.setProperty("/fwdCFOId",sUserId);
				oModel.setProperty("/fwdCFOApprover",sApproverNameFullName);
			}else if(sRole ==='MD1'){
				oModel.setProperty("/isForwardingToRequester",false);
				oModel.setProperty("/isForwardingToVP",false);
				oModel.setProperty("/isForwardingToCC",false);
				oModel.setProperty("/isForwardingToCFO",false);
				oModel.setProperty("/isForwardingToMD1",true);
				oModel.setProperty("/isForwardingToMD2",false);
				oModel.setProperty("/isForwardingToCEO",false);
				oModel.setProperty("/fwdMD1Mail",sEmail);
				oModel.setProperty("/fwdMD1Id",sUserId);
				oModel.setProperty("/fwdMD1Approver",sApproverNameFullName);
			}else if(sRole ==='MD2'){
				oModel.setProperty("/isForwardingToRequester",false);
				oModel.setProperty("/isForwardingToVP",false);
				oModel.setProperty("/isForwardingToCC",false);
				oModel.setProperty("/isForwardingToCFO",false);
				oModel.setProperty("/isForwardingToMD1",false);
				oModel.setProperty("/isForwardingToMD2",true);
				oModel.setProperty("/isForwardingToCEO",false);
				oModel.setProperty("/fwdMD2Mail",sEmail);
				oModel.setProperty("/fwdMD2Id",sUserId);
				oModel.setProperty("/fwdMD2Approver",sApproverNameFullName);
			}else if(sRole ==='CEO'){
				oModel.setProperty("/isForwardingToRequester",false);
				oModel.setProperty("/isForwardingToVP",false);
				oModel.setProperty("/isForwardingToCC",false);
				oModel.setProperty("/isForwardingToCFO",false);
				oModel.setProperty("/isForwardingToMD1",false);
				oModel.setProperty("/isForwardingToMD2",false);
				oModel.setProperty("/isForwardingToCEO",true);
				oModel.setProperty("/fwdCEOMail",sEmail);
				oModel.setProperty("/fwdCEOId",sUserId);
				oModel.setProperty("/fwdCEOApprover",sApproverNameFullName);
			}
			console.log(sEmail,sUserId, sApproverName, sRole, sApproverNameFullName);
			this.setCommentsAndMailing(oEvent);
			this.setForwardedData();//set forwarded approver data
		},
       //set forwarded approver data on selecting the forward approver // [FR:987001413]
		setForwardedData:function(){
			var oModel = this.getView().getModel("ctx");
			var wfStep=oModel.getProperty("/workflowStep");
			var lData=oModel.getProperty("/aApproverLevelList/"+(wfStep-1));
			oModel.setData({
				"iForwardedId":lData.Id,
				"iForwardedEmail":oModel.getProperty("/nextApprover"),
				"iForwardedName":lData.Name,
				"iForwardedRole":lData.LevelDesc,
				"iForwardedUsers":oModel.getProperty("/oForwardingUsers")
			},true);
			
		},
		setCommentsAndMailing: function(oEvent){
			var oModelCtx = this.getView().getModel("ctx");
			var params = oEvent.getParameters();
			var binding = oEvent.getParameters().selectedItem.getBindingContext("ctx");
			var path = binding.sPath;
			var selectedItemData = binding.getModel().getProperty(path);
			oModelCtx.setProperty("/nextApproverMailAddress", selectedItemData.Zwfdomain1);
			if(selectedItemData.Zwfrole1===undefined){
				if(selectedItemData.Role!=="MD1" || selectedItemData.Role!=="MD2"){
				oModelCtx.setProperty("/nextApproverRole", selectedItemData.Role);
				}
				else if(selectedItemData.Role==="MD1" || selectedItemData.Role==="MD2"){
					oModelCtx.setProperty("/nextApproverRole", "MD");
				}
			}
			else if(selectedItemData.Role===undefined){
				if(selectedItemData.Zwfrole1!=="MD1" || selectedItemData.Zwfrole1!=="MD2"){
				oModelCtx.setProperty("/nextApproverRole", selectedItemData.Zwfrole1);
				}
				else if(selectedItemData.Zwfrole1==="MD1" || selectedItemData.Zwfrole1==="MD2"){
					oModelCtx.setProperty("/nextApproverRole", "MD");
				}
				// oModelCtx.setProperty("/nextApproverRole", selectedItemData.Zwfrole1);
			}
			
			var sEmail = params.selectedItem.getBindingContext("ctx").getProperty("Zwfdomain1");
			var sUserId = params.selectedItem.getBindingContext("ctx").getProperty("Zwfdomain1").toLowerCase();
			var sApproverName = params.selectedItem.getBindingContext("ctx").getProperty("FirstName") + " " + params.selectedItem.getBindingContext("ctx").getProperty("SecondName");
			//need forward user changes for approval
			oModelCtx.setProperty("/nextApproverName", sApproverName);
			oModelCtx.setProperty("/approverName", sApproverName);
			oModelCtx.setProperty("/approverNameForStatusReport", sApproverName);
			oModelCtx.setProperty("/approver", sUserId);
			var sWorkflowStep = oModelCtx.getProperty("/workflowStep"); 
			var commentField = oModelCtx.getProperty("/defaultComment");
			if (sWorkflowStep === 1) {
				oModelCtx.setProperty("/vpApprover", sApproverName);
				oModelCtx.setProperty("/vpMail", sEmail);
				oModelCtx.setProperty("/vpApproverId", sUserId);
				oModelCtx.setProperty("/reqComment", commentField);
			}else if (sWorkflowStep === 2) {
				oModelCtx.setProperty("/ccApprover", sApproverName);
				oModelCtx.setProperty("/ccMail", sEmail);
				oModelCtx.setProperty("/ccApproverId", sUserId);
				oModelCtx.setProperty("/vpComment", commentField);
			} else if (sWorkflowStep === 3) {
				oModelCtx.setProperty("/cfoApprover", sApproverName);
				oModelCtx.setProperty("/cfoMail", sEmail);
				oModelCtx.setProperty("/cfoApproverId", sUserId);
				oModelCtx.setProperty("/ccComment", commentField);
			} else if (sWorkflowStep === 4) {
				oModelCtx.setProperty("/md1Approver", sApproverName);
				oModelCtx.setProperty("/md1Mail", sEmail);
				oModelCtx.setProperty("/md1ApproverId", sUserId);
				oModelCtx.setProperty("/cfoComment", commentField);
			} else if (sWorkflowStep === 5) {
				oModelCtx.setProperty("/md2Approver", sApproverName);
				oModelCtx.setProperty("/md2Mail", sEmail);
				oModelCtx.setProperty("/md2ApproverId", sUserId);
				oModelCtx.setProperty("/md1Comment", commentField);
			} else if (sWorkflowStep === 6) {
				oModelCtx.setProperty("/ceoApprover", sApproverName);
				oModelCtx.setProperty("/ceoMail", sEmail);
				oModelCtx.setProperty("/ceoApproverId", sUserId);
				oModelCtx.setProperty("/md2Comment", commentField);
			} else if (sWorkflowStep === 7) {
				oModelCtx.setProperty("/cfoComment", commentField);
				oModelCtx.setProperty("/cfoMail", sEmail);
			}
		},
//Ende UMBAU
		
		_bindChangeSupplementTable: function(){
				var oContextModel = this.getOwnerComponent().getModel("ctx");
				var oTableChangeSupplementWF = this.getView().byId("changeSupplementTable");
				var aFilter = [];
				aFilter.push(new Filter("InternalOrder", FilterOperator.EQ, oContextModel.getProperty("/internalOrder")));
				oTableChangeSupplementWF.bindRows({
					path: "test>/RequestedOrder",
					filters: aFilter
				});	
			},
		
		onAfterRendering: function () {
			if (this.getOwnerComponent().getModel("dLoadModel").getProperty("/dataLoaded") === true) {
				this._ondataModification();
			} else {
				this.getOwnerComponent().getModel("dLoadModel").bindProperty("/dataLoaded").attachChange(function (event) {
					this._ondataModification();
				}.bind(this));
			}
		},
		_ondataModification:function(){
				this._bindChangeSupplementTable();
				var bucketId = this.getView().getModel("ctx").getProperty("/bucketId");
				this._PContext=this.getView().getModel("ctx").getData();
				var sPath = "/Buckets(\'" + bucketId + "\')/Files";
				var oUploadCollection = this.getView().byId("UploadCollection");
				oUploadCollection.getBinding("items").sPath = sPath;
				oUploadCollection.getBinding("items").refresh();
		},

		getAttachmentURLs: function(){
				var sUrls = "-----";
				var aItems = this.getView().byId("UploadCollection").getItems();
				if(aItems.length > 0){
					 sUrls = aItems.map(function(row){
						return row.getUrl();
					}).join("\n");
				}
				return sUrls;
		},

		onFileDelete: function (oEvent) {
			var item = oEvent.getParameter("item");
			var ctx = item.getBinding("fileName").getContext();
			ctx.getModel().remove(ctx.getPath());
			var oUploadCollection = oEvent.getSource();
			var cItems = oUploadCollection.aItems.length;
			var tmp = oUploadCollection.aItems;
			console.log(tmp);
			this.getAttachmentURLs();
		},

		onBeforeUploadStarts: function (oEvent) {
			var bucketId = this.getView().getModel("ctx").getProperty("/bucketId");
			var bucketPath = "/Buckets(\'" + bucketId + "\')/Files";
			this.getView().getModel("ctx").setProperty("/bucketPath", bucketPath);
			var oUploadCollection = this.getView().byId("UploadCollection"),
				oFileUploader = oUploadCollection._getFileUploader();
			oFileUploader.setUseMultipart(true);
			oFileUploader.addParameter(new FileUploaderParameter({
				name: "fileName",
				value: oEvent.getParameter("fileName")
			}));
			oFileUploader.addParameter(new FileUploaderParameter({
				name: "bucketId",
				value: bucketId
			}));
			oFileUploader.oFileUpload.name = "file";
			return true;

		},

		onUploadComplete: function (oEvent) {
			var oUploadCollection = oEvent.getSource();
			var cItems = oUploadCollection.aItems.length;

			for (var i = 0; i < cItems; i++) {
				if (oUploadCollection.aItems[i]._status === "uploading") {
					oUploadCollection.aItems[i]._percentUploaded = 100;
					oUploadCollection.aItems[i]._status = oUploadCollection._displayStatus;
					oUploadCollection.aItems[i]["set_status"] = oUploadCollection._displayStatus;
					oUploadCollection._oItemToUpdate = null;
					break;
				}
			}

			oEvent.getSource().getBinding("items").refresh();
			this.getAttachmentURLs();
		},
		
		onChangeAmount: function(oEvent){
			var oModel = this.getView().getModel("ctx").getData();
			var sum = parseFloat(oModel.requestedBudgetCurrentYear) + parseFloat(oModel.requestdBudgetNextYear);
		
		
			if(oModel.nextApproverPjm !== undefined){
				
				if(sum >= 1000){
					this.getOwnerComponent().getModel("Qtycheck").setProperty("/Qtycheck", false);
					var erDialog = new Dialog({
							title: "Error",
							type: "Message",
							state: "Error",
							content: new Text({
								text: "The Sum of the entered budget should be less than 1000 for PJM requests"
							}),
							beginButton: new Button({
								text: "OK",
								press: function () {
									erDialog.close();
								}
							}),
							afterClose: function () {
								erDialog.destroy();
							}
						});
						erDialog.open();
				}
				else{
					this.getOwnerComponent().getModel("Qtycheck").setProperty("/Qtycheck", true);
					this._onChangesCtx();// [FR:987001413]
				}
			}else{
				this._onChangesCtx();// [FR:987001413]
			}
		}
	});
});