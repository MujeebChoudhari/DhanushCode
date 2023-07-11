sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/Button",
	"sap/m/Dialog",
	"sap/m/Text",
	"sap/m/UploadCollectionParameter",
	"sap/ui/unified/FileUploaderParameter",
	"sap/m/MessageToast",
	"../model/formatter",
	"sap/ui/model/type/Float"
], function (Controller, JSONModel, Filter, FilterOperator, Button, Dialog, Text, UploadCollectionParameter, FileUploaderParameter,
	MessageToast, Formatter, Float) {
	"use strict";

	return Controller.extend("gb.wf.cer.invoice.init.controller.InitBudgetWorkflow", {
		formatter: Formatter,

		_sCompanyCode: undefined,
		_sCostCenter: undefined,
		_bType: undefined,
		_sInternalOrder: undefined,
		_requester: undefined,
		_requesterEmail: undefined,
		_requesterDisplayName: undefined,

		onInit: function () {

			var oContextModel = this.getOwnerComponent().getModel("ctx");
			var oInternalModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(oInternalModel, "InternalOrder");

			// redundant!!!
			this.getView().setModel(oContextModel, "budget");

			/*			oContextModel.attachRequestCompleted(function () {
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

			/*			sap.ui.getCore().attachValidationError(jQuery.proxy(function (oEvent) {
							this._displayErrorMessage(oEvent);
						}), this);
			*/

			var tSwitch = "/validateSwitchSet('P2P_US_CHANGE')"; //added by deeksha 30/12/2021

			var oDataModel = this.getOwnerComponent().getModel("change");
			var that = this;
			oDataModel.read(tSwitch, {

				success: function (oData, oResponse) {

					//var switchModel = new sap.ui.model.json.JSONModel();
					that.getView().setModel(oData.switch, "switch");
				},

				error: function (err) {

				}
			}); // ended by deeksha 30/12/2021

			// started by deeksha 21/1/2022	
			var pjmAppr = "/ZGB_CDS_PJMAPPR";
			/*var aFilter = [];
			aFilter.push(new Filter("COMPCODE", FilterOperator.EQ, this._sCompanyCode));
			aFilter.push(new Filter("COSTCENTER", FilterOperator.EQ, this._sCostCenter));*/
			//var oModel = this.getView().getModel("budget");
			var oDataModel = this.getOwnerComponent().getModel();
			oDataModel.read(pjmAppr, {
				success: function (oData, oResponse) {
					that.getView().setModel(oData, "ZGB_CDS_PJMAPPR");
				}
			});
			// ended by deeksha 21/1/2022	
		},

		_bindOrderComboWF: function () {
			var internalOrderComboBoxWF = this.getView().byId("internalOrderComboBoxWF");
			var aFilter = [];
			aFilter.push(new Filter("CompanyCode", FilterOperator.EQ, this._sCompanyCode));
			aFilter.push(new Filter("CostCenter", FilterOperator.EQ, this._sCostCenter));
			//if (opex.getSelected()) {
			aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "OC")); // = OPEX	
			//} else {
			//	aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "IV")); // = CAPEX
			//}

			internalOrderComboBoxWF.bindItems({
				path: "test>/InternalOrder",
				filters: aFilter,
				template: new sap.ui.core.ListItem({
					key: "{test>OrderNumber}",
					text: "{test>Description}",
					additionalText: "{test>OrderNumber}"
				})
			});
		},

		_bindRadioButtons: function () {
			if (this._sType === "OC") {
				this.getView().byId("OC_WF").setSelected(true);
				this.getView().byId("IV_WF").setSelected(false);
			} else if (this._sType === "IV") {
				this.getView().byId("OC_WF").setSelected(false);
				this.getView().byId("IV_WF").setSelected(true);
			}
		},

		_bindVPComboBoxMF: function () {
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
					text: "{test>FirstName} {test>SecondName}",
					additionalText: "{test>SecondName}"
				})
			});
		},

		_bindPJMComboBoxMF: function () { //added by deeksha 11/1/2022
			var oPJMComboBox = this.getView().byId("pjmComboBoxMF");
			var aFilterPJM = [];
			aFilterPJM.push(new Filter("Zwfbukrs", FilterOperator.EQ, this._sCompanyCode));
			aFilterPJM.push(new Filter("Zwfkstlh", FilterOperator.EQ, this._sCostCenter));
			aFilterPJM.push(new Filter("Zwfrole1", FilterOperator.EQ, "PJM"));

			oPJMComboBox.bindItems({
				path: "test>/SelectApprover",
				sorter: {
					path: "SecondName"
				},
				filters: aFilterPJM,

				template: new sap.ui.core.ListItem({
					key: "{test>Zwfdomain1}",
					text: "{test>FirstName} {test>SecondName}",
					additionalText: "{test>SecondName}"
				})
			});
		}, //ended by deeksha 11/1/2022

		_bindChangeSupplementTable: function () {
			var oTableChangeSupplementWF = this.getView().byId("changeSupplementTableWF");
			var aFilter = [];
			aFilter.push(new Filter("InternalOrder", FilterOperator.EQ, this._sInternalOrder));
			oTableChangeSupplementWF.bindRows({
				path: "test>/RequestedOrder",
				filters: aFilter
			});
		},

		handleUploadPress: function (oEvent) {
			var oFileUploader = this.byId("fileUploader");
			oFileUploader.upload();
		},

		onStartWorkflow: function (event) {
			event.preventDefault();
			var token = this._fetchToken();
			this._startInstance(token);
			//this._readDefinitions(token);
			//	this.getView().getModel("budget").setProperty("/requestdBudgetNextYear", "0");
		},

		onSelectPJM: function (oEvent) { // started by deeksha 11/1/2022

			var oModel = this.getView().getModel("budget");
			var params1 = oEvent.getParameters();
			var sApproverName1 = params1.selectedItem.getBindingContext().getProperty("FirstName") + " " + params1.selectedItem.getBindingContext()
				.getProperty("SecondName");
			var sEmail1 = params1.selectedItem.getBindingContext().getProperty("Zwfdomain1");
			var sApproverId1 = params1.selectedItem.getBindingContext().getProperty("Zwfdomain1").toLowerCase();

			oModel.setData({
				pjmApprover: sApproverName1,
				nextApproverName: sApproverName1
			}, true);
			oModel.setData({
				pjmApproverId: sApproverId1
			}, true);
			oModel.setData({
				pjmMail: sEmail1,
				nextApprover: sEmail1
			}, true);
			oModel.setProperty("/nextApproverVp", undefined);

		}, // ended by deeksha 11/1/2022

		onSelectVP: function (oEvent) {
			var oModel = this.getView().getModel("budget");

			var params = oEvent.getParameters();
			var sApproverName = params.selectedItem.getBindingContext().getProperty("FirstName") + " " + params.selectedItem.getBindingContext()
				.getProperty("SecondName");
			var sEmail = params.selectedItem.getBindingContext().getProperty("Zwfdomain1");
			var sApproverId = params.selectedItem.getBindingContext().getProperty("Zwfdomain1").toLowerCase();

			oModel.setData({
				vpApprover: sApproverName,
				nextApproverName: sApproverName
			}, true);
			oModel.setData({
				vpApproverId: sApproverId
			}, true);
			oModel.setData({
				vpMail: sEmail,
				nextApprover: sEmail
			}, true);
			oModel.setProperty("/nextApproverPjm", undefined);
		},

		onSelectLegalEntity: function (oEvent) {

			var oModel = this.getView().getModel("budget");
			var bIsForwarding = oModel.getProperty("/isForwarding");
			console.log("isForwarding: ", bIsForwarding);
			var costCenterComboBox = this.getView().byId("costCenterComboBox");

			var oSelectedItem = oEvent.getParameter("selectedItem");
			var oItemContext = oSelectedItem.getBindingContext();

			var sLegalEntityDisplayName = oItemContext.getProperty("CompanyCodeName");
			oModel.setData({
				legalEntityDisplayName: sLegalEntityDisplayName
			}, true);

			costCenterComboBox.setEnabled(true);
			costCenterComboBox.bindItems({
				path: oItemContext.getPath() + "/to_CostCenter",
				template: new sap.ui.core.ListItem({
					key: "{CostCenter}",
					text: "{CostCenterName}",
					additionalText: " {CostCenter}"
				}),
				sorter: new sap.ui.model.Sorter({
					path: "CostCenterName"
				}),
				length:'100000'
			});

			var r = new sap.ui.model.json.JSONModel; /*added by Deeksha 02/11/2021*/
			var that = this;
			var oDataModel = this.getOwnerComponent().getModel();
			var opath = oItemContext.getPath() + "/to_Currency";
			oDataModel.read(opath, {
				success: function (oData, oResponse) {
					var oCurrency = oData;
					var oCurModel = new sap.ui.model.json.JSONModel();
					that.getView().setModel(oCurModel, "Currency");
					var currCode;
					// var aSwitch = that.getView().getModel("switch"); //newly added by me
					// if (aSwitch === "X") { //newly added by me 30/12/2021
					if (oData.Currency !== "USD") {
						currCode = "EUR";
					} else {
						currCode = oData.Currency; // commented by deeksha 28/12/2021
						//currCode = " ";  // added by deeksha 28/12/2021
					}
					that.getView().getModel("Currency").setData({
						"CurrencyCode": currCode
					});
					//}
					//else {

					//}
					/*if(oData.Currency !== "USD") {  // commented by deeksha 30/12/2021
						currCode = "EUR";
					}
					else {
						currCode = oData.Currency; // commented by deeksha 28/12/2021
						//currCode = " ";  // added by deeksha 28/12/2021
					}
					that.getView().getModel("Currency").setData({"CurrencyCode":currCode});*/
				},
				error: function (err) {

				}
			});

			/*var tSwitch = "/validateSwitchSet('P2P_US_CHANGE')";
                    var currCode;
						var oDataModel = this.getOwnerComponent().getModel("change");
						var that = this;
						oDataModel.read(tSwitch, {
						
							success: function (oData, oResponse) {
                              
                    		var switchModel = new sap.ui.model.json.JSONModel();
			                that.getView().setModel(switchModel, "switch");
			                //var sFlag;
			                //sFlag = oData.switch;
			                
			                if(oData.switch === "X") { 
			                	//sFlag.flag = "X";
			                	currCode = "USD";
			
			                }
			                else if(oData.switch === " ") {
			                	//sFlag.flag = "X";
			                	currCode = "EUR";
			                
			                }
			                
			                //if(tSwitch === 1 && oData.switch === "X") {
			                //	sFlag.flag = "X";
			                //currCode = oData.Currency;
			                //}
			                //else if(tSwitch !== 0 && oData.switch === " ") {
			                // 	sFlag.flag = " ";
			                //currCode = "EUR";
			                //}
			                
							},
							error: function (err) {

							}
						});
					*/
		},

		onSelectCostCenter: function (oEvent) {
			var oModel = this.getView().getModel("budget");
			var internalOrderComboBox = this.getView().byId("internalOrderComboBox");
			var legalEntityComboBox = this.getView().byId("legalEntityComboBox");
			var opex = this.getView().byId("OC");
			var vpComboBox = this.getView().byId("vpComboBox");
			var pjmComboBox = this.getView().byId("pjmComboBox"); // added by deeksha 11/1/2022
			var legalEntityKey = legalEntityComboBox.getSelectedKey();
			var oSelectedItem = oEvent.getParameter("selectedItem");
			var oItemContext = oSelectedItem.getBindingContext();
			var sCostCenterDisplayName = oItemContext.getProperty("CostCenterName");
			oModel.setData({
				costCenterDisplayName: sCostCenterDisplayName
			}, true);
			var costCenterKey = oSelectedItem.getKey();

			//bind internalOrders
			internalOrderComboBox.setEnabled(true);
			var aFilter = [];
			aFilter.push(new Filter("CompanyCode", FilterOperator.EQ, legalEntityKey));
			aFilter.push(new Filter("CostCenter", FilterOperator.EQ, costCenterKey));
			if (opex.getSelected()) {
				aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "OC")); // = OPEX	
			} else {
				aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "IV")); // = CAPEX
			}

			// internalOrderComboBox.bindItems({
			// 	path: "/InternalOrder",
			// 	filters: aFilter,
			// 	template: new sap.ui.core.ListItem({
			// 		key: "{OrderNumber}",
			// 		text: "{Description}",
			// 		additionalText: "{OrderNumber}"
			// 	})
			// });

			var tpath = "/InternalOrder";
			var oThis = this;
			var oDataModel = this.getOwnerComponent().getModel();
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

			// vpComboBox.setEnabled(true);
			vpComboBox.setEnabled(false);
			vpComboBox.setVisible(false);
			vpComboBox.setSelectedKey(""); //----
			var aFilterVP = [];
			aFilterVP.push(new Filter("Zwfbukrs", FilterOperator.EQ, legalEntityKey));
			aFilterVP.push(new Filter("Zwfkstlh", FilterOperator.EQ, costCenterKey));
			aFilterVP.push(new Filter("Zwfrole1", FilterOperator.EQ, "VP"));
			vpComboBox.bindItems({
				path: "/SelectApprover",
				sorter: {
					path: "SecondName"
				},
				filters: aFilterVP,
				template: new sap.ui.core.ListItem({
					key: "{Zwfdomain1}",
					text: "{FirstName} {SecondName}"
				})
			});

			/*var budgetCurrent = this.getView().byId("BUDGET_CURNT_YEAR");
			var budgetNext = this.getView().byId("BUDGET_NEXT_YEAR");
			//if(this._sCompanyCode === "DE01" || this._sCostCenter === "DE015200" || budgetCurrent<1000.00 || budgetNext<1000.00) {
			var enteredValue = true;
			enteredValue = +oEvent.getParameter("newValue");
			if(this._sCompanyCode === "DE01" || this._sCostCenter === "DE015200" || budgetCurrent<enteredValue || budgetNext<enteredValue) {*/
			//pjmComboBox.setEnabled(true);   // started by deeksha 11/1/2022
			pjmComboBox.setEnabled(false);
			pjmComboBox.setVisible(false);
			pjmComboBox.setSelectedKey("");	//----
			var aFilterPJM = [];
			aFilterPJM.push(new Filter("Zwfbukrs", FilterOperator.EQ, legalEntityKey));
			aFilterPJM.push(new Filter("Zwfkstlh", FilterOperator.EQ, costCenterKey));
			aFilterPJM.push(new Filter("Zwfrole1", FilterOperator.EQ, "PJM"));
			pjmComboBox.bindItems({
				path: "/SelectApprover",
				sorter: {
					path: "SecondName"
				},
				filters: aFilterPJM,
				template: new sap.ui.core.ListItem({
					key: "{Zwfdomain1}",
					text: "{FirstName} {SecondName}"
				})
			}); // ended by deeksha 11/1/2022
			//}
			/*	else if(this._sCompanyCode === "DE01" || this._sCostCenter === "DE015200" || budgetCurrent>1000.00 || budgetNext>1000.00) {
					this.getView().byId("pjmComboBox").setEnabled(false);
				}*/
			//Function call

			var oBudgetModel = this.getView().getModel("budget");
			this.getView().getModel().callFunction("/GetValidRequestors", {
				urlParameters: {
					Zwfdomain1: oBudgetModel.getProperty("/requester"),
					Zwfbukrs: legalEntityKey,
					Zwfkstlh: costCenterKey
					//Zwfrole: "REQUESTER"
				},
				success: function (oData, oResponse) {

					if (oResponse.data.results.length === 0) {
						this.getView().byId("submit").setEnabled(false);
						internalOrderComboBox.setEnabled(false);
						var erDialog = new Dialog({
							title: "Error",
							type: "Message",
							state: "Error",
							content: new Text({
								text: "Your are not allowed to request budget for chosen legal Entity and Cost center."
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
					} else {
						this.getView().byId("submit").setEnabled(true);
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

				}.bind(this),
				error: function (oError) {
					console.log(oError); //disable Button next
					//	this.getRouter().getTargets().display("userError");
				}.bind(this)
			});
			
			/*var pjmAppr = "/ZGB_CDS_PJMAPPR";
			var aFilter = [];
			aFilter.push(new Filter("COMPCODE", FilterOperator.EQ, legalEntityKey));
			aFilter.push(new Filter("COSTCENTER", FilterOperator.EQ, costCenterKey));
			//var oModel = this.getView().getModel("budget");
			var oDataModel = this.getOwnerComponent().getModel();
			oDataModel.read(pjmAppr, {
				filters:aFilter,
				success: function (oData, oResponse) {
					oThis.getView().setModel(oData, "ZGB_CDS_PJMAPPR");
				}
			});*/
		},

		handleValueHelpInternalOrder: function () {
			if (!this._oValueHelpDialog) {
				this._oValueHelpDialog = sap.ui.xmlfragment("gb.wf.cer.budget.init.view.fragments.InternalOrderDialog", this);
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

		handleSearchInternalOrder: function (oEvent) {
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

		handleSuggest: function (oEvent) {
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

		// handleConfirmInternalOrder: function(oEvent) {
		// 	var aContexts = oEvent.getParameter("selectedContexts");
		// 	//for suggestion: oEvent.getParameter("selectedItem").getText() | getKey()
		// 	if (aContexts && aContexts.length) {
		// 		var sOrderNumber = aContexts[0].getObject().OrderNumber;
		// 		var sOrderDescription = aContexts[0].getObject().Description;
		// 		var oPurchaseModel = this.getView().getModel("pur");
		// 		oPurchaseModel.setProperty("/sInternalOrder",sOrderNumber);
		// 		oPurchaseModel.setProperty("/sInternalOrderDescription",sOrderDescription);
		// 	}
		// 	var aAccountFilter = [];
		// 	var legalEntityComboBox = this.getView().byId("legalEntityComboBox");
		// 	var legalEntityKey = legalEntityComboBox.getSelectedKey();
		// 	aAccountFilter.push(new Filter("CompanyCode", FilterOperator.EQ, legalEntityKey));
		// 	var opex = this.getView().byId("OC");
		// 	var sTypeKey; 
		// 	if (opex.getSelected()) {
		// 		sTypeKey ="OC";
		// 	} else {
		// 		sTypeKey ="IV";
		// 	}
		// 	aAccountFilter.push(new Filter("Scope", FilterOperator.EQ, sTypeKey));
		// 	this.getView().getModel().read("/GLAccount", {
		// 		filters: aAccountFilter,
		// 		success: function (oResponse) {
		// 			this.getView().getModel("account").setProperty("/accounts", oResponse.results);
		// 		}.bind(this)
		// 	});

		// 	var internalOrderComboBox = this.getView().byId("internalOrderSelectDialog");
		// 	var sOrderNumber = aContexts[0].getObject().OrderNumber;
		// 	var internalOrderKey = internalOrderComboBox.getSelectedKey();
		// 	var aFilter = [];
		// 	var changeSupplementTable = this.getView().byId("changeSupplementTable");
		// 	aFilter.push(new Filter("InternalOrder", FilterOperator.EQ, sOrderNumber));
		// 	changeSupplementTable.bindRows({  
		//       	path : "/RequestedOrder",
		//       	filters: aFilter
		// 	});

		// 	var aAddressFilters = [];
		// 	//PurchaseOrganisation/ LegalEntity / Plant
		// 	aAddressFilters.push(new Filter("LegalEntity", FilterOperator.EQ, legalEntityKey));
		// 	var oPlantComboBox = this. getView().byId("plantComboBox");
		// 	var sPlantKey = oPlantComboBox.getSelectedKey();       
		// 	aAddressFilters.push(new Filter("Plant", FilterOperator.EQ, sPlantKey));
		// 	var oPoComboBox = this.getView().byId("purchasingOrderComboBox");
		// 	var sPoKey = oPoComboBox.getSelectedKey();
		// 	aAddressFilters.push(new Filter("PurchaseOrganization", FilterOperator.EQ, sPoKey));
		// 	this.getView().getModel().read("/DeliveryAddress",{
		// 		filters: aAddressFilters,
		// 		success: function(oData, response){
		// 			if(oData.results[0] != undefined){
		// 			    var oValues = oData.results[0];
		// 				var oModel = this.getView().getModel("pur");
		// 				oModel.setProperty("/Name",oValues.Name);
		// 				oModel.setProperty("/Name2",oValues.Name2);
		// 				oModel.setProperty("/Street",oValues.Street);
		// 				oModel.setProperty("/HouseNo",oValues.HouseNo);
		// 				oModel.setProperty("/PostalCode",oValues.PostalCode);
		// 				oModel.setProperty("/City",oValues.City);
		// 				oModel.setProperty("/Street1",oValues.Street1);
		// 				oModel.setProperty("/Country",oValues.Country);
		// 				oModel.setProperty("/CountryName",oValues.Country);
		// 				console.log(oData);
		// 			}
		// 		}.bind(this),
		// 		error: function(oError){
		// 			console.log(oError);
		// 		}.bind(this)
		// 	});
		// },

		onTypeChange: function (oEvent) {
			var internalOrderComboBox = this.getView().byId("internalOrderComboBox");
			var legalEntityComboBox = this.getView().byId("legalEntityComboBox");
			var opex = this.getView().byId("OC");
			var legalEntityKey = legalEntityComboBox.getSelectedKey();
			var costCenterComboBox = this.getView().byId("costCenterComboBox");
			var costCenterKey = costCenterComboBox.getSelectedKey();

			if (legalEntityKey !== "" && costCenterKey !== "") {
				var aFilter = [];
				aFilter.push(new Filter("CompanyCode", FilterOperator.EQ, legalEntityKey));
				aFilter.push(new Filter("CostCenter", FilterOperator.EQ, costCenterKey));
				if (opex.getSelected()) {
					aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "OC")); // = OPEX	
				} else {
					aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "IV")); // = CAPEX
				}
				// internalOrderComboBox.bindItems({
				// 	path: "/InternalOrder",
				// 	filters: aFilter,
				// 	template: new sap.ui.core.ListItem({
				// 		key: "{OrderNumber}",
				// 		text: "{Description}",
				// 		additionalText: "{OrderNumber}"
				// 	})
				// });
			}
			var tpath = "/InternalOrder";
			var oThis = this;
			var oDataModel = this.getOwnerComponent().getModel();
			var oInternal = this.getView().getModel("InternalOrder");
			oInternal.setData("");
			oInternal.setSizeLimit(1000);
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
		},

		onSelectInternalOrder: function (oEvent) {
			var oModel = this.getView().getModel("budget");
			// var oSelectedItem = oEvent.getParameter("selectedItem");
			// var oItemContext = oSelectedItem.getBindingContext();
			// var sInternalOrderDisplayName = oItemContext.getProperty("Description");
			var aContexts = oEvent.getParameter("selectedContexts");
			//for suggestion: oEvent.getParameter("selectedItem").getText() | getKey()
			if (aContexts && aContexts.length) {
				var sOrderNumber = aContexts[0].getObject().OrderNumber;
				var sOrderDescription = aContexts[0].getObject().Description;
				var oPurchaseModel = this.getView().getModel("budget");
				oPurchaseModel.setProperty("/internalOrder", sOrderNumber);
				oPurchaseModel.setProperty("/internalOrderDisplayName", sOrderDescription);
				// var sInternalOrderDisplayName = sOrderDescription;
				// oModel.setData({
				// 	internalOrderDisplayName: sInternalOrderDisplayName
				// }, true);
				// } // Commented end bracket from here.
				// var sInternalOrderDisplayName = oSelectedItem.getText();
				// oModel.setData({
				// 	internalOrderDisplayName: sInternalOrderDisplayName
				// }, true);
				var internalOrderComboBox = this.getView().byId("internalOrderComboBox");
				// var internalOrderKey = internalOrderComboBox.getSelectedKey();

				var tableChangeSupplement = this.getView().byId("changeSupplementTable");

				var oDataInternal = this.getView().getModel("InternalOrder").getData().Internal;
				var oDataIntLength = this.getView().getModel("InternalOrder").getData().Internal.length;
				var allowed = true;
				for (var i = 0; i < oDataIntLength; i++) {
					if (sOrderNumber === oDataInternal[i].OrderNumber) {
						var status = oDataInternal[i].SystemStatus;
						if (status === "LKD" || status === "CLSD") {
							allowed = false;
							this.getView().byId("submit").setEnabled(false);
							internalOrderComboBox.setSelectedKey("");
							internalOrderComboBox.setValueState("Error");
							var erDialog = new Dialog({
								title: "Error",
								type: "Message",
								state: "Error",
								content: new Text({
									text: "You are not allowed to request budget for chosen Internal Order."
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
							// this.getView().byID("submit").setEnabled(false);
							return;
						}
						// else
						// {
						// // this.getView().byID("submit").setEnabled(true);
						// internalOrderComboBox.setSelectedKey(internalOrderKey);
						// internalOrderComboBox.setValueState("None");
						// internalOrderComboBox.setValueState("None");
						// var aFilter = [];
						// aFilter.push(new Filter("InternalOrder", FilterOperator.EQ, internalOrderKey));
						// tableChangeSupplement.bindRows({
						// 	path: "/RequestedOrder",
						// 	filters: aFilter
						// });
						// // this._bindVPComboBoxMF();
						// }

					}

				}

				if (allowed === true) {
					this.getView().byId("submit").setEnabled(true);
					internalOrderComboBox.setSelectedKey(sOrderNumber);
					internalOrderComboBox.setValueState("None");
					internalOrderComboBox.setValueState("None");
					var aFilter = [];
					// var sOrderNumber = aContexts[0].getObject().OrderNumber;
					aFilter.push(new Filter("InternalOrder", FilterOperator.EQ, sOrderNumber));
					tableChangeSupplement.bindRows({
						path: "/RequestedOrder",
						filters: aFilter
					});
					// this._bindVPComboBoxMF();
				}
			} // Added end bracket of if loop here.

			// var aFilter = [];
			// aFilter.push(new Filter("InternalOrder", FilterOperator.EQ, internalOrderKey));
			// tableChangeSupplement.bindRows({
			// 	path: "/RequestedOrder",
			// 	filters: aFilter
			// });

			//tableChangeSupplement.getBinding("items").filter(aFilter);

			// var tpath = "/InternalOrder('" + internalOrderKey + "')";
			// var oDataModel = this.getOwnerComponent().getModel();
			// oDataModel.read(tpath, {
			// 	success: function (oData, oResponse) {
			// 		if (oData.SystemStatus === "LKD") {
			// 			// internalOrderComboBox.setValueState("Error");
			// 			// internalOrderComboBox.setSelectedKey("");
			// 			var erDialog = new Dialog({
			// 				title: "Error",
			// 				type: "Message",
			// 				state: "Error",
			// 				content: new Text({
			// 					text: "You are not allowed to request budget for chosen Internal Order."
			// 				}),
			// 				beginButton: new Button({
			// 					text: "OK",
			// 					press: function () {
			// 						erDialog.close();
			// 					}
			// 				}),
			// 				afterClose: function () {
			// 					erDialog.destroy();
			// 				}
			// 			});
			// 			erDialog.open();
			// 		} else {
			// 			// internalOrderComboBox.setValueState("None");
			// 			var aFilter = [];
			// 			aFilter.push(new Filter("InternalOrder", FilterOperator.EQ, internalOrderKey));
			// 			tableChangeSupplement.bindRows({
			// 				path: "/RequestedOrder",
			// 				filters: aFilter
			// 			});
			// 		}
			// 	},
			// 	error: function (err) {
			// 		console.log(err); //disable Button next
			// 	}
			// });

		},

		_readDefinitions: function (token) {
			var model = this.getView().getModel();

			$.ajax({
				url: "/bpmworkflowruntime/rest/v1/workflow-definitions",
				method: "GET",
				async: false,
				contentType: "application/json",
				headers: {
					"X-CSRF-Token": token
				},
				success: function (result, xhr, data) {
					model.setProperty("/result", JSON.stringify(result, null, 4));
				}
			});
		},

		onFileDelete: function (oEvent) {
			var item = oEvent.getParameter("item");
			var ctx = item.getBinding("fileName").getContext();
			ctx.getModel().remove(ctx.getPath());
		},

		onAfterRendering: function () {
			console.log("in onAfterRendering");
			var bucketId = this.getView().getModel("budget").getProperty("/bucketId");
			var sPath = "/Buckets(\'" + bucketId + "\')/Files";
			var oUploadCollection = this.getView().byId("UploadCollection");
			oUploadCollection.getBinding("items").sPath = sPath;
			oUploadCollection.getBinding("items").refresh();

			// var sUserId = new sap.ushell.services.UserInfo().getUser().getId();
			var sUserId = new sap.ushell.Container.getService("UserInfo").getUser().getId();
			if (sUserId !== null && sUserId !== undefined) {
				// var sUserDisplayName = new sap.ushell.services.UserInfo().getUser().getFullName();
				var sUserDisplayName = new sap.ushell.Container.getService("UserInfo").getUser().getFullName();
				var sUserEmail = "dummy@somewhere.de";
				// var sUserEmail = new sap.ushell.services.UserInfo().getUser().getEmail();
				var sUserEmail = new sap.ushell.Container.getService("UserInfo").getUser().getEmail();
				if (sUserEmail === undefined || sUserEmail === undefined || sUserEmail.length < 1) {
					sUserEmail = "dummy@somewhere.de";
				}
				var aSplits = sUserId.split("@");
				var sRequesterId = aSplits[0] + "@" + aSplits[1].toUpperCase();
				this.getView().getModel("budget").setProperty("/requester", sRequesterId);
				this.getView().getModel("budget").setProperty("/requesterEmail", sUserEmail);
				this.getView().getModel("budget").setProperty("/requesterDisplayName", sUserDisplayName);
				//store the values in global vars to set them in the new model again(in successCase of method startInstance()), to prepare the next budget request
				this._requester = sRequesterId;
				this._requesterEmail = sUserEmail;
				this._requesterDisplayName = sUserDisplayName;
			}
			console.log("Ende onAfterRendering");
		},

		onBeforeUploadStarts: function (oEvent) {

			// this.getView().getModel().setProperty("/bucketId", UUID);
			var bucketId = this.getView().getModel("budget").getProperty("/bucketId");

			var bucketPath = "/Buckets(\'" + bucketId + "\'/Files";
			this.getView().getModel("budget").setProperty("/bucketPath", bucketPath);
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
			var cItems = oUploadCollection.aItems.length,
				sStatus = oEvent.getParameters().getParameter("status");

			if (sStatus !== 200) {
				MessageToast.show("Upload file error");
			}
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
		},

		createUUID: function () {
			//WORKAROUND weil Feld REQ_ID in der Entität vom Typ Number ist. Wenn das geändert ist, muss der auskommentierte Code wieder rein.
			var c = 1;
			var d = new Date(),
				m = d.getMilliseconds() + "",
				u = ++d + m + (++c === 10000 ? (c = 1) : c);
			return u;
			/*   	var dt = new Date().getTime();
	    		var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
	        	var r = (dt + Math.random()*16)%16 | 0;
	        	dt = Math.floor(dt/16);
	        	return (c=='x' ? r :(r&0x3|0x8)).toString(16);
	    	});
    		return uuid;
    */
		},

		getAttachmentURLs: function () {
			var sUrls = "-----";
			var aItems = this.getView().byId("UploadCollection").getItems();
			if (aItems.length > 0) {
				sUrls = aItems.map(function (row) {
					return row.getUrl();
				}).join("\n");
			}
			return sUrls;
		},

		_getAttachmentURLsForStatusReport: function () {
			var sUrls = "-----";
			var aItems = this.getView().byId("UploadCollection").getItems();
			if (aItems.length > 0) {
				sUrls = aItems.map(function (row) {
					return row.getUrl();
				}).join("#");
			}
			this.getView().getModel("budget").setProperty("/sAttachmentLinks", sUrls);
		},

		_startInstance: function (token) {

			var oModel = this.getView().getModel("budget");
			var dialog;
			if ((oModel.getProperty("/requestedBudgetCurrentYear") === undefined ||
					oModel.getProperty("/requestedBudgetCurrentYear") === "") && (oModel.getProperty("/requestdBudgetNextYear") === undefined ||
					oModel.getProperty("/requestdBudgetNextYear") === "")) {
				this._displayErrorMessage("Please enter a valid budget for current year or next year.");
				return;
				// this._displayErrorMessage("Please enter a valid amount.");
			}
			//WORKAROUND WEIL CUSTOMTABLE NOCH NICHTS ZURÜCK LIEFERT. MUSS WIEDER RAUS
			if (oModel.getProperty("/requester") === undefined || oModel.getProperty("/requesterEmail") === undefined || oModel.getProperty
			("/nextApprover") === undefined || oModel.getProperty("/costCenter") === undefined || oModel.getProperty("/internalOrder") ===
				undefined || oModel.getProperty("/legalEntity") === undefined ||
				oModel.getProperty("/comment") === undefined) {

				dialog = new Dialog({
					title: "Error",
					type: "Message",
					state: "Error",
					content: new Text({
						text: "Please complete all required fields."
					}),
					beginButton: new Button({
						text: "OK",
						press: function () {
							dialog.close();
						}
					}),
					afterClose: function () {
						dialog.destroy();
					}
				});
				dialog.open();
			} else {
				if (oModel.getPo)
					oModel.setData({
						isApproved: false
					}, true);
				oModel.setData({
					workflowStep: 1
				}, true);
				//"OC" = OPEX		"IV" = CAPEX
				var opex = this.getView().byId("OC");

				if (opex.getSelected()) {
					oModel.setData({
						type: "OC"
					}, true);
					oModel.setData({
						typeDisplayText: "OPEX"
					}, true);
				} else {
					oModel.setData({
						type: "IV"
					}, true);
					oModel.setData({
						typeDisplayText: "CAPEX"
					}, true);
				}

				var sCommentText = oModel.getProperty("/comment");
				var oDate = new Date(Date.now());
				var options = {
					month: '2-digit',
					day: '2-digit',
					year: 'numeric',
					hour: 'numeric',
					minute: 'numeric',
					second: 'numeric'
				};
				var sCommentHistory = oDate.toLocaleString('de-DE', options) + ", Requester " + oModel.getProperty("/requesterDisplayName") + ": " +
					sCommentText + "\n";
				oModel.setData({
					sCommentHistory: sCommentHistory
				}, true);

				var sBudgetNextYear = "0";
				var sBudgetCurrentYear = "0";
				if (oModel.getProperty("/requestdBudgetNextYear") != undefined) {
					sBudgetNextYear = oModel.getProperty("/requestdBudgetNextYear");
				} else {
					oModel.setData({
						requestdBudgetNextYear: sBudgetNextYear
					}, true);

				}
				if (oModel.getProperty("/requestedBudgetCurrentYear") != undefined) {
					sBudgetCurrentYear = oModel.getProperty("/requestedBudgetCurrentYear");
				} else {
					oModel.setData({
						requestedBudgetCurrentYear: sBudgetCurrentYear
					}, true);

				}
				var oCurr = this.getView().getModel("Currency").getData("CurrencyCode");
				oModel.setProperty("/currencyCode", oCurr.CurrencyCode); /*added by Deeksha 11/11/2021*/
				//var requestedBudget = parseFloat(oModel.getProperty("/requestedBudgetCurrentYear")) + parseFloat(sBudgetNextYear);
				var requestedBudget = parseFloat(sBudgetCurrentYear) + parseFloat(sBudgetNextYear);
				var requestedAmountFormatted = new Intl.NumberFormat('en-US', {
					minimumFractionDigits: 2
				}).format(requestedBudget); //requestedBudget.toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');

				oModel.setData({
					requestedAmountFormatted: requestedAmountFormatted
				}, true);
				oModel.setData({
					requestedBudget: requestedBudget
				}, true);

				//WORKAROUND WEIL CUSTOMTABLE NOCH NICHTS ZURÜCK LIEFERT. MUSS WIEDER EINKOMMENTIERT WERDEN
				if (this.getView().byId("vpComboBox").getSelectedKey() !== "") {
				var approverName = this.getView().byId("vpComboBox").getSelectedItem().getText();
				var approverEmail = this.getView().byId("vpComboBox").getSelectedItem().getBindingContext().getProperty("Zwfmail1");
				} else if (this.getView().byId("pjmComboBox").getSelectedKey() !== "") {
					var approverName = this.getView().byId("pjmComboBox").getSelectedItem().getText();
				var approverEmail = this.getView().byId("pjmComboBox").getSelectedItem().getBindingContext().getProperty("Zwfmail1");
				}
				// started by deeksha 11/1/2022
				/*var approverName1 = this.getView().byId("pjmComboBox").getSelectedItem().getText();
				var approverEmail1 = this.getView().byId("pjmComboBox").getSelectedItem().getBindingContext().getProperty("Zwfmail1");
                
                oModel.setData({
					approverName1: approverName1
				}, true);
				oModel.setData({
					approverEmail1: approverEmail1
				}, true);*/
				// ended by deeksha 11/1/2022

				oModel.setData({
					approverName: approverName
				}, true);
				oModel.setData({
					approverEmail: approverEmail
				}, true);
				oModel.setData({
					showApprovers: true
				}, true);
				oModel.setData({
					workflowStep: 1
				}, true);
				oModel.setData({
					ccApprover: null
				}, true);
				oModel.setData({
					cfoApprover: null
				}, true);
				oModel.setData({
					md1Approver: null
				}, true);
				oModel.setData({
					md2Approver: null
				}, true);
				oModel.setData({
					ceoApprover: null
				}, true);
				oModel.setData({
					ccComment: null
				}, true);
				oModel.setData({
					vpComment: null
				}, true);
				// started by deeksha 11/1/2022
				oModel.setData({
					pjmComment: null
				}, true);
				// ended by deeksha 11/1/2022
				oModel.setData({
					cfoComment: null
				}, true);
				oModel.setData({
					md1Comment: null
				}, true);
				oModel.setData({
					md2Comment: null
				}, true);
				oModel.setData({
					ceoComment: null
				}, true);

				//build data for status report
				this._getAttachmentURLsForStatusReport();
				var sDate = "\/Date(" + Date.now() + ")\/";
				var oStatusData = {
					"ReqDt": sDate,
					"ReqId": oModel.getProperty("/bucketId"),
					"WfType": "Budget",
					"CompCd": oModel.getProperty("/legalEntity"),
					"CompTxt": oModel.getProperty("/legalEntityDisplayName"),
					"CostCt": oModel.getProperty("/costCenter"),
					"ReqTyp": oModel.getProperty("/typeDisplayText"),
					"RequesterID": this._requester,
					"IntOrd": oModel.getProperty("/internalOrder"),
					"ReqEmail": oModel.getProperty("/requesterEmail"),
					"ReqBudYr1": oModel.getProperty("/requestedBudgetCurrentYear").toString(),
					"ReqBudYr2": oModel.getProperty("/requestdBudgetNextYear").toString(),
					"ReqBy": this._requesterDisplayName,
					"Zbudcomments": oModel.getProperty("/sCommentHistory"),
					//"Zappr": oModel.getProperty("/vpApprover"),
					"Zstatus1": "Open",
					"URL": oModel.getProperty("/sAttachmentLinks"),
					//"Zappr_email": oModel.getProperty("/vpMail"),
					//"Zappr_role": "VP",
					"Short_Text": oModel.getProperty("/ShortText"),
					"Zcurr": oModel.getProperty("/currencyCode")
				};
				//var reqBudget = parseFloat(oModel.getProperty("/requestedBudget"));
				//var aPJMAPPR = this.getView().getModel("ZGB_CDS_PJMAPPR").results[0];
				var aPJMAPPR = this.getView().getModel("ZGB_CDS_PJMAPPR").results;
				if(aPJMAPPR.length !== 0){
					for (var m = 0; m < aPJMAPPR.length; m++) {
						if ((oModel.getProperty("/legalEntity") === aPJMAPPR[m].COMPCODE) && (oModel.getProperty("/costCenter") === aPJMAPPR[m].COSTCENTER) && (
								parseFloat(oModel.getProperty("/requestedBudget")) < 1000)) {
							oStatusData.Zappr = oModel.getProperty("/pjmApprover");
							oStatusData.Zappr_email = oModel.getProperty("/pjmMail");
							oStatusData.Zappr_role = "PJM";
							//return;
						} else {
							oStatusData.Zappr = oModel.getProperty("/vpApprover");
							oStatusData.Zappr_email = oModel.getProperty("/vpMail");
							oStatusData.Zappr_role = "VP";
							//return;
						}
					}
				}
				else{
					oStatusData.Zappr = oModel.getProperty("/vpApprover");
					oStatusData.Zappr_email = oModel.getProperty("/vpMail");
					oStatusData.Zappr_role = "VP";
				}
				
				this.oStatusData = oStatusData; // Added by Dhanush
				oModel.setData({
					oStatusData: oStatusData
				}, true);

				if (oModel.getProperty("/ShortText") === undefined) {
					oModel.setProperty("/ShortText", "");
				}

				var tmp = parseFloat(oModel.getProperty("/requestedBudgetCurrentYear")) + parseFloat(oModel.getProperty(
					"/requestdBudgetNextYear"));
				var tmp2 = tmp.toString();
				/*				var oInternalOrder = {
									"InternalOrder": oModel.getProperty("/internalOrder"),
									"CurrentBudget": parseFloat(oModel.getProperty("/requestedBudgetCurrentYear")),
									"TotalBudget": parseFloat(oModel.getProperty("/requestedBudgetCurrentYear")) + parseFloat(oModel.getProperty(
										"/requestdBudgetNextYear")),
									"NextBudget": parseFloat(oModel.getProperty("/requestdBudgetNextYear")),
									"MessContent": "",
									"MessType": "",
									"WorkflowId": ""
								};
				*/

				var oInternalOrder = {
					"InternalOrder": oModel.getProperty("/internalOrder"),
					"CurrentBudget": oModel.getProperty("/requestedBudgetCurrentYear").toString(),
					"TotalBudget": tmp2,
					"NextBudget": oModel.getProperty("/requestdBudgetNextYear").toString(),
					"MessContent": "",
					"MessType": "",
					"WorkflowId": ""
				};

				//setup model for forwarding users: TODO: Add substitutes 
				var aForwardingUsers = [];
				/*				var oEmptEntry = {
									"FirstName": "-----",
									"SecondName": "-----",
									"Name": "-----",
									"Role": "NONE",
									"Email": "",
									"Zwfdomain1": "EMPTY"
								};
								aForwardingUsers.push(oEmptEntry);
				*/
				var oForwardingUser = {
					"FirstName": oModel.getProperty("/requesterFirstName"),
					"SecondName": oModel.getProperty("/requesterSecondName"),
					"Name": oModel.getProperty("/requesterFirstName") + " " + oModel.getProperty("/requesterSecondName"),
					"Role": "REQUESTER",
					"Email": oModel.getProperty("/requesterEmail"),
					"Zwfdomain1": oModel.getProperty("/requester"),
					"DeputyFirstName": oModel.getProperty("/Zwfname3"),
					"DeputySecondName": oModel.getProperty("/Zwfname4"),
					"DeputyName": oModel.getProperty("/Zwfname3") + " " + oModel.getProperty("/Zwfname4"),
					"DeputyRole": "REQUESTER",
					"DeputyEmail": oModel.getProperty("/Zwfmail2"),
					"Zwfdomain2": oModel.getProperty("/Zwfdomain2")
				};

				var sAttachementUrls = this.getAttachmentURLs();
				console.log(sAttachementUrls);
				oModel.setData({
					sAttachementUrls: sAttachementUrls
				}, true);
				oModel.setData({
					isForwarding: false
				}, true);
				aForwardingUsers.push(oForwardingUser);
				oModel.setData({
					oInternalOrder: oInternalOrder
				}, true);
				oModel.setData({
					oForwardingUsers: aForwardingUsers
				}, true);
				var oDate = new Date(Date.now());
				var options = {
					month: '2-digit',
					day: '2-digit',
					year: 'numeric'
				};
				oModel.setData({
					creationDate: new Date().toLocaleDateString('de-DE', options)
				}, true);
				//START of Changes By Ajit
				oModel.getData().oForwardingUsers[0].Level = 0;
				var aApproverLevelList = this._fetchApprovalLevelList(requestedBudget, oModel);
				oModel.setData({
					aApproverLevelList: aApproverLevelList
				}, true);
				oModel.setData({
					nextWorkflowStepDescr: this._getApproverLevel(aApproverLevelList)
				}, true);
				var aNextLevelApprovers = this._getApproverForNextLevel(aApproverLevelList, oModel);
				if (aApproverLevelList.length > 2) {
					oModel.setData({
						showApprovers: true
					}, true);
				} else {
					oModel.setData({
						showApprovers: false
					}, true);
				}
				oModel.setData({
					"approvers": {
						"cfo": aNextLevelApprovers
					}
				}, true);
				oModel.setData({
					bApproveFinished: false
				}, true);
				//END of CHanges By Ajit
				$.ajax({
					url: "/bpmworkflowruntime/rest/v1/workflow-instances",
					method: "POST",
					async: false,
					contentType: "application/json",
					headers: {
						"X-CSRF-Token": token
					},
					data: JSON.stringify({
						definitionId: "zgb_approvebudget",
						status: "COMPLETED",
						context: oModel.oData,
						attributes: [{
							id: "myTaskID",
							label: "myTaskID",
							value: "123456789",
							type: "string"
						}]

					}),
					success: function (result, xhr, data) {
						oModel.setProperty("/result", JSON.stringify(result, null, 4));

						//clear model for new request but keep the requester and the requesteremail
						oModel.setData({});
						oModel.setProperty("/requester", this._requester);
						oModel.setProperty("/requesterEmail", this._requesterEmail);
						oModel.setProperty("/requesterDisplayName", this._requesterDisplayName);
						var tableChangeSupplement = this.getView().byId("changeSupplementTable");

						var oEmptyModel = new sap.ui.model.json.JSONModel();
						oEmptyModel.setData({
							mData: []
						});
						this.getView().setModel(oEmptyModel, "emptyModel");

						tableChangeSupplement.bindRows({
							path: "emptyModel>/mData"
						});

						// clear uploadCollection for next entries
						var bucketId = this.createUUID();
						this.getView().getModel("budget").setProperty("/bucketId", bucketId);
						var sPath = "/Buckets(\'" + bucketId + "\')/Files";
						var oUploadCollection = this.getView().byId("UploadCollection");
						oUploadCollection.getBinding("items").sPath = sPath;
						oUploadCollection.getBinding("items").refresh();

						// Added by Dhanush
						this.oStatusData.WFInstance = result.id;
						var tpath = "/WfRequestSet";
						var oDataModel = this.getOwnerComponent().getModel();
						oDataModel.create(tpath, this.oStatusData, {
							success: function (oData, oResponse) {

							},
							error: function (err) {

							}
						});
						// Ended by Dhanush

						/*						var dataObject = { data : [
													{PositionNum:10}, {PositionNum:20}, {PositionNum:30}, {PositionNum:40}, {PositionNum:50}, {PositionNum:60}, {PositionNum:70}, {PositionNum:80}, {PositionNum:90}, {PositionNum:100}
												]};
												this.getView().getModel("pos");
												var positionModel = new sap.ui.model.json.JSONModel();
												positionModel.setData(dataObject);
												this.setModel(positionModel, "pos");
						*/
						dialog = new Dialog({
							title: "Budget request",
							type: "Message",
							state: "Success",
							content: new Text({
								text: "The requested budget is sent to approver."
							}),
							beginButton: new Button({
								text: "OK",
								press: function () {
									dialog.close();
								}
							}),
							afterClose: function () {
								dialog.destroy();
							}
						});
						dialog.open();
					}.bind(this),

					error: function (error) {
						//	alert(JSON.stringify(error));

						dialog = new Dialog({
							title: "Error",
							type: "Message",
							state: "Error",
							content: new Text({
								text: "The requested budget can't be sent to approver."
							}),
							beginButton: new Button({
								text: "OK",
								press: function () {
									dialog.close();
								}
							}),
							afterClose: function () {
								dialog.destroy();
							}
						});

						dialog.open();
					}
				});
			}
		},

		// Request Inbox to refresh the control
		// once the task is completed
		_refreshTask: function () {
			var taskId = this.getComponentData().startupParameters.taskModel.getData().InstanceID;
			this.getComponentData().startupParameters.inboxAPI.updateTask("NA", taskId);
		},

		_fetchToken: function () {
			var token;

			$.ajax({
				url: "/bpmworkflowruntime/rest/v1/xsrf-token",
				method: "GET",
				async: false,
				headers: {
					"X-CSRF-Token": "Fetch"
				},
				success: function (result, xhr, data) {
					token = data.getResponseHeader("X-CSRF-Token");
				}
			});

			return token;
		},
		//START of Changes By Ajit
		// _updateStatusData:function(oStatusData, sBucketId, sWFInstanceId){
		//	// 	var sUrl = "/sap/opu/odata/sap/Z_WORKFLOW_SRV/WfRequestSet", bUpdateSuccess = false, sToken;
		// 	// $.ajax({	url: sUrl + "?$top=1",
		// 	// 			method: "GET",
		// 	// 			async: false,
		// 	// 			headers:{"Accept": "application/json", "x-csrf-token":"fetch"},
		// 	// 			success: function(result, xhr, data){
		// 	// 				console.log(result, xhr, data);
		// 	// 				sToken = data.getResponseHeader('x-csrf-token');
		// 	// 				$.ajax({	url: sUrl,
		// 	// 							method: "POST",
		// 	// 							async: false,
		// 	// 							contentType: "application/json",
		// 	// 							headers: {"X-CSRF-Token": sToken, "accept":"application/json"},
		// 	// 							data: JSON.stringify(oStatusData),
		// 	// 							success:function(resultSuccess, xhrSuccess, dataSuccess){
		// 	// 								console.log(resultSuccess, xhrSuccess, dataSuccess);
		// 	// 								bUpdateSuccess = true;
		// 	// 							},
		// 	// 							error: function(resultError,xhrError,dataError){
		// 	// 								console.log(resultError);
		// 	// 							}	
		// 	// 				});
		// 	// 			},
		// 	// 			error: function(result,xhr,data){
		// 	// 				console.log(result);
		// 	// 			}							
		// 	// });
		// 	var oDataModel = this.getOwnerComponent().getModel(), bUpdateSuccess=false;
		//          var opath = "/WfRequestSet";
		//          oStatusData.ReqId = sBucketId;
		//          oStatusData.WFInstance = sWFInstanceId;
		//          oDataModel.create(	opath, 
		//          					oStatusData,{
		//                     	success : function(oData, oResponse){
		// 							console.log(oData, oResponse);
		// 							bUpdateSuccess = true;		
		//                     	},
		//                     	error : function(err){
		// 							console.log(err);
		//                     	}
		//                  			});			
		// 	return bUpdateSuccess;
		// },
		_getApproverForNextLevel: function (aApproverLevelList, oModel) {
			var sUrl = "/sap/opu/odata/sap/Z_WORKFLOW_SRV/SelectApprover?$filter=",
				bCall = false,
				aApprovers = {
					"d": {
						"results": []
					}
				},
				aFilters = [],
				sPath = "";
			for (var i = 0; i < aApproverLevelList.length; i++) {
				if (aApproverLevelList[i].Status == "PENDING" && (i + 1) < aApproverLevelList.length) {
					bCall = true;
					if (aApproverLevelList[i + 1].LevelDesc == "MD1" || aApproverLevelList[i + 1].LevelDesc == "MD2") {
						sPath = sPath + "Zwfrole1 eq '" + "MD" + "'";
					} else {
						sPath = sPath + "Zwfrole1 eq '" + aApproverLevelList[i + 1].LevelDesc + "'";
					}
					sPath = sPath + " and Zwfbukrs eq '" + oModel.getData().legalEntity + "'";
					sPath = sPath + " and Zwfkstlh eq '" + oModel.getData().costCenter + "'";
					sUrl = sUrl + encodeURIComponent(sPath);
					// $.ajax({ url: sUrl,
					// 	method: "GET",
					// 	async: false,
					// 	contentType: "application/json",
					// 	headers: { "accept": "application/json"	},
					// 	success: function (result, xhr, data) {
					// 		console.log("Success Approvers List",result);
					// 		aApprovers = result;
					// 	},
					// 	error: function(result,xhr,data){
					// 		console.log(result);
					// 	}						
					// });					

				}
			}
			// var oDefaultModel = this.getOwnerComponent().getModel();           
			// for( i=0; i<aApproverLevelList.length; i++){
			// 	if(aApproverLevelList[i].Status == "PENDING" && (i+1) <= aApproverLevelList.length){
			// 		aFilters.push(new Filter("Zwfrole1", FilterOperator.EQ, aApproverLevelList[i+1].LevelDesc));
			// 		aFilters.push(new Filter("Zwfbukrs", FilterOperator.EQ, oModel.getData().legalEntity));
			// 		aFilters.push(new Filter("Zwfkstlh", FilterOperator.EQ, oModel.getData().costCenter));					
			// 		oDefaultModel.read("/SelectApprover",{
			// 							filters: aFilters,
			// 							async: false,
			// 							success: function (result, xhr, data) {
			// 								console.log(result);
			// 								aApprovers = { "d": {"results": result } };
			// 							},
			// 							error: function(result,xhr,data){
			// 								console.log(result);
			// 							}											
			// 						});

			// 	}
			// }
			// for(var i=0; i<aApproverLevelList.length; i++){
			// 	if(aApproverLevelList[i].Status == "PENDING" && (i+1) <= aApproverLevelList.length){
			// 		sPath = sPath + "Zwfrole1 eq '" + aApproverLevelList[i+1].LevelDesc + "'";
			// 		sPath = sPath + " and Zwfbukrs eq '" + oModel.getData().legalEntity + "'";
			// 		sPath = sPath + " and Zwfkstlh eq '" + oModel.getData().costCenter + "'";
			// 		sUrl = sUrl + encodeURIComponent(sPath);
			// 	}
			// }
			if (bCall == true) {
				var xhttp = new XMLHttpRequest();
				xhttp.onreadystatechange = function () {
					if (this.readyState == 4 && this.status == 200) {
						console.log("Response using XMLHttpRequest", this.responseText);
						aApprovers = JSON.parse(this.responseText);
					}
				};
				xhttp.open("GET", sUrl, false);
				xhttp.setRequestHeader("Content-type", "application/json");
				xhttp.setRequestHeader("Accept", "application/json");
				xhttp.send();
			}
			console.log('End of Result', aApprovers);
			return aApprovers;
		},
		_getApproverLevel: function (aApproverLevelList) {
			var sLevel = "";
			for (var i = 0; i < aApproverLevelList.length; i++) {
				if (aApproverLevelList[i].Status == "PENDING" && (i + 1) < aApproverLevelList.length) {
					sLevel = aApproverLevelList[i + 1].LevelDesc;
					sLevel = sLevel.charAt(0).toUpperCase() + sLevel.substr(1).toLowerCase();
				}
			}
			return sLevel;
		},
		_fetchApprovalLevelList: function (iTotalRequestedBudget, oModel) {
			/*var sAmountRangeUrl = "/sap/opu/odata/sap/ZGB_CDS_WF_RANGE_CDS/Zgb_cds_wf_range", // commented by deeksha 25/1/2022
				sApprovalLevelUrl = "/sap/opu/odata/sap/ZGB_CDS_WF_APPROVAL_CDS/zgb_cds_wf_approval(im_type='Budget')/Set";*/
			var sAmountRangeUrl = "/sap/opu/odata/sap/ZGB_CDS_WF_RANGE_CDS/Zgb_cds_wf_range?$orderby=APP_LEVEL", // added by deeksha 25/1/2022 
				sApprovalLevelUrl = "/sap/opu/odata/sap/Z_WORKFLOW_SRV/WfApproval_ControlSet?$filter=WorkflowType eq 'Budget'";
			var aAmountRangeLevel, aApprovalLevelList;
			$.ajax({
				url: sAmountRangeUrl,
				method: "GET",
				async: false,
				headers: {
					"Accept": "application/json"
				},
				success: function (result, xhr, data) {
					console.log(result);
					aAmountRangeLevel = result.d.results;
				},
				error: function (result, xhr, data) {
					console.log(result);
					aAmountRangeLevel = [];
				}
			});
			/*$.ajax({ // COMMENTED BY DEEKSHA 25/1/2022
				url: sApprovalLevelUrl,
				method: "GET",
				async: false,
				headers: {
					"Accept": "application/json"
				},
				  
				success: function (result, xhr, data) {
					console.log(result);
					aApprovalLevelList = result.d.results;
				},
				error: function (result, xhr, data) {
					console.log(result);
					aApprovalLevelList = [{
						"im_type": "B",
						"APP_LEVEL": "0",
						"CEO": "",
						"WORKFLOW_TYPE": "",
						"HOD": "",
						"CONTROLLING": "X",
						"DIRECTOR": "",
						"VP": "X",
						"MD1": "",
						"MD2": "",
						"CFO": ""
					},{
						"im_type": "B",
						"APP_LEVEL": "1",
						"CEO": "",
						"WORKFLOW_TYPE": "",
						"HOD": "",
						"CONTROLLING": "X",
						"DIRECTOR": "",
						"VP": "X",
						"MD1": "",
						"MD2": "",
						"CFO": ""
					}, {
						"im_type": "B",
						"APP_LEVEL": "2",
						"CEO": "",
						"WORKFLOW_TYPE": "",
						"HOD": "",
						"CONTROLLING": "X",
						"DIRECTOR": "",
						"VP": "X",
						"MD1": "",
						"MD2": "",
						"CFO": ""
					}, {
						"im_type": "B",
						"APP_LEVEL": "3",
						"CEO": "",
						"WORKFLOW_TYPE": "",
						"HOD": "",
						"CONTROLLING": "X",
						"DIRECTOR": "",
						"VP": "X",
						"MD1": "",
						"MD2": "",
						"CFO": ""
					}, {
						"im_type": "B",
						"APP_LEVEL": "4",
						"CEO": "",
						"WORKFLOW_TYPE": "",
						"HOD": "",
						"CONTROLLING": "X",
						"DIRECTOR": "",
						"VP": "X",
						"MD1": "",
						"MD2": "",
						"CFO": "X"
					}, {
						"im_type": "B",
						"APP_LEVEL": "5",
						"CEO": "X",
						"WORKFLOW_TYPE": "",
						"HOD": "",
						"CONTROLLING": "X",
						"DIRECTOR": "",
						"VP": "X",
						"MD1": "X",
						"MD2": "X",
						"CFO": "X"
					}];
				}
			});*/ // commented by deeksha 25/1/2022

			/*	var wpath = "/WfApproval_ControlSet";   // started by deeksha 25/1/2022
				var oDataModel = this.getOwnerComponent().getModel();
				var bFilter = [];
				bFilter.push(new Filter("WorkflowType", FilterOperator.EQ, "Budget"));
				oDataModel.read(wpath, {
					filters: bFilter,*/

			$.ajax({ // COMMENTED BY DEEKSHA 25/1/2022
				url: sApprovalLevelUrl,
				method: "GET",
				async: false,
				headers: {
					"Accept": "application/json"
				},

				success: function (oData, oResponse) {
					aApprovalLevelList = oData.d.results;
				},
				error: function (err) {
					aApprovalLevelList = [{
						"WorkflowType": "Budget",
						"APP_LEVEL": "0",
						"CEO": "",
						"WORKFLOW_TYPE": "",
						"HOD": "",
						"CONTROLLING": "X",
						"DIRECTOR": "",
						"VP": "X",
						"MD1": "",
						"MD2": "",
						"CFO": ""
					}, {
						"WorkflowType": "Budget",
						"APP_LEVEL": "1",
						"CEO": "",
						"WORKFLOW_TYPE": "",
						"HOD": "",
						"CONTROLLING": "X",
						"DIRECTOR": "",
						"VP": "X",
						"MD1": "",
						"MD2": "",
						"CFO": ""
					}, {
						"WorkflowType": "Budget",
						"APP_LEVEL": "2",
						"CEO": "",
						"WORKFLOW_TYPE": "",
						"HOD": "",
						"CONTROLLING": "X",
						"DIRECTOR": "",
						"VP": "X",
						"MD1": "",
						"MD2": "",
						"CFO": ""
					}, {
						"WorkflowType": "Budget",
						"APP_LEVEL": "3",
						"CEO": "",
						"WORKFLOW_TYPE": "",
						"HOD": "",
						"CONTROLLING": "X",
						"DIRECTOR": "",
						"VP": "X",
						"MD1": "",
						"MD2": "",
						"CFO": ""
					}, {
						"WorkflowType": "Budget",
						"APP_LEVEL": "4",
						"CEO": "",
						"WORKFLOW_TYPE": "",
						"HOD": "",
						"CONTROLLING": "X",
						"DIRECTOR": "",
						"VP": "X",
						"MD1": "",
						"MD2": "",
						"CFO": "X"
					}, {
						"WorkflowType": "Budget",
						"APP_LEVEL": "5",
						"CEO": "X",
						"WORKFLOW_TYPE": "",
						"HOD": "",
						"CONTROLLING": "X",
						"DIRECTOR": "",
						"VP": "X",
						"MD1": "X",
						"MD2": "X",
						"CFO": "X"
					}];

				}
			}); // ended by deeksha 25/1/2022

			var sLevel = "";
			for (var i = 0; i < aAmountRangeLevel.length; i++) {
				if (iTotalRequestedBudget >= aAmountRangeLevel[i].AMOUNT_FORM && iTotalRequestedBudget < aAmountRangeLevel[i].AMOUNT_TO) {
					sLevel = aAmountRangeLevel[i].APP_LEVEL;
				}
			}
			/*if ((sLevel == 0 || sLevel == 1) && (oModel.getProperty("/legalEntity")!= "DE01" || oModel.getProperty("/costCenter")!= "DE015200") ) {
				sLevel = 2;
			}*/ // commented by deeksha 24/1/2022

			//var aZGB_CDS_PJMAPPR = this.getView().getModel("ZGB_CDS_PJMAPPR").results[0]; // added by deeksha 24/1/2022
			var aZGB_CDS_PJMAPPR = this.getView().getModel("ZGB_CDS_PJMAPPR").results;
			for (var m = 0; m < aZGB_CDS_PJMAPPR.length; m++) {
			if (sLevel === 0 || sLevel === 1) {
				if(oModel.getProperty("/legalEntity") !== aZGB_CDS_PJMAPPR[m].COMPCODE || 
					oModel.getProperty("/costCenter") !== aZGB_CDS_PJMAPPR[m].COSTCENTER){
				sLevel = 2;
			//	return;
			}
			}
			} // ended by deeksha 24/1/2022

			var oApproveLevelInfo = {};
			for (var j = 0; j < aApprovalLevelList.length; j++) {
				if (sLevel == aApprovalLevelList[j].AppLevel) {
					oApproveLevelInfo = aApprovalLevelList[j];
				}
			}

			var aApproverLevelList = [],
				oApproverLevelInfo = {},
				iLevelCount = 0;
			//Requester Info
			oApproverLevelInfo.Level = iLevelCount++;
			oApproverLevelInfo.LevelDesc = "Requester";
			oApproverLevelInfo.Name = oModel.getData().requesterDisplayName;
			oApproverLevelInfo.Id = oModel.getData().requester;
			oApproverLevelInfo.Status = "APPROVED";
			oApproverLevelInfo.StatusDesc = "Request Created";
			aApproverLevelList.push(JSON.parse(JSON.stringify(oApproverLevelInfo)));

			if (oApproveLevelInfo.Pjm == 'X') { //started by deeksha 12/1/2022
				//if(aApproverLevelList.length == 0){
				oApproverLevelInfo.Level = iLevelCount++;
				oApproverLevelInfo.LevelDesc = "PJM";
				oApproverLevelInfo.Name = oModel.getData().approverName;
				oApproverLevelInfo.Id = oModel.getData().nextApprover;
				oApproverLevelInfo.Status = "PENDING";
				oApproverLevelInfo.StatusDesc = "Pending for Approval";
				aApproverLevelList.push(JSON.parse(JSON.stringify(oApproverLevelInfo)));
				/*} else {
            	oApproverLevelInfo.Level = iLevelCount++;
				oApproverLevelInfo.LevelDesc = "PJM";
				oApproverLevelInfo.Name = "";
				oApproverLevelInfo.Id = "";
				oApproverLevelInfo.Status = "";
				oApproverLevelInfo.StatusDesc = " ";
				aApproverLevelList.push(JSON.parse(JSON.stringify(oApproverLevelInfo)));
            } */ //ended by deeksha 12/1/2022
			}
			//Selected VP Info (VP is Mandatory)
			if (oApproveLevelInfo.Vp == 'X') { // line added by deeksha 12/1/2022
				if (aApproverLevelList.length == 1) {
					oApproverLevelInfo.Level = iLevelCount++;
					oApproverLevelInfo.LevelDesc = "VP";
					oApproverLevelInfo.Name = oModel.getData().approverName;
					oApproverLevelInfo.Id = oModel.getData().nextApprover;
					oApproverLevelInfo.Status = "PENDING";
					oApproverLevelInfo.StatusDesc = "Pending for Approval";
					aApproverLevelList.push(JSON.parse(JSON.stringify(oApproverLevelInfo)));
				} else {
					oApproverLevelInfo.Level = iLevelCount++;
					oApproverLevelInfo.LevelDesc = "VP";
					oApproverLevelInfo.Name = "";
					oApproverLevelInfo.Id = "";
					oApproverLevelInfo.Status = "";
					oApproverLevelInfo.StatusDesc = "";
					aApproverLevelList.push(JSON.parse(JSON.stringify(oApproverLevelInfo)));
				}
			} // line added by deeksha 12/1/2022

			if (oApproveLevelInfo.Controlling == 'X') {
				oApproverLevelInfo.Level = iLevelCount++;
				oApproverLevelInfo.LevelDesc = "CONTROLLING";
				oApproverLevelInfo.Name = "";
				oApproverLevelInfo.Id = "";
				oApproverLevelInfo.Status = "";
				oApproverLevelInfo.StatusDesc = "";
				aApproverLevelList.push(JSON.parse(JSON.stringify(oApproverLevelInfo)));
			}

			if (oApproveLevelInfo.Cfo == 'X') {
				oApproverLevelInfo.Level = iLevelCount++;
				oApproverLevelInfo.LevelDesc = "CFO";
				oApproverLevelInfo.Name = "";
				oApproverLevelInfo.Id = "";
				oApproverLevelInfo.Status = "";
				oApproverLevelInfo.StatusDesc = "";
				aApproverLevelList.push(JSON.parse(JSON.stringify(oApproverLevelInfo)));
			}

			if (oApproveLevelInfo.Md1 == 'X') {
				oApproverLevelInfo.Level = iLevelCount++;
				oApproverLevelInfo.LevelDesc = "MD1";
				oApproverLevelInfo.Name = "";
				oApproverLevelInfo.Id = "";
				oApproverLevelInfo.Status = "";
				oApproverLevelInfo.StatusDesc = "";
				aApproverLevelList.push(JSON.parse(JSON.stringify(oApproverLevelInfo)));
			}

			if (oApproveLevelInfo.Md2 == 'X') {
				oApproverLevelInfo.Level = iLevelCount++;
				oApproverLevelInfo.LevelDesc = "MD2";
				oApproverLevelInfo.Name = "";
				oApproverLevelInfo.Id = "";
				oApproverLevelInfo.Status = "";
				oApproverLevelInfo.StatusDesc = "";
				aApproverLevelList.push(JSON.parse(JSON.stringify(oApproverLevelInfo)));
			}

			if (oApproveLevelInfo.Ceo == 'X') {
				oApproverLevelInfo.Level = iLevelCount++;
				oApproverLevelInfo.LevelDesc = "CEO";
				oApproverLevelInfo.Name = "";
				oApproverLevelInfo.Id = "";
				oApproverLevelInfo.Status = "";
				oApproverLevelInfo.StatusDesc = "";
				aApproverLevelList.push(JSON.parse(JSON.stringify(oApproverLevelInfo)));
			}

			return aApproverLevelList;
		},

		// Start of changes by Vikas
		onChangeQuantity: function (oEvent) {
			var enteredValue, bValid = true;
			var oModel = this.getView().getModel("budget");
			// enteredValue = +oEvent.getParameter("newValue"); //Commented by Dhanush M V
			
			//Start of changes by Dhanush M V
			var cur_val = this.getView().getModel("budget").getProperty("/requestedBudgetCurrentYear");
			var next_val = this.getView().getModel("budget").getProperty("/requestdBudgetNextYear");
			
			if(cur_val !== undefined && next_val !== undefined){
				enteredValue = parseFloat(cur_val) + parseFloat(next_val);
			}
			else if(cur_val !== undefined && next_val === undefined){
				enteredValue = parseFloat(cur_val);
			}
			else if(cur_val === undefined && next_val !== undefined){
				enteredValue = parseFloat(next_val);
			}
			//End of changes by Dhanush M V
			
			// if( isNaN(enteredValue) ){
			// 	this._displayErrorMessage("Please enter a valid amount.");
			// 	bValid = false;
			// }
			// else 
			if (enteredValue <= 0) {
				this._displayErrorMessage("Amount should be greater than Zero.");
				// this._displayErrorMessage("Please enter a valid amount.");
				// oModel.setProperty("/requestedBudgetCurrentYear", "");
				bValid = false;
			}
			/*			else if( enteredValue % 1 !== 0 ){
							this._displayErrorMessage("Amount should not be in decimals.");
							bValid = false;
						}*/

			if (!bValid)
			oEvent.getSource().setValue(undefined);
			this._sCompanyCode = this.getView().getModel("budget").getData().legalEntity;
			this._sCostCenter = this.getView().getModel("budget").getData().costCenter;
			
			//Start of changes by Dhanush M V
			if(this._sCompanyCode === '' || this._sCompanyCode === undefined || this._sCompanyCode === null || 
			this._sCostCenter	=== '' || this._sCostCenter === undefined || this._sCostCenter === null){
				this._displayErrorMessage("Please enter both Legal Entity and Cost Center");
				return;
			}
			//End of changes by Dhanush M V
			
			//var aZGB_CDS_PJMAPPR = this.getView().getModel("ZGB_CDS_PJMAPPR").results[0];
			//if (this._sCompanyCode === "DE01" || this._sCostCenter === "DE015200" || enteredValue >1000) {
			var pjmapprdata = this.getView().getModel("ZGB_CDS_PJMAPPR").results;
			
			var aZGB_CDS_PJMAPPR = {};
		    if(pjmapprdata.length !== 0){
		    	for(var i=0;i<pjmapprdata.length;i++){
		    		if(pjmapprdata[i].COMPCODE === this._sCompanyCode && pjmapprdata[i].COSTCENTER === this._sCostCenter){
		    		aZGB_CDS_PJMAPPR = pjmapprdata[i];
		    		}
		    	}
		    }
			
			
			// for (var m = 0; m < aZGB_CDS_PJMAPPR.length; m++) {
			if (this._sCompanyCode === aZGB_CDS_PJMAPPR.COMPCODE && this._sCostCenter === aZGB_CDS_PJMAPPR.COSTCENTER && enteredValue > 1000) {
				this.getView().byId("pjmComboBox").setVisible(false);
				this.getView().byId("pjmComboBox").setEnabled(false);
				this.getView().byId("vpComboBox").setVisible(true);
				this.getView().byId("vpComboBox").setEnabled(true);
				//return;
			} else if (this._sCompanyCode === aZGB_CDS_PJMAPPR.COMPCODE && this._sCostCenter === aZGB_CDS_PJMAPPR.COSTCENTER && enteredValue <
				1000) {
				this.getView().byId("pjmComboBox").setVisible(true);
				this.getView().byId("pjmComboBox").setEnabled(true);
				this.getView().byId("vpComboBox").setVisible(false);
				this.getView().byId("vpComboBox").setEnabled(false);
				//return;
			}
			else{
				this.getView().byId("pjmComboBox").setVisible(false);
				this.getView().byId("pjmComboBox").setEnabled(false);
				this.getView().byId("vpComboBox").setVisible(true);
				this.getView().byId("vpComboBox").setEnabled(true);
				//return;
			}
		// }
		},

		handleValidationError: function (oEvent) {
			// this._displayErrorMessage("Please enter a valid amount");

			var oModel = this.getView().getModel("budget");
			oModel.setProperty("/requestedBudgetCurrentYear", undefined);

			oEvent.getSource().setValue(undefined);
		},
		handleValidationErrorNext: function (oEvent) {
			// this._displayErrorMessage("Please enter a valid amount");

			var oModel = this.getView().getModel("budget");

			oModel.setProperty("/requestdBudgetNextYear", undefined);

			oEvent.getSource().setValue(undefined);
		},

		handleValidationSuccess: function (oEvent) {
			// this.onChangeQuantity(oEvent);
		},

		_displayErrorMessage: function (sText) {
			var oController = this;
			if (this._bMessageOpen) {
				return;
			}
			this._bMessageOpen = true;
			var oDialog = new Dialog({
				title: "Error",
				type: "Message",
				state: "Error",
				content: new Text({
					text: sText
				}),
				beginButton: new Button({
					text: "OK",
					press: function () {
						oDialog.close();
						oController._bMessageOpen = false;
					}
				}),
				afterClose: function () {
					oDialog.destroy();
				}
			});
			oDialog.open();

		}

		// End of changes by Vikas
	});
});