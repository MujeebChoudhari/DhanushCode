sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/Button",
	"sap/m/Dialog",
	"sap/m/Text",
	'sap/m/MessageToast',
	"sap/m/UploadCollectionParameter",
	"sap/ui/unified/FileUploaderParameter",
	"../model/formatter",
	"sap/ui/model/Sorter",
	'sap/ui/core/Fragment',
	'sap/m/library',
	"sap/m/MessageBox"
], function (Controller, JSONModel, Filter, FilterOperator, Button, Dialog, Text, MessageToast, UploadCollectionParameter,
	FileUploaderParameter, Formatter, Sorter, Fragment, mobileLibrary, MessageBox) {
	"use strict";
	var URLHelper = mobileLibrary.URLHelper;
	return Controller.extend("gb.wf.cer.purchase.init.controller.InitPurchaseWorkflow", {
		formatter: Formatter,
		_aForwardingUsers: new Array(),

		onInit: function () {
			var supplierModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(supplierModel, "supplier");
			var glModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(glModel, "gl");
			var unitModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(unitModel, "unitMeasure");
			var curModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(curModel, "currency");
			var accountModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(accountModel, "account");
			var ApproverModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(ApproverModel, "approverlistModel");
			var RangeModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(RangeModel, "rangelistModel");
			var PurOrgModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(PurOrgModel, "purorglistModel");
			var PlantModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(PlantModel, "plantlistModel");

			var bugetModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(bugetModel, "bugetModel");

			var fieldEnable = new sap.ui.model.json.JSONModel();
			this.getView().setModel(fieldEnable, "fieldEnable");

			this.getView().getModel("fieldEnable").setProperty("/PJM", false);
			this.getView().getModel("fieldEnable").setProperty("/NONPJM", false);

			this.getView().byId('deliveryDatePicker').setMinDate(new Date);
			this.getView().byId("calculate").setEnabled(false);
			this.approverList();

			var that = this; // started by deeksha 24/1/2022
			var pjmAppr = "/ZGB_CDS_PJMAPPR";
			var oDataModel = this.getOwnerComponent().getModel();
			oDataModel.read(pjmAppr, {
				success: function (oData, oResponse) {
					that.getView().setModel(oData, "ZGB_CDS_PJMAPPR");
				}
			}); // ended by deeksha 24/1/2022

		},
		//Added by Sowjanya
		onBeforeRendering: function () {
			var oUserInfo;
			$.ajax({
				url: '/services/userapi/currentUser',
				method: "GET",
				async: false,
				success: function (result, xhr, data) {
					oUserInfo = result;
				},
				error: function (oErr) {
					var sErrMsg = oErr.getParameter("message");
					MessageBox.error(sErrMsg, {
						styleClass: "sapUiSizeCompact"
					});
				}
			});
			this.getOwnerComponent().getModel("WStatusModel").setHeaders({
				"userid": oUserInfo.name
			});
		},
		onSelect:function(oEvent){
			//var oIndex=oEvent.getSource().getSelectedIndex();
			var oPurModel = this.getView().getModel("pur");
			var oContext=oEvent.getParameters().rowContext;
			if(oContext!==null){
			var oSItem=oContext.getObject();
			var oLId = this.getView().byId("idSAB");
			var oRId = this.getView().byId("idSB");
			if (oSItem !== undefined) {
				oLId.setVisible(true);
				oRId.setVisible(true);
				oPurModel.setProperty("/bRTitle", oSItem.Short_Text);
				oPurModel.setProperty("/bRId", oSItem.ReqId);
			} else {
				oLId.setVisible(false);
				oRId.setVisible(false);
			}
			this.handleTableClose();
			}
			//console.log(oEvent);
		},
		handleTableClose:function(oEvent){
			this._pDialog.then(function (oDialog) {
					//this._configDialog(oButton, oDialog);
					oDialog.close();
				}.bind(this));
		},
		_onBudgetListPress: function (oEvent) {
			this.getView().setBusy(true);
			var costct = this.getView().byId("costCenterComboBox").getSelectedKey();
			var intord = this.getView().getModel("pur").getProperty("/sInternalOrder");
			if (costct !== "" && intord !== "" && intord!==undefined && costct!==undefined) {
				this._getBudgetList(costct, intord);
				var oButton = oEvent.getSource(),
					oView = this.getView();
				if (!this._pDialog) {
					this._pDialog = Fragment.load({
						id: oView.getId(),
						name: "gb.wf.cer.purchase.init.view.fragments.BudgetListInfo",
						controller: this
					}).then(function (oDialog) {
						oView.addDependent(oDialog);
						return oDialog;
					});
				}
				this._pDialog.then(function (oDialog) {
					//this._configDialog(oButton, oDialog);
					oDialog.open();
				}.bind(this));
			} else {
				this.getView().setBusy(false);
				MessageBox.error("Please select Internal Order and Cost Center", {
					styleClass: "sapUiSizeCompact"
				});
			}
		},
		onClickofReq: function (oEvent) {
			var oContext = oEvent.getSource().getBindingContext("bugetModel");
			var reqId = oContext.getModel().getProperty(oContext.sPath).ReqId;
			this.onBRequestDetail(reqId);
		},
		onClickofBReq: function () {
			var rId = this.getView().getModel("pur").getProperty("/bRId");
			this.onBRequestDetail(rId);
		},
		onBRequestDetail: function (reqId) {
			var url = window.location.origin + "/sites#WorkflowStatus-Display&/Budget/" + reqId;
			//var url="https://flpnwc-tw72h2gxnz.dispatcher.eu2.hana.ondemand.com/"+"/sites#WorkflowStatus-Display&/Budget/"+reqId;
			URLHelper.redirect(url, true);
		},
		_getBLFilter: function (costct, intord) {
			var aFilters = [];
			// aFilters.push(new Filter("Zstatus1", FilterOperator.EQ, "Closed"));
			aFilters.push(new Filter("Zstatus2", FilterOperator.EQ, "Approved"));
			aFilters.push(new Filter("WfType", FilterOperator.EQ, "Budget"));
			aFilters.push(new Filter("CostCt", FilterOperator.EQ, costct));
			aFilters.push(new Filter("IntOrd", FilterOperator.EQ, intord));
			return [new Filter({
				and: true,
				filters: aFilters
			})];

		},

		//Budget List from Status
		_getBudgetList: function (costct, intord) {
			var oFilter = this._getBLFilter(costct, intord);
			var oModel = this.getOwnerComponent().getModel("WStatusModel");
			var that = this;
			oModel.read("/WorkflowSet", {
				filters: oFilter,
				success: jQuery.proxy(function (oData, response) {
					that.getView().getModel("bugetModel").setData(oData.results);
					that.getView().setBusy(false);
					// oThis.getView().getModel("worklistView").setProperty("/busy", false);
					console.log("dgf", oData.results);
				}),
				error: jQuery.proxy(function (oError) {
					var msg;
					that.getView().setBusy(false);
					try {
						msg = oError.getParameter("message");
					} catch (e) {
						msg = oError.message;
					}
					//oThis.getView().getModel("worklistView").setProperty("/busy", false);
					MessageBox.error(msg, {
						styleClass: "sapUiSizeCompact"
					});
				})
			});
		},
		//Ended by Sowjanya
		// Added by Dhanush
		_getLang: function (langKey) {
			var oView = this.getView();
			var sContent = oView.getModel("i18n").getResourceBundle().getText(langKey);
			return sContent;
		},
		// Ended by Dhanush

		handleValueHelpInternalOrder: function () {
			if (!this._oValueHelpDialog) {
				this._oValueHelpDialog = sap.ui.xmlfragment("gb.wf.cer.purchase.init.view.fragments.InternalOrderDialog", this);
				this.getView().addDependent(this._oValueHelpDialog);
			}
			var Purorg = this.getView().byId("purchasingOrderComboBox").getSelectedKey();
			var plant = this.getView().byId("plantComboBox").getSelectedKey();
			var sPlant = this.getView().getModel().oData["Plant(PurchOrg='" + Purorg + "',Plant='" + plant + "')"].Description;
			var purmodel = this.getView().getModel("pur");
			// purmodel.setProperty("/plantdescription", sPlant);
			purmodel.setData({
				plantdescription: sPlant
			}, true);
			var legalEntityComboBox = this.getView().byId("legalEntityComboBox");
			var legalEntityKey = legalEntityComboBox.getSelectedKey();
			var costCenterComboBox = this.getView().byId("costCenterComboBox");
			var costCenterKey = costCenterComboBox.getSelectedKey();
			var aFilter = [];
			aFilter.push(new Filter("CompanyCode", FilterOperator.EQ, legalEntityKey));
			aFilter.push(new Filter("CostCenter", FilterOperator.EQ, costCenterKey));
			var oOpex = this.getView().byId("OC");
			if (oOpex.getSelected()) {
				aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "OC")); // = OPEX	
			} else {
				aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "IV")); // = CAPEX
			}

			this._oValueHelpDialog.getBinding("items").filter(aFilter);
			// console.log(this._oValueHelpDialog.getBinding("items"));
			this._oValueHelpDialog.open();
		},

		handleValueHelpCountryName: function () {
			if (!this._oValueHelpDialogCountry) {
				this._oValueHelpDialogCountry = sap.ui.xmlfragment("gb.wf.cer.purchase.init.view.fragments.CountryNameDialog", this);
				this.getView().addDependent(this._oValueHelpDialogCountry);
			}

			/*	var legalEntityComboBox = this.getView().byId("legalEntityComboBox");
				var legalEntityKey = legalEntityComboBox.getSelectedKey();
				var costCenterComboBox = this.getView().byId("costCenterComboBox");
				var costCenterKey = costCenterComboBox.getSelectedKey();
				var aFilter = [];
				aFilter.push(new Filter("CompanyCode", FilterOperator.EQ, legalEntityKey));
				aFilter.push(new Filter("CostCenter", FilterOperator.EQ, costCenterKey));
					var oOpex = this.getView().byId("OC");
				if (oOpex.getSelected()) {
					aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "OC")); // = OPEX	
				} else {
					aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "IV")); // = CAPEX
				}
				
				this._oValueHelpDialog.getBinding("items").filter(aFilter);
				console.log(this._oValueHelpDialog.getBinding("items"));
				*/
			this._oValueHelpDialogCountry.open();
		},

		handleValueHelpGLAccount: function (oEvent) {
			if (!this._oValueHelpDialogAccount) {
				this._oValueHelpDialogAccount = sap.ui.xmlfragment("gb.wf.cer.purchase.init.view.fragments.GLAccount", this);
				this.getView().addDependent(this._oValueHelpDialogAccount);
			}
			var legalEntityComboBox = this.getView().byId("legalEntityComboBox");
			var legalEntityKey = legalEntityComboBox.getSelectedKey();
			var costCenterComboBox = this.getView().byId("costCenterComboBox");
			var costCenterKey = costCenterComboBox.getSelectedKey();
			var accountComboBox = this.getView().byId("accountComboBox");

			var aFilter = [];
			aFilter.push(new Filter("CompanyCode", FilterOperator.EQ, legalEntityKey));
			var context = oEvent.getSource().getBindingContext("pos");
			this._oValueHelpDialogAccount.setBindingContext(context, "pos");
			this._oValueHelpDialogAccount.getBinding("items").filter(aFilter);
			this._oValueHelpDialogAccount.open();
		},

		handleValueHelpSupplier: function (oEvent) {
			if (!this._oValueHelpDialogSupplier) {
				this._oValueHelpDialogSupplier = sap.ui.xmlfragment("gb.wf.cer.purchase.init.view.fragments.SupplierDialog", this);
				this.getView().addDependent(this._oValueHelpDialogSupplier);
			}
			/*			var legalEntityComboBox = this.getView().byId("legalEntityComboBox");
						var legalEntityKey = legalEntityComboBox.getSelectedKey();
						var costCenterComboBox = this.getView().byId("costCenterComboBox");
						var costCenterKey = costCenterComboBox.getSelectedKey();
						var accountComboBox = this.getView().byId("accountComboBox");
						
						
						var aFilter = [];
						aFilter.push(new Filter("CompanyCode", FilterOperator.EQ, legalEntityKey));
						this._oValueHelpDialogAccount.getBinding("items").filter(aFilter);
			*/
			var context = oEvent.getSource().getBindingContext("pos");
			this._oValueHelpDialogSupplier.setBindingContext(context, "pos");
			this._oValueHelpDialogSupplier.open();
		},

		handleSearchInternalOrder: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			//	var oFilter = new Filter("Description", sap.ui.model.FilterOperator.Contains, sValue);

			var legalEntityComboBox = this.getView().byId("legalEntityComboBox");
			var legalEntityKey = legalEntityComboBox.getSelectedKey();
			var costCenterComboBox = this.getView().byId("costCenterComboBox");
			var costCenterKey = costCenterComboBox.getSelectedKey();

			var aFilter = [];
			aFilter.push(new Filter("Description", sap.ui.model.FilterOperator.Contains, sValue));
			aFilter.push(new Filter("CompanyCode", FilterOperator.EQ, legalEntityKey));
			aFilter.push(new Filter("CostCenter", FilterOperator.EQ, costCenterKey));
			var oOpex = this.getView().byId("OC");
			if (oOpex.getSelected()) {
				aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "OC")); // = OPEX	
			} else {
				aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "IV")); // = CAPEX
			}
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter(aFilter);
		},

		handleSearchCountryName: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			//	var oFilter = new Filter("Description", sap.ui.model.FilterOperator.Contains, sValue);
			var aFilter = [];
			aFilter.push(new Filter("LongName", sap.ui.model.FilterOperator.Contains, sValue));
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter(aFilter);
		},

		handleSuggest: function (oEvent) {
			var sValue = oEvent.getParameter("suggestValue");
			//	var oFilter = new Filter("Description", sap.ui.model.FilterOperator.Contains, sValue);

			var legalEntityComboBox = this.getView().byId("legalEntityComboBox");
			var legalEntityKey = legalEntityComboBox.getSelectedKey();
			var costCenterComboBox = this.getView().byId("costCenterComboBox");
			var costCenterKey = costCenterComboBox.getSelectedKey();

			var aFilter = [];
			aFilter.push(new Filter("Description", sap.ui.model.FilterOperator.Contains, sValue));
			aFilter.push(new Filter("CompanyCode", FilterOperator.EQ, legalEntityKey));
			aFilter.push(new Filter("CostCenter", FilterOperator.EQ, costCenterKey));
			var oOpex = this.getView().byId("OC");
			if (oOpex.getSelected()) {
				aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "OC")); // = OPEX	
			} else {
				aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "IV")); // = CAPEX
			}
			var oBinding = oEvent.getSource().getBinding("suggestionItems");
			oBinding.filter(aFilter);
		},

		handleSearchSupplier: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var legalEntityComboBox = this.getView().byId("legalEntityComboBox");
			var legalEntityKey = legalEntityComboBox.getSelectedKey();
			var poComboBox = this.getView().byId("purchasingOrderComboBox");
			var poKey = poComboBox.getSelectedKey();
			var aFilterSupplier = [];
			aFilterSupplier.push(new Filter("Name1", sap.ui.model.FilterOperator.Contains, sValue));
			aFilterSupplier.push(new Filter("PurchasingOrganization", FilterOperator.EQ, poKey));
			aFilterSupplier.push(new Filter("LegalEntity", FilterOperator.EQ, legalEntityKey));
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter(aFilterSupplier);
		},

		handleSearchGLAccount: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var aAccountFilter = [];
			var legalEntityComboBox = this.getView().byId("legalEntityComboBox");
			var legalEntityKey = legalEntityComboBox.getSelectedKey();
			var opex = this.getView().byId("OC");
			var sTypeKey;
			if (opex.getSelected()) {
				sTypeKey = "OC";
			} else {
				sTypeKey = "IV";
			}
			aAccountFilter.push(new Filter("LongText", sap.ui.model.FilterOperator.Contains, sValue));
			//aAccountFilter.push(new Filter("Scope", FilterOperator.EQ, sTypeKey));
			aAccountFilter.push(new Filter("CompanyCode", FilterOperator.EQ, legalEntityKey));
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter(aAccountFilter);
		},

		handleConfirmCountryName: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				var sCountryCode = aContexts[0].getObject().Country;
				var sCountryName = aContexts[0].getObject().LongName;
				var source = oEvent.getSource();
				//	var bindingContext = source.getBindingContext("pur");
				this.getView().getModel("pur").setProperty("/Country", sCountryCode); // Added by Dhanush
				this.getView().getModel("pur").setProperty("/CountryName", sCountryCode);
				this.getView().getModel("pur").setProperty("/CountryNameDisplay", sCountryName);
			}
		},
		handleConfirmInternalOrder: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			//for suggestion: oEvent.getParameter("selectedItem").getText() | getKey()

			if (aContexts && aContexts.length) {
				var sOrderNumber = aContexts[0].getObject().OrderNumber;
				var sOrderDescription = aContexts[0].getObject().Description;
				var oPurchaseModel = this.getView().getModel("pur");
				oPurchaseModel.setProperty("/sInternalOrder", sOrderNumber);
				oPurchaseModel.setProperty("/sInternalOrderDescription", sOrderDescription);
			}
			var aAccountFilter = [];
			var legalEntityComboBox = this.getView().byId("legalEntityComboBox");
			var legalEntityKey = legalEntityComboBox.getSelectedKey();
			aAccountFilter.push(new Filter("CompanyCode", FilterOperator.EQ, legalEntityKey));
			var opex = this.getView().byId("OC");
			var sTypeKey;
			if (opex.getSelected()) {
				sTypeKey = "OC";
			} else {
				sTypeKey = "IV";
			}
			aAccountFilter.push(new Filter("Scope", FilterOperator.EQ, sTypeKey));
			this.getView().getModel().read("/GLAccount", {
				filters: aAccountFilter,
				success: function (oResponse) {
					this.getView().getModel("account").setProperty("/accounts", oResponse.results);
				}.bind(this)
			});

			var internalOrderComboBox = this.getView().byId("internalOrderSelectDialog");
			var sOrderNumber = aContexts[0].getObject().OrderNumber;
			var internalOrderKey = internalOrderComboBox.getSelectedKey();
			var aFilter = [];
			var changeSupplementTable = this.getView().byId("changeSupplementTable");
			aFilter.push(new Filter("InternalOrder", FilterOperator.EQ, sOrderNumber));
			changeSupplementTable.bindRows({
				path: "/RequestedOrder",
				filters: aFilter
			});

			var aAddressFilters = [];
			//PurchaseOrganisation/ LegalEntity / Plant
			aAddressFilters.push(new Filter("LegalEntity", FilterOperator.EQ, legalEntityKey));
			var oPlantComboBox = this.getView().byId("plantComboBox");
			var sPlantKey = oPlantComboBox.getSelectedKey();
			aAddressFilters.push(new Filter("Plant", FilterOperator.EQ, sPlantKey));
			var oPoComboBox = this.getView().byId("purchasingOrderComboBox");
			var sPoKey = oPoComboBox.getSelectedKey();
			aAddressFilters.push(new Filter("PurchaseOrganization", FilterOperator.EQ, sPoKey));
			this.getView().getModel().read("/DeliveryAddress", {
				filters: aAddressFilters,
				success: function (oData, response) {
					if (oData.results[0] != undefined) {
						var oValues = oData.results[0];
						var oModel = this.getView().getModel("pur");
						oModel.setProperty("/Name", oValues.Name);
						oModel.setProperty("/Name2", oValues.Name2);
						oModel.setProperty("/Street", oValues.Street);
						oModel.setProperty("/HouseNo", oValues.HouseNo);
						oModel.setProperty("/PostalCode", oValues.PostalCode);
						oModel.setProperty("/City", oValues.City);
						oModel.setProperty("/Street1", oValues.Street1);
						oModel.setProperty("/Country", oValues.Country);
						oModel.setProperty("/CountryName", oValues.Country);
						oModel.setProperty("/CountryNameDisplay", oValues.CountryName); // Added by Dhanush
						// console.log(oData);
					}
				}.bind(this),
				error: function (oError) {
					// console.log(oError);
				}.bind(this)
			});
		},

		handleConfirmGLAccount: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				var sAccountNumber = aContexts[0].getObject().AccountNumber;
				var sAccountLongText = aContexts[0].getObject().LongText;
				var source = oEvent.getSource();
				var bindingContext = source.getBindingContext("pos");
				bindingContext.getModel().setProperty("GlAccount", sAccountNumber, bindingContext);
				bindingContext.getModel().setProperty("GlAccountDisplay", sAccountLongText, bindingContext);
			}
		},

		handleConfirmSupplier: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				var sSupplier = aContexts[0].getObject().Vendor;
				var sSupplierDisplay = aContexts[0].getObject().Name1;
				var source = oEvent.getSource();
				var bindingContext = source.getBindingContext("pos");
				bindingContext.getModel().setProperty("Supplier", sSupplier, bindingContext);
				bindingContext.getModel().setProperty("SupplierDisplay", sSupplierDisplay, bindingContext);
			}
		},

		onChangeSupplier: function (oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");
			var oContext = oSelectedItem.getBindingContext("supplier");
			var sDisplayName = oContext.getProperty("Name1");
			var source = oEvent.getSource();
			var bindingContext = source.getBindingContext("pos");
			bindingContext.getModel().setProperty("SupplierDisplay", sDisplayName, bindingContext);
		},
		// Added by Dhanush
		onChangeCurrency: function (oEvent) {
			var oBindingCtx = oEvent.getSource().getBindingContext("pos");
			var spath = oBindingCtx.sPath;
			var arr = spath.split("/");
			var index = arr[arr.length - 1];
			var quantity = oBindingCtx.getProperty("Quantity");
			var unitPrice = oBindingCtx.getProperty("Amount");
			if (quantity === undefined || quantity === "") {
				sap.m.MessageToast.show("Please fill the quantity field");
				this.getView().byId('positionNumberTable').getRows()[index].getCells()[5].setValueState("Error");
				this.getView().byId("calculate").setEnabled(false);
			} else if (unitPrice === undefined || unitPrice === "") {
				sap.m.MessageToast.show("Please fill the unit price field");
				this.getView().byId("calculate").setEnabled(false);
				this.getView().byId('positionNumberTable').getRows()[index].getCells()[6].setValueState("Error");
			} else {
				this.getView().byId("calculate").setEnabled(true);
				this.getView().byId('positionNumberTable').getRows()[index].getCells()[5].setValueState("None");
				this.getView().byId('positionNumberTable').getRows()[index].getCells()[6].setValueState("None");
			}
			this.getView().byId("btnStartRequest").setEnabled(false);
		},
		// Ended by Dhanush
		onChangeUoM: function (oEvent) {
			//Added by Dhanush
			var oBindingCtx = oEvent.getSource().getBindingContext("pos");
			var spath = oBindingCtx.sPath;
			var arr = spath.split("/");
			var index = arr[arr.length - 1];
			var quantity = oBindingCtx.getProperty("Quantity");
			var unitPrice = oBindingCtx.getProperty("Amount");
			if (quantity === undefined || quantity === "") {
				sap.m.MessageToast.show("Please fill the quantity field");
				this.getView().byId("calculate").setEnabled(false);
				this.getView().byId('positionNumberTable').getRows()[index].getCells()[5].setValueState("Error");
			} else if (unitPrice === undefined || unitPrice === "") {
				sap.m.MessageToast.show("Please fill the unit price field");
				this.getView().byId("calculate").setEnabled(false);
				this.getView().byId('positionNumberTable').getRows()[index].getCells()[6].setValueState("Error");
			} else {
				this.getView().byId("calculate").setEnabled(true);
				this.getView().byId('positionNumberTable').getRows()[index].getCells()[5].setValueState("None");
				this.getView().byId('positionNumberTable').getRows()[index].getCells()[6].setValueState("None");
			}
			//Ended by Dhanush
			var oSelectedItem = oEvent.getParameter("selectedItem");
			var oContext = oSelectedItem.getBindingContext("unitMeasure");
			var sDisplayName = oContext.getProperty("UnitText");
			var source = oEvent.getSource();
			var bindingContext = source.getBindingContext("pos");
			bindingContext.getModel().setProperty("UnitDisplay", sDisplayName, bindingContext);
			this.getView().byId("btnStartRequest").setEnabled(false);
		},

		onStartWorkflow: function () {
			var token = this._fetchToken();
			this._startInstance(token);
			//this._readDefinitions(token);
		},

		onSubmitUnitPrice: function (oEvent) {
			var oBindingCtx = oEvent.getSource().getBindingContext("pos");
			var spath = oBindingCtx.sPath;
			var arr = spath.split("/");
			var index = arr[arr.length - 1];
			var qty = this.getView().byId('positionNumberTable').getRows()[index].getCells()[5].getValue();
			var unitP = this.getView().byId('positionNumberTable').getRows()[index].getCells()[6].getValue();
			var oNumberFormatter = Intl.NumberFormat('en-US', {
				minimumFractionDigits: 2
			});
			this.onQuantity(); // added by deeksha 17/12/2021
			if (qty !== "" && parseFloat(qty) > 0) {
				// this.getView().getModel('pos').getData().data[index].Quantity = qty;
				this.getView().byId('positionNumberTable').getRows()[index].getCells()[5].setValueState("None");
			} else {
				this.getView().getModel('pos').getData().data[index].Quantity = undefined;
			}
			if (unitP !== "" && parseFloat(unitP) > 0) {
				// this.getView().getModel('pos').getData().data[index].Amount = unitP;
				this.getView().byId('positionNumberTable').getRows()[index].getCells()[6].setValueState("None");
			} else {
				this.getView().getModel('pos').getData().data[index].Amount = undefined;
			}
			var quantity = oBindingCtx.getProperty("Quantity");
			var unitPrice = oBindingCtx.getProperty("Amount");
			if (quantity !== null && quantity !== undefined && quantity !== "" && unitPrice !== null && unitPrice !== undefined && unitPrice !==
				"") {
				// var totalAmount = quantity * unitPrice;
				//this.onQuantity();
				var totalAmount = quantity * unitPrice;
				oBindingCtx.getModel().setProperty("TotalAmount", totalAmount, oBindingCtx);
				this.getView().byId("calculate").setEnabled(true);
				this.getView().byId('positionNumberTable').getRows()[index].getCells()[5].setValueState("None");
				this.getView().byId('positionNumberTable').getRows()[index].getCells()[6].setValueState("None");
			} else {
				totalAmount = undefined;
				oBindingCtx.getModel().setProperty("TotalAmount", totalAmount, oBindingCtx);
				this.getView().byId("calculate").setEnabled(false);
				if (quantity === undefined) {
					this.getView().byId('positionNumberTable').getRows()[index].getCells()[5].setValueState("Error");
				} else if (unitPrice === undefined) {
					this.getView().byId('positionNumberTable').getRows()[index].getCells()[6].setValueState("Error");
				}
			}
			//this.getView().byId("btnStartRequest").setEnabled(false);
			this.getView().byId("btnStartRequest").setEnabled(false);
			//this.onQuantity();
		},
		onDeleteRow: function (oEvent) {
			var sIdxPath = oEvent.getSource().getBindingContext("pos").sPath;
			var iIdx = parseInt(sIdxPath.split('/')[2], 10);
			var oModel = this.getView().getModel("pos");
			var aTableRows = oModel.getData().data;

			aTableRows[iIdx].Description = null;
			aTableRows[iIdx].SupplierDisplay = null;
			aTableRows[iIdx].Supplier = null;
			aTableRows[iIdx].Delivery = null;
			aTableRows[iIdx].GlAccount = null;
			aTableRows[iIdx].GlAccountDisplay = null;
			aTableRows[iIdx].Quantity = null;
			aTableRows[iIdx].Amount = null;
			aTableRows[iIdx].Currency = null;
			aTableRows[iIdx].TotalAmount = null;
			aTableRows[iIdx].UnitMeasure = null;
			aTableRows[iIdx].UnitDisplay = null;
			//var removed = aTableRows.splice(idx,1);
			oModel.setData({
				data: aTableRows
			});
			this.getView().byId("btnStartRequest").setEnabled(false);
			this.getView().byId("prTypeRadioButton").setEnabled(false);
			this.onClearApproverSelection();
			this.setApproversEnabled(false);
			this.getView().byId('positionNumberTable').getRows()[iIdx].getCells()[5].setValueState("None");
			this.getView().byId('positionNumberTable').getRows()[iIdx].getCells()[6].setValueState("None");
			var oPurchaseModel = this.getView().getModel("pur");
			oPurchaseModel.setProperty("/requestedBudget", null);
			oPurchaseModel.setProperty("/requestedBudgetThisYear", null);
			oPurchaseModel.setProperty("/requestedBudgetNextYear", null);
			oPurchaseModel.setData({
				requestedBudgetFormatted: null
			}, true);

			oPurchaseModel.setProperty("/sumAmountInCompCurrencyCode", null);
			oPurchaseModel.setProperty("/compCurrencyCode", null);

		},
		checkTableData: function () {
			var tableData = this.getView().getModel("pos").getProperty("/data")
				.filter(function (row) {
					return (row.GlAccount !== undefined || row.Currency !== undefined || row.Amount !== undefined ||
						row.Description !== undefined || row.Supplier !== undefined || row.Delivery !== undefined || row.Quantity !== undefined || row
						.UnitMeasure !== undefined) && !(row.GlAccount !== undefined && row.Currency !== undefined && row.Amount !== undefined &&
						row.Description !== undefined && row.Supplier !== undefined && row.Delivery !== undefined && row.Quantity !== undefined && row
						.UnitMeasure !== undefined);
				});
			return tableData.length;
		},

		onQuantity: function (oEvent) { //started by deeksha 10/12/2021

			/*var iFrame = this.getView().byId("ZOF");   //commented by deeksha 15/12
				var oQnty =	this.getView().getModel("pos").getProperty("/data");
				if(iFrame.getSelected() === true) {
					for(var i=0; i<oQnty.length; i++){
						if(oQnty[i].Quantity !== "") {
                             oQnty[i].Quantity = 1;
                             this.getView().getModel("pos").setProperty("Quantity", oQnty[i].Quantity);
						}
					}
                }*/

			var iFrame = this.getView().byId("ZOF");
			var oQnty = this.getView().getModel("pos").getProperty("/data");
			if (iFrame.getSelected() === true) {
				for (var i = 0; i < oQnty.length; i++) {
					if (oQnty[i].Quantity !== "" && oQnty[i].Quantity !== null && oQnty[i].Quantity !== undefined) {
						oQnty[i].Quantity = 1;
						this.getView().getModel("pos").setProperty("Quantity", oQnty[i].Quantity);
					}
				}
			}

		}, //ended by deeksha 10/12/2021

		onPressCalculateTotal: function (oEvent) {
			var oThis = this;
			if (this.getView().getModel("pur").getProperty("/sInternalOrder") === undefined) {
				var errorDialog = new Dialog({
					title: "Error",
					type: "Message",
					state: "Error",
					content: new Text({
						text: "Please select an internal order."
					}),
					beginButton: new Button({
						text: "OK",
						press: function () {
							errorDialog.close();
						}
					}),
					afterClose: function () {
						errorDialog.destroy();
					}
				});
				errorDialog.open();
				return;
			}

			var aTableData = this.getView().getModel("pos").getProperty("/data")
				.filter(function (row) {
					return (row.GlAccount !== undefined || row.Currency !== undefined || row.Amount !== undefined ||
						row.Description !== undefined || row.Supplier !== undefined || row.Delivery !== undefined || row.Quantity !== undefined || row
						.UnitMeasure !== undefined) && !(row.GlAccount !== undefined && row.Currency !== undefined && row.Amount !== undefined &&
						row.Description !== undefined && row.Supplier !== undefined && row.Delivery !== undefined && row.Quantity !== undefined && row
						.UnitMeasure !== undefined);
				});

			//	var aTableData =  this.getView().getModel("pos").getProperty("/data")
			//		.filter(function(row) { return row.GlAccount === undefined && row.Currency !== undefined && row.Amount !== undefined;});

			if (this.checkTableData() > 0) {
				var errorDialog = new Dialog({
					title: "Error",
					type: "Message",
					state: "Error",
					content: new Text({
						text: "Please fill in all columns for all edited rows. "
					}),
					beginButton: new Button({
						text: "OK",
						press: function () {
							errorDialog.close();
						}
					}),
					afterClose: function () {
						errorDialog.destroy();
					}
				});
				errorDialog.open();
			} else {
				var oNumberFormatter = Intl.NumberFormat('en-US', {
					minimumFractionDigits: 2
				});
				var sInputData = this.getView().getModel("pos").getProperty("/data")
					.filter(function (row) {
						return row.Currency !== undefined && row.Amount !== undefined && row.Amount !== null && row.Supplier !== undefined;
					})
					.map(function (row) {
						return row.TotalAmount + "#" + row.Currency + "#" + row.Delivery + "#";
					})
					.join("#");

				// console.log(sInputData);

				this.getView().getModel().callFunction("/CauculateTotals", {
					urlParameters: {
						InputData: sInputData.replace(/#$/, ''),
						CompanyCode: this.getView().getModel("pur").getProperty("/legalEntity"),
						CostCenter: this.getView().getModel("pur").getProperty("/costCenter"),  // added by deeksha
						InternalOrder: this.getView().getModel("pur").getProperty("/sInternalOrder")
					},
					success: function (oData, oResponse) {
						// console.log(oResponse);
						var fCurrentAvailable = parseFloat(oData.CurrentAvailable);
						var fCurrentSum = parseFloat(oData.CurrentSum);
						var fNextAvailable = parseFloat(oData.NextAvailable);
						var fNextSum = parseFloat(oData.NextSum);
						var fValueEur = parseFloat(oData.ValueEur);
						if (oResponse.statusCode !== "200") {
							//	internalOrderComboBox.setEnabled(false);
							var erDialog = new Dialog({
								title: "Error",
								type: "Message",
								state: "Error",
								content: new Text({
									text: "An error occured. Please contact you Administrator"
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
						} else if (fCurrentSum > fCurrentAvailable && fCurrentSum !== 0) {
							var erDialogBudget = new Dialog({
								title: "Error",
								type: "Message",
								state: "Error",
								content: new Text({
									text: "The requested Budget is higher than the available Budget. No Request possible!"
								}),
								beginButton: new Button({
									text: "OK",
									press: function () {
										erDialogBudget.close();
									}
								}),
								afterClose: function () {
									erDialogBudget.destroy();
								}
							});
							erDialogBudget.open();
						} else if (fNextSum > fNextAvailable && fNextSum !== 0) {
							var erDialogBudget = new Dialog({
								title: "Error",
								type: "Message",
								state: "Error",
								content: new Text({
									text: "The requested Budget is higher than the available Budget. No Request possible!"
								}),
								beginButton: new Button({
									text: "OK",
									press: function () {
										erDialogBudget.close();
									}
								}),
								afterClose: function () {
									erDialogBudget.destroy();
								}
							});
							erDialogBudget.open();
						} else {
							var oPurchaseModel = this.getView().getModel("pur");
							oPurchaseModel.setProperty("/requestedBudget", fValueEur);
							/*oPurchaseModel.setProperty("/requestedBudgetThisYear",fCurrentSum);*/
							var oCurr = this.getView().getModel("Currency").getData("CurrencyCode");
							oPurchaseModel.setProperty("/requestedBudgetThisYear", fCurrentSum);

							oPurchaseModel.setProperty("/currencyCode", oCurr.CurrencyCode); //added by Deeksha

							oPurchaseModel.setProperty("/requestedBudgetNextYear", fNextSum);
							var requestedBudgetFormatted = parseInt(oData.ValueEur, 10);
							oPurchaseModel.setData({
								requestedBudgetFormatted: requestedBudgetFormatted
							}, true);
							oPurchaseModel.setProperty("/sumAmountInCompCurrencyCode", oData.ValueComCurr);
							oPurchaseModel.setProperty("/compCurrencyCode", oData.CompanyCurr);
							this.getView().byId("btnStartRequest").setEnabled(true);
							this.getView().byId("prTypeRadioButton").setEnabled(true);
							this.setApproversValues();
							this.setInvoiceApprover();
							this.setApproversEnabled(true);
						}

					}.bind(this),

					error: function (oError) {
						var erDialog = new Dialog({
							title: "Error",
							type: "Message",
							state: "Error",
							content: new Text({
								text: oThis._getLang("contactsupport")
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
						erDialog.open(); //disable Button next
					}.bind(this)
				});

			}

			// added by deeksha 21/1/2022
			/*var pjmAppr = "/ZGB_CDS_PJMAPPR";  // commented by deeksha 21/1/2022
			var oDataModel = this.getOwnerComponent().getModel();
			oDataModel.read(pjmAppr, {
				success: function (oData, oResponse) {
					var oPurchaseModel = this.getView().getModel("pur");
					var dCompCode = this.getView().getProperty("COMPCODE");
					var dCostCenter = this.getView().getProperty("COSTCENTER");
					var thisBudget = this.getView().byId("reqBud");
					var nextBudget = this.getView().byId("reqNxt");
					var finalBudget = this.getView().byId("reqFinal");
					//if(dCompCode === "DE01" || dCostCenter === "DE015200" || thisBudget<'pur>/requestedBudgetThisYear' || nextBudget<'pur>/requestedBudgetNextYear' || finalBudget<'pur>/sumAmountInCompCurrencyCode') {
					if (dCompCode === "DE01" || dCostCenter === "DE015200" || thisBudget < 500 || nextBudget < 500 || finalBudget < 500) {
						this.getView().byId("pjmComboBox").setEnabled(true);
					} else if (dCompCode === "DE01" || dCostCenter === "DE015200" || thisBudget > 500 || nextBudget > 500 || finalBudget > 500) {
						this.getView().byId("pjmComboBox").setEnabled(false);
					}
				}
			});*/ // commented by deeksha 24/1/2022
			//this.CompanyCode = this.getView().getModel("pur").getData().legalEntity;
			//this.CostCenter = this.getView().getModel("pur").getData().costCenter;
			/*this.CompanyCode = this.getView().getModel("pur").getProperty("/legalEntity");
			this.CostCenter = this.getView().getModel("pur").getProperty("/costCenter");
			var thisBudget = this.getView().byId("reqBud");
					var nextBudget = this.getView().byId("reqNxt");
					var finalBudget = this.getView().byId("reqFinal");
			var aZGB_CDS_PJMAPPR = this.getView().getModel("ZGB_CDS_PJMAPPR").results[0];
			if (this.CompanyCode !== aZGB_CDS_PJMAPPR.COMPCODE && this.CostCenter !== aZGB_CDS_PJMAPPR.COSTCENTER && thisBudget>500 
			&& nextBudget>500 && finalBudget>500) {
		    	this.getView().byId("pjmComboBox").setEnabled(false);
		    }
		    else if (this.CompanyCode !== aZGB_CDS_PJMAPPR.COMPCODE && this.CostCenter !== aZGB_CDS_PJMAPPR.COSTCENTER && thisBudget<500 
		    && nextBudget<500 && finalBudget<500) {
		    	this.getView().byId("pjmComboBox").setEnabled(true);
		    }*/
			// ended by deeksha 21/1/2022

		},

		setInvoiceApprover: function () {
			var costCenterComboBox = this.getView().byId("costCenterComboBox");
			var costCenterKey = costCenterComboBox.getSelectedKey();

			var legalEntityComboBox = this.getView().byId("legalEntityComboBox");
			var legalEntityKey = legalEntityComboBox.getSelectedKey();
			var pur = this.getView().getModel("pur");
			var InvoiceapproversModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(InvoiceapproversModel, "InvoiceapproversModel");
			var aFilter = [];
			aFilter.push(new Filter("Zwfbukrs", FilterOperator.EQ, legalEntityKey));
			// aFilter.push(new Filter("Zwfkstlh", FilterOperator.EQ, costCenterKey));
			//HOD
			this.getView().getModel().read("/SelectApprover", {
				filters: aFilter,
				success: function (oResponse) {
					InvoiceapproversModel.setProperty("/invoiceapprovers", oResponse.results);
					pur.setProperty("/invoiceApprover", pur.getProperty("/requester"));
					pur.setProperty("/InvoiceApproverDisplay", pur.getProperty("/requesterName"));
					pur.setProperty("/InvoiceApproverMail", pur.getProperty("/requester"));
				}.bind(this),
				error: function (oError) {
					var tmp = oError;
				}.bind(this)
			});
		},

		setApproversValues: function () {
			var costCenterComboBox = this.getView().byId("costCenterComboBox");
			var costCenterKey = costCenterComboBox.getSelectedKey();

			var legalEntityComboBox = this.getView().byId("legalEntityComboBox");
			var legalEntityKey = legalEntityComboBox.getSelectedKey();
			var pur = this.getView().getModel("pur");
			var approversModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(approversModel, "approvers");
			var aFilter = [];
			aFilter.push(new Filter("Zwfbukrs", FilterOperator.EQ, legalEntityKey));
			aFilter.push(new Filter("Zwfkstlh", FilterOperator.EQ, costCenterKey));
			//HOD
			this.getView().getModel().read("/SelectApprover", {
				filters: aFilter,
				success: function (oResponse) {
					approversModel.setProperty("/approvers", oResponse.results);
					// pur.setProperty("/invoiceApprover", pur.getProperty("/requester"));
					// pur.setProperty("/InvoiceApproverDisplay", pur.getProperty("/requesterName"));
					// pur.setProperty("/InvoiceApproverMail", pur.getProperty("/requester"));
				}.bind(this),
				error: function (oError) {
					var tmp = oError;
				}.bind(this)
			});
		},

		setApproversEnabled: function (bIsEnabled) {

			this.CompanyCode = this.getView().getModel("pur").getProperty("/legalEntity"); // added by deeksha 25/1/2022
			this.CostCenter = this.getView().getModel("pur").getProperty("/costCenter");
			//this.CompanyCode = this.getView().getModel("pur").getData().legalEntity;
			//this.CostCenter = this.getView().getModel("pur").getData().costCenter;
			/*var thisBudget = this.getView().byId("reqBud");
				var nextBudget = this.getView().byId("reqNxt");*/
			if (bIsEnabled === true) {
				var finalBudget = parseFloat(this.getView().getModel("pur").getData().sumAmountInCompCurrencyCode);
				// var aZGB_CDS_PJMAPPR = this.getView().getModel("ZGB_CDS_PJMAPPR").results[0];

				var pjmapprdata = this.getView().getModel("ZGB_CDS_PJMAPPR").results;
				var aZGB_CDS_PJMAPPR = {};
				if (pjmapprdata.length !== 0) {
					for (var i = 0; i < pjmapprdata.length; i++) {
						if (pjmapprdata[i].COMPCODE === this.CompanyCode && pjmapprdata[i].COSTCENTER === this.CostCenter) {
							aZGB_CDS_PJMAPPR = pjmapprdata[i];
						}
					}
				}

				if (this.CompanyCode === aZGB_CDS_PJMAPPR.COMPCODE && this.CostCenter === aZGB_CDS_PJMAPPR.COSTCENTER && finalBudget < 500) {
					// this.getView().byId("pjmComboBox").setEnabled(true);
					this.getView().getModel("fieldEnable").setProperty("/PJM", true);
					this.getView().getModel("fieldEnable").setProperty("/NONPJM", false);

				} else {
					// this.getView().byId("pjmComboBox").setEnabled(false);
					this.getView().getModel("fieldEnable").setProperty("/PJM", false);
					this.getView().getModel("fieldEnable").setProperty("/NONPJM", true);

				}
			} else {

				this.getView().getModel("fieldEnable").setProperty("/PJM", bIsEnabled);
				this.getView().getModel("fieldEnable").setProperty("/NONPJM", bIsEnabled);

				//Set Enable
				// this.getView().byId("pjmComboBox").setEnabled(bIsEnabled); 
				// this.getView().byId("hodComboBox").setEnabled(bIsEnabled);
				// this.getView().byId("directorComboBox").setEnabled(bIsEnabled);
				// this.getView().byId("vpComboBox").setEnabled(bIsEnabled);
				// this.getView().byId("cfoComboBox").setEnabled(bIsEnabled);
				// this.getView().byId("md1ComboBox").setEnabled(bIsEnabled);
				// this.getView().byId("md2ComboBox").setEnabled(bIsEnabled);
				// this.getView().byId("ceoComboBox").setEnabled(bIsEnabled);
				// this.getView().byId("commentTextArea").setEnabled(bIsEnabled);
				// this.getView().byId("btnStartRequest").setEnabled(bIsEnabled);

			}
		},
		onSelectLegalEntity: function (oEvent) {
			var oModel = this.getView().getModel("pur");
			var costCenterComboBox = this.getView().byId("costCenterComboBox");
			var purchasingOrderComboBox = this.getView().byId("purchasingOrderComboBox");
			var oSelectedItem = oEvent.getParameter("selectedItem");
			var oItemContext = oSelectedItem.getBindingContext();
			var sLegalEntityDisplayName = oItemContext.getProperty("CompanyCodeName");
			oModel.setData({
				legalEntityDisplayName: sLegalEntityDisplayName
			}, true);
			costCenterComboBox.setEnabled(true);
			costCenterComboBox.bindItems({
				path: oItemContext.getPath() + "/to_CostCenter",
				sorter: new sap.ui.model.Sorter({
					path: "CostCenterName"
				}),
				length: '999',
				template: new sap.ui.core.ListItem({
					key: "{CostCenter}",
					text: "{CostCenterName}",
					additionalText: "{CostCenter}"
				})
			});
			/*costCenterComboBox.bindItems({
				path: oItemContext.getPath() + "/to_Currency",
				template: new sap.ui.core.ListItem({
					key: "{CostCenter}",
					text: "{CostCenterName}",
					additionalText: "{CostCenter}"
				})
			});*/
			var r = new sap.ui.model.json.JSONModel; /*added by Deeksha 02/11/2021*/
			var that = this;
			var oDataModel = this.getOwnerComponent().getModel();
			var opath = oItemContext.getPath() + "/to_Currency";
			oDataModel.read(opath, {
				success: function (oData, oResponse) {
					var oCurrency = oData;
					var oCurModel = new sap.ui.model.json.JSONModel();
					that.getView().setModel(oCurModel, "Currency");
					that.getView().getModel("Currency").setData({
						"CurrencyCode": oData.Currency
					});
				},
				error: function (err) {

				}
			}); /*ended by Deeksha 02/11/2021*/
			// purchasingOrderComboBox.setEnabled(true);
			purchasingOrderComboBox.bindItems({
				path: oItemContext.getPath() + "/to_PurchasingOrganization",
				template: new sap.ui.core.ListItem({
					key: "{PurchasingOrganization}",
					text: "{Description}",
					additionalText: "{PurchasingOrganization}"
				})
			});

			this.getView().getModel("pur").setProperty("/sInternalOrder", undefined);
			this.getView().getModel("pur").setProperty("/sInternalOrderDescription", undefined);
			this.getView().getModel("pur").setProperty("/plant", undefined);
			this.getView().getModel("pur").setProperty("/plantdescription", undefined);
			this.getView().getModel("pur").setProperty("/purchasingOrganization", undefined);
			this.getView().getModel("pur").setProperty("/purchasingOrgDisplayName", undefined);

			var oDataModel = this.getOwnerComponent().getModel();
			var oThis = this;
			var opath = "/Plant_PurchaseOrgSet(CompCd='" + oSelectedItem.getKey() + "')";
			this.getView().setBusy(true);
			oDataModel.read(opath, {
				success: jQuery.proxy(function (oData, oResponse) {
					this.getView().setBusy(false);
					var plant = oData.Plant;
					var purorg = oData.PurOrg;
					var legal = oData.CompCd;
					this.getView().byId("purchasingOrderComboBox").setSelectedKey(purorg);
					var oPurchaseModel = this.getView().getModel("pur");
					var sPurOrg = this.getView().getModel().oData["PurchasingOrganization('" + purorg + "')"].Description;
					oPurchaseModel.setData({
						purchasingOrgDisplayName: sPurOrg
					}, true);
					var plantComboBox = this.getView().byId("plantComboBox");
					// var oItem = this.getView().byId("purchasingOrderComboBox").mBindingInfos.selectedKey.binding.getPath();
					var oItemContextpath = "/PurchasingOrganization" + "('" + purorg + "')";
					// plantComboBox.setEnabled(true);
					plantComboBox.bindItems({
						path: oItemContextpath + "/to_Plant",
						template: new sap.ui.core.ListItem({
							key: "{Plant}",
							text: "{Description}",
							additionalText: "{Plant}"
						})
					});
					this.getView().byId("plantComboBox").setSelectedKey(plant);
					// oPurchaseModel.setProperty("/plantdescription", oPlantText);
					this.autoPlantUpdate(purorg, legal);
				}, this),
				error: jQuery.proxy(function (err) {
					this.getView().setBusy(false);
					var plantComboBox = this.getView().byId("plantComboBox");
					this.getView().byId("purchasingOrderComboBox").setSelectedKey("");
					plantComboBox.setSelectedKey("");
					// plantComboBox.setEnabled(false);
				}, this)
			});
			/*oDataModel.read()*/
			this.getView().byId("btnStartRequest").setEnabled(false);
		},

		autoPlantUpdate: function (purorg, legal) {
			var aFilter = [];
			aFilter.push(new Filter("PurchasingOrganization", FilterOperator.EQ, purorg));
			aFilter.push(new Filter("LegalEntity", FilterOperator.EQ, legal));
			// aAccountFilter.push(new Filter("CompanyCode", FilterOperator.EQ, legalEntityKey));
			this.getView().getModel().read("/Supplier", {
				filters: aFilter,
				success: jQuery.proxy(function (oResponse) {
					this.getView().getModel("supplier").setProperty("/suppliers", oResponse.results);
				}, this)
			});
			this.getView().getModel().read("/AvailableCurrency", {
				success: jQuery.proxy(function (oResponse) {
					this.getView().getModel("currency").setProperty("/currencies", oResponse.results);
				}, this)
			});

			this.getView().getModel().read("/UnitMeasure", {
				success: jQuery.proxy(function (oResponse) {
					this.getView().getModel("unitMeasure").setProperty("/unitMeasures", oResponse.results);
				}, this)
			});
		},

		onSelectCostCenter: function (oEvent) {
			var oThis = this;
			var oPurchaseModel = this.getView().getModel("pur");
			var internalOrderComboBox = this.getView().byId("internalOrderSelectDialog");
			var legalEntityComboBox = this.getView().byId("legalEntityComboBox");
			var opex = this.getView().byId("OC");
			var legalEntityKey = legalEntityComboBox.getSelectedKey();
			var oSelectedItem = oEvent.getParameter("selectedItem");
			var oItemContext = oSelectedItem.getBindingContext();
			var sCostCenterDisplayName = oItemContext.getProperty("CostCenterName");
			oPurchaseModel.setData({
				costCenterDisplayName: sCostCenterDisplayName
			}, true);
			var costCenterKey = oSelectedItem.getKey();
			this.getView().byId("btnStartRequest").setEnabled(false);
			// check if user is allowed to go on 
			this.getView().getModel().callFunction("/GetValidRequestors", {
				urlParameters: {
					Zwfdomain1: oPurchaseModel.getProperty("/requester"),
					Zwfbukrs: legalEntityKey,
					Zwfkstlh: costCenterKey
						//Zwfrole: "REQUESTER"
				},
				success: function (oData, oResponse) {
					if (oResponse.data.results.length === 0) {
						// this.getView().byId("btnStartRequest").setEnabled(false);
						internalOrderComboBox.setEnabled(false);
						var erDialog = new Dialog({
							title: "Error",
							type: "Message",
							state: "Error",
							content: new Text({
								// text: "Your not allowed to create Purchase Request for chosen legal Entity and Cost center."
								text: oThis._getLang("notallowedtocreaterequest")
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
						return;
					} else {
						// this.getView().byId("btnStartRequest").setEnabled(true);
						var aForwardingUsers = [];
						// var oEmptEntry = {
						// 	"FirstName": "-----",
						// 	"SecondName": "-----",
						// 	"Name": "-----",
						// 	"Role": "NONE",
						// 	"Email": "",
						// 	"Zwfdomain1": "EMPTY"
						// };
						// aForwardingUsers.push(oEmptEntry);
						var oForwardingUser = {
							"FirstName": oData.results[0].FirstName,
							"SecondName": oData.results[0].SecondName,
							"Name": oData.results[0].FirstName + " " + oData.results[0].SecondName,
							"Role": "REQUESTER",
							"Email": oData.results[0].Zwfmail1,
							"Zwfdomain1": oData.results[0].Zwfdomain1,
							"DeputyFirstName": oData.results[0].Zwfname3,
							"DeputySecondName": oData.results[0].Zwfname4,
							"DeputyName": oData.results[0].Zwfname3 + " " + oData.results[0].Zwfname4,
							"DeputyRole": "REQUESTER",
							"DeputyEmail": oData.results[0].Zwfmail2,
							"Zwfdomain2": oData.results[0].Zwfdomain2
						};
						var oModel = this.getView().getModel("pur");
						aForwardingUsers.push(oForwardingUser);
						oModel.setData({
							oForwardingUsers: aForwardingUsers
						}, true);
						var sRequesterEmail = oData.results[0].Zwfmail1;
						oModel.setData({
							isForwarding: false
						}, true);
						oModel.setProperty("/requesterEmail", sRequesterEmail);
						//this.getView().getModel("pur").setProperty("/requesterEmail","j.zude@uniorg.de");
						internalOrderComboBox.setEnabled(true);
					}

				}.bind(this),
				error: function (oError) {}.bind(this)
			});
			var aFilter = [];
			aFilter.push(new Filter("CompanyCode", FilterOperator.EQ, legalEntityKey));
			aFilter.push(new Filter("CostCenter", FilterOperator.EQ, costCenterKey));
			if (opex.getSelected()) {
				aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "OC")); // = OPEX	
			} else {
				aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "IV")); // = CAPEX
			}
			//TODO??? nächste Zeile ausblenden ???
			internalOrderComboBox.setEnabled(true);
			this.getView().getModel("pur").setProperty("/sInternalOrder", undefined);
			this.getView().getModel("pur").setProperty("/sInternalOrderDescription", undefined);
			// this.getView().getModel("pur").setProperty("/plant", undefined);
			// this.getView().getModel("pur").setProperty("/plantdescription", undefined);
			// this.getView().getModel("pur").setProperty("/purchasingOrganization", undefined);
			// this.getView().getModel("pur").setProperty("/purchasingOrgDisplayName", undefined);
			/*			internalOrderComboBox.bindItems({
							path: "/InternalOrder",
							filters: aFilter,
							template: new sap.ui.core.ListItem({
								key: "{OrderNumber}",
								text: "{Description}",
								additionalText: "{OrderNumber}"
							})
						});
			*/
			this.getView().byId("btnStartRequest").setEnabled(false);
		},
		onTypeChange: function (oEvent) {
			this.getView().getModel("pur").getProperty("sInternalOrder");
			this.getView().getModel("pur").setData({
				sInternalOrderDescription: undefined
			}, true);
			this.getView().getModel("pur").setProperty("/sInternalOrder", undefined);
			this.getView().getModel("pur").setProperty("/sInternalOrderDescription", undefined);
			this.getView().getModel("pur").setProperty("/requestedBudget", undefined);
			this.getView().getModel("pur").setProperty("/requestedBudgetThisYear", undefined);
			this.getView().getModel("pur").setProperty("/requestedBudgetNextYear", undefined);
			this.getView().getModel("pur").setProperty("/sumAmountInCompCurrencyCode", undefined);
			this.getView().getModel("pur").setProperty("/compCurrencyCode", undefined);

			this.getView().byId("btnStartRequest").setEnabled(false);
			var oPosModel = this.getView().getModel("pos");
			var dataObject = {
				data: [{
					PositionNum: 10
				}, {
					PositionNum: 20
				}, {
					PositionNum: 30
				}, {
					PositionNum: 40
				}, {
					PositionNum: 50
				}, {
					PositionNum: 60
				}, {
					PositionNum: 70
				}, {
					PositionNum: 80
				}, {
					PositionNum: 90
				}, {
					PositionNum: 100
				}]
			};
			oPosModel.setData(dataObject);
			var aAccountFilter = [];
			var legalEntityComboBox = this.getView().byId("legalEntityComboBox");
			var legalEntityKey = legalEntityComboBox.getSelectedKey();
			aAccountFilter.push(new Filter("CompanyCode", FilterOperator.EQ, legalEntityKey));
			var opex = this.getView().byId("OC");
			var sTypeKey;
			if (opex.getSelected()) {
				sTypeKey = "OC";
				this.getView().byId("ZOF").setEnabled(true); // Added by Dhanush 06.05.2021
			} else {
				sTypeKey = "IV";
				this.getView().byId("ZOF").setEnabled(false); // Added by Dhanush 06.05.2021	
				this.getView().byId("ZNB").setSelected(true); // Added by Dhanush 06.05.2021
			}
			aAccountFilter.push(new Filter("Scope", FilterOperator.EQ, sTypeKey));
			this.getView().getModel().read("/GLAccount", {
				filters: aAccountFilter,
				success: function (oResponse) {
					this.getView().getModel("account").setProperty("/accounts", oResponse.results);
				}.bind(this)
			});
			/*			this.handleValueHelpInternalOrder();
						var internalOrderComboBox = this.getView().byId("internalOrderSelectDialog");
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
							internalOrderComboBox.bindItems({
								path: "/InternalOrder",
								filters: aFilter,
								template: new sap.ui.core.ListItem({
									key: "{OrderNumber}",
									text: "{Description}",
								    additionalText: "{OrderNumber}"
								})
							});
						}*/
		},
		onSelectInternalOrder: function (oEvent) {
			var oPurchaseModel = this.getView().getModel("pur");
			var internalOrderComboBox = this.getView().byId("internalOrderComboBox");
			var internalOrderKey = internalOrderComboBox.getSelectedKey();
			var changeSupplementTable = this.getView().byId("changeSupplementTable");
			var aFilter = [];
			var oSelectedItem = oEvent.getParameter("selectedItem");
			var oItemContext = oSelectedItem.getBindingContext();
			var sInternalOrderDisplayName = oItemContext.getProperty("Description");
			oPurchaseModel.setData({
				internalOrderDisplayName: sInternalOrderDisplayName
			}, true);

			var aAccountFilter = [];
			var legalEntityComboBox = this.getView().byId("legalEntityComboBox");
			var legalEntityKey = legalEntityComboBox.getSelectedKey();
			aAccountFilter.push(new Filter("CompanyCode", FilterOperator.EQ, legalEntityKey));
			var opex = this.getView().byId("OC");
			var sTypeKey;
			if (opex.getSelected()) {
				sTypeKey = "OC";
			} else {
				sTypeKey = "IV";
			}
			aAccountFilter.push(new Filter("Scope", FilterOperator.EQ, sTypeKey));
			this.getView().getModel().read("/GLAccount", {
				filters: aAccountFilter,
				success: function (oResponse) {
					this.getView().getModel("account").setProperty("/accounts", oResponse.results);
				}.bind(this)
			});
			aFilter.push(new Filter("InternalOrder", FilterOperator.EQ, internalOrderKey));
			changeSupplementTable.bindRows({
				path: "/RequestedOrder",
				filters: aFilter
			});
			this.getView().getModel().setProperty("/enableCalculateTotals", true);
			this.getView().byId("btnStartRequest").setEnabled(false);
		},
		addUserToForwardingUsers: function (oBindingContext, sRole) {
			//check if a user with the given role is already in the list. If so replace it with the new one.
			var oOldEntry = this._aForwardingUsers.filter(function (row) {
				return row.Role === sRole;
			});
			if (oOldEntry !== null && oOldEntry !== undefined && oOldEntry.length > 0) {
				oOldEntry.FirstName = oBindingContext.getProperty("FirstName");
				oOldEntry.SecondName = oBindingContext.getProperty("SecondName");
				oOldEntry.Name = oBindingContext.getProperty("FirstName") + " " + oBindingContext.getProperty("SecondName");
				oOldEntry.Role = sRole;
				oOldEntry.Email = oBindingContext.getProperty("Zwfmail1");
				oOldEntry.Zwfdomain1 = oBindingContext.getProperty("Zwfdomain1");
				oOldEntry.DeputyFirstName = oBindingContext.getProperty("Zwfname3");
				oOldEntry.DeputySecondName = oBindingContext.getProperty("Zwfname4");
				oOldEntry.DeputyName = oBindingContext.getProperty("Zwfname3") + " " + oBindingContext.getProperty("Zwfname4");
				oOldEntry.DeputyRole = sRole;
				oOldEntry.DeputyEmail = oBindingContext.getProperty("Zwfmail2");
				oOldEntry.Zwfdomain2 = oBindingContext.getProperty("Zwfdomain2");
			} else {
				var oForwardingUser = {
					"FirstName": oBindingContext.getProperty("FirstName"),
					"SecondName": oBindingContext.getProperty("SecondName"),
					"Name": oBindingContext.getProperty("FirstName") + " " + oBindingContext.getProperty("SecondName"),
					"Role": sRole,
					"Email": oBindingContext.getProperty("Zwfmail1"),
					"Zwfdomain1": oBindingContext.getProperty("Zwfdomain1"),
					"DeputyFirstName": oBindingContext.getProperty("Zwfname3"),
					"DeputySecondName": oBindingContext.getProperty("Zwfname4"),
					"DeputyName": oBindingContext.getProperty("Zwfname3") + " " + oBindingContext.getProperty("Zwfname4"),
					"DeputyRole": sRole,
					"DeputyEmail": oBindingContext.getProperty("Zwfmail2"),
					"Zwfdomain2": oBindingContext.getProperty("Zwfdomain2")
				};
				this._aForwardingUsers.push(oForwardingUser);
			}
		},

		onSelectInvoiceApprover: function (oEvent) {
			var oModel = this.getView().getModel("pur");
			var params = oEvent.getParameters();
			var sApproverName = params.selectedItem.getProperty("text");
			var sEmail = params.selectedItem.getProperty("key");
			oModel.setData({
				InvoiceApproverDisplay: sApproverName
			}, true);
			oModel.setData({
				InvoiceApproverMail: sEmail
			}, true);
		},

		onSelectPjm: function (oEvent) { // added by deeksha 12/1/2022

			var oModel = this.getView().getModel("pur");
			var params = oEvent.getParameters();
			var sApproverName = params.selectedItem.getProperty("text");
			var sEmail = params.selectedItem.getProperty("key");
			oModel.setData({
				PJMApproverDisplay: sApproverName
			}, true);
			oModel.setData({
				PJMMail: sEmail
			}, true);
			this.oBindingContextPJM = params.selectedItem.getBindingContext("approvers");

		}, // ended by deeksha 12/1/2022

		onSelectHod: function (oEvent) {
			var oModel = this.getView().getModel("pur");
			var params = oEvent.getParameters();
			var sApproverName = params.selectedItem.getProperty("text");
			// var sApproverSecondName = params.selectedItem.getProperty("additionalText");
			// var sApproverName = sApproverFirstName+" "+sApproverSecondName;
			var sEmail = params.selectedItem.getProperty("key");
			oModel.setData({
				HODApproverDisplay: sApproverName
			}, true);
			oModel.setData({
				HODMail: sEmail
			}, true);
			//add selected User to array "forwardingUsers"
			// var oBindingContext = params.selectedItem.getBindingContext("approvers");
			this.oBindingContextHOD = params.selectedItem.getBindingContext("approvers");
			// this.addUserToForwardingUsers(oBindingContext, "HOD");
		},

		onSelectDirector: function (oEvent) {
			var oModel = this.getView().getModel("pur");
			var params = oEvent.getParameters();
			var sApproverName = params.selectedItem.getProperty("text");
			// var sApproverSecondName = params.selectedItem.getProperty("additionalText");
			// var sApproverName = sApproverFirstName+" "+sApproverSecondName;
			var sEmail = params.selectedItem.getProperty("key");
			oModel.setData({
				DirectorApproverDisplay: sApproverName
			}, true);
			oModel.setData({
				DirectorMail: sEmail
			}, true);
			//add selected User to array "forwardingUsers"
			// var oBindingContext = params.selectedItem.getBindingContext("approvers");
			this.oBindingContextDIRECTOR = params.selectedItem.getBindingContext("approvers");
			// this.addUserToForwardingUsers(oBindingContext, "DIRECTOR");
		},

		onSelectVp: function (oEvent) {
			var oModel = this.getView().getModel("pur");
			var params = oEvent.getParameters();
			var sApproverName = params.selectedItem.getProperty("text");
			// var sApproverSecondName = params.selectedItem.getProperty("additionalText");
			// var sApproverName = sApproverFirstName+" "+sApproverSecondName;
			var sEmail = params.selectedItem.getProperty("key");
			oModel.setData({
				VPApproverDisplay: sApproverName
			}, true);
			oModel.setData({
				VPMail: sEmail
			}, true);
			//add selected User to array "forwardingUsers"
			// var oBindingContext = params.selectedItem.getBindingContext("approvers");
			this.oBindingContextVP = params.selectedItem.getBindingContext("approvers");
			// this.addUserToForwardingUsers(oBindingContext, "VP");
		},

		onSelectCfo: function (oEvent) {
			var oModel = this.getView().getModel("pur");
			var params = oEvent.getParameters();
			var sApproverName = params.selectedItem.getProperty("text");
			// var sApproverSecondName = params.selectedItem.getProperty("additionalText");
			// var sApproverName = sApproverFirstName+" "+sApproverSecondName;
			var sEmail = params.selectedItem.getProperty("key");
			oModel.setData({
				CFOApproverDisplay: sApproverName
			}, true);
			oModel.setData({
				CFOMail: sEmail
			}, true);
			//add selected User to array "forwardingUsers""approvers"
			// var oBindingContext = params.selectedItem.getBindingContext("approvers");
			this.oBindingContextCFO = params.selectedItem.getBindingContext("approvers");
			// this.addUserToForwardingUsers(oBindingContext, "CFO");
		},

		onSelectMd1: function (oEvent) {
			var oModel = this.getView().getModel("pur");
			var params = oEvent.getParameters();
			var sApproverName = params.selectedItem.getProperty("text");
			// var sApproverSecondName = params.selectedItem.getProperty("additionalText");
			// var sApproverName = sApproverFirstName+" "+sApproverSecondName;
			var sEmail = params.selectedItem.getProperty("key");
			var md2 = this.getView().byId("md2ComboBox").getSelectedItem();
			if (md2 !== undefined && md2 !== null && md2 !== "") {
				if (sEmail === md2.getKey()) {
					sap.m.MessageBox.error("This user is already selected as MD2 approver. Please select different user.");
					oModel.setProperty("/approvermd1", undefined);
					oModel.setProperty("/MD1ApproverDisplay", undefined);
					oModel.setProperty("/MD1Mail", undefined);
					return;
				}
			}
			oModel.setData({
				MD1ApproverDisplay: sApproverName
			}, true);
			oModel.setData({
				MD1Mail: sEmail
			}, true);
			//add selected User to array "forwardingUsers"
			// var oBindingContext = params.selectedItem.getBindingContext("approvers");
			this.oBindingContextMD1 = params.selectedItem.getBindingContext("approvers");
			// this.addUserToForwardingUsers(oBindingContext, "MD1");
		},

		onSelectMd2: function (oEvent) {
			var oModel = this.getView().getModel("pur");
			var params = oEvent.getParameters();
			var sApproverName = params.selectedItem.getProperty("text");
			// var sApproverSecondName = params.selectedItem.getProperty("additionalText");
			// var sApproverName = sApproverFirstName+" "+sApproverSecondName;
			var sEmail = params.selectedItem.getProperty("key");
			var md1 = this.getView().byId("md1ComboBox").getSelectedItem();
			if (md1 !== undefined && md1 !== null && md1 !== "") {
				if (sEmail === md1.getKey()) {
					sap.m.MessageBox.error("This user is already selected as MD1 approver. Please select different user.");
					oModel.setProperty("/approvermd2", undefined);
					oModel.setProperty("/MD2ApproverDisplay", undefined);
					oModel.setProperty("/MD2Mail", undefined);
					return;
				}
			}
			oModel.setData({
				MD2ApproverDisplay: sApproverName
			}, true);
			oModel.setData({
				MD2Mail: sEmail
			}, true);
			//add selected User to array "forwardingUsers"
			// var oBindingContext = params.selectedItem.getBindingContext("approvers");
			this.oBindingContextMD2 = params.selectedItem.getBindingContext("approvers");
			// this.addUserToForwardingUsers(oBindingContext, "MD2");
		},

		onSelectCeo: function (oEvent) {
			var oModel = this.getView().getModel("pur");
			var params = oEvent.getParameters();
			var sApproverName = params.selectedItem.getProperty("text");
			// var sApproverSecondName = params.selectedItem.getProperty("additionalText");
			// var sApproverName = sApproverFirstName+" "+sApproverSecondName;
			var sEmail = params.selectedItem.getProperty("key");
			oModel.setData({
				CEOApproverDisplay: sApproverName
			}, true);
			oModel.setData({
				CEOMail: sEmail
			}, true);
			// var oBindingContext = params.selectedItem.getBindingContext("approvers");
			this.oBindingContextCEO = params.selectedItem.getBindingContext("approvers");
			// this.addUserToForwardingUsers(oBindingContext, "CEO");
		},

		onSelectPurchasingOrganization: function (oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem").getKey();
			var oPurchaseModel = this.getView().getModel("pur");
			var plantComboBox = this.getView().byId("plantComboBox");
			// plantComboBox.setEnabled(true);

			var legalEntityComboBox = this.getView().byId("legalEntityComboBox");
			var legalEntityKey = legalEntityComboBox.getSelectedKey();
			var oSelectedItemPU = oEvent.getParameter("selectedItem");
			var oItemContext = oSelectedItemPU.getBindingContext();

			var sPurchasingOrgDisplayName = oItemContext.getProperty("Description");
			oPurchaseModel.setData({
				purchasingOrgDisplayName: sPurchasingOrgDisplayName
			}, true);

			// plantComboBox.setEnabled(true);
			plantComboBox.bindItems({
				path: oItemContext.getPath() + "/to_Plant",
				template: new sap.ui.core.ListItem({
					key: "{Plant}",
					text: "{Description}",
					additionalText: "{Plant}"
				})
			});
			var aFilter = [];
			var aAccountFilter = [];
			aFilter.push(new Filter("PurchasingOrganization", FilterOperator.EQ, oSelectedItem));
			aFilter.push(new Filter("LegalEntity", FilterOperator.EQ, legalEntityKey));
			aAccountFilter.push(new Filter("CompanyCode", FilterOperator.EQ, legalEntityKey));
			this.getView().getModel().read("/Supplier", {
				filters: aFilter,
				success: function (oResponse) {
					this.getView().getModel("supplier").setProperty("/suppliers", oResponse.results);
				}.bind(this)
			});
			this.getView().getModel().read("/AvailableCurrency", {
				success: function (oResponse) {
					this.getView().getModel("currency").setProperty("/currencies", oResponse.results);
				}.bind(this)
			});

			this.getView().getModel().read("/UnitMeasure", {
				success: function (oResponse) {
					this.getView().getModel("unitMeasure").setProperty("/unitMeasures", oResponse.results);
				}.bind(this)
			});
			/*			
						this.getView().getModel().read("/GLAccount", {
							filters: aAccountFilter,
							success: function (oResponse) {
								this.getView().getModel("account").setProperty("/accounts", oResponse.results);
							}.bind(this)
						});
			*/
		},

		onSelectPlant: function (oEvent) {
			var oModel = this.getView().getModel("pur");
			var oPlantText = oEvent.getParameter("selectedItem").getText();
			oModel.setProperty("/plantdescription", oPlantText);
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
		onExit: function () { /*added by Deeksha 02/11/2021*/
			if (this._oPopover) {
				this._oPopover.destroy();
			}
			if (this._oPopoverUSD) {
				this._oPopoverUSD.destroy();
			}
			if (this._oPopoverCAD) {
				this._oPopoverCAD.destroy();
			}
		},
		onCloseInfo: function (oEvent) {
			this._oPopover.close();
		},

		onCloseInfoUSD: function (oEvent) {
			this._oPopoverUSD.close();
		},

		onCloseInfoCAD: function (oEvent) {
			this._oPopoverCAD.close();
		},
		onAddOpenInfo: function (oEvent) {
			if (!this._aoPopover) {
				this._aoPopover = sap.ui.xmlfragment("gb.wf.cer.purchase.init.view.fragments.AddInfo", this);
				this.getView().addDependent(this._aoPopover);
			}
			this._aoPopover.openBy(oEvent.getSource());
		},
		onOpenInfo: function (oEvent) {
			// create popover
			var oCurrency = this.getView().getModel("Currency").getData();
			if (oCurrency.CurrencyCode == "EUR") {
				if (!this._oPopover) {
					this._oPopover = sap.ui.xmlfragment("gb.wf.cer.purchase.init.view.fragments.InfoFragment", this);
					this.getView().addDependent(this._oPopover);
					// this._oPopover.setModel(this.getView().getModel("approverlistModel"), "approverlistModel");
					// this._oPopover.setModel(this.getView().getModel("rangelistModel"), "rangelistModel");
				}
				this._oPopover.openBy(oEvent.getSource());
			} else if (oCurrency.CurrencyCode == "USD") {
				if (!this._oPopoverUSD) {
					this._oPopoverUSD = sap.ui.xmlfragment("gb.wf.cer.purchase.init.view.fragments.USDInfoFragment", this);
					this.getView().addDependent(this._oPopoverUSD);
					// this._oPopover.setModel(this.getView().getModel("approverlistModel"), "approverlistModel");
					// this._oPopover.setModel(this.getView().getModel("rangelistModel"), "rangelistModel");
				}
				this._oPopoverUSD.openBy(oEvent.getSource());
			} else if (oCurrency.CurrencyCode == "CAD") {
				if (!this._oPopoverCAD) {
					this._oPopoverCAD = sap.ui.xmlfragment("gb.wf.cer.purchase.init.view.fragments.CADInfoFragment", this);
					this.getView().addDependent(this._oPopoverCAD);
					// this._oPopover.setModel(this.getView().getModel("approverlistModel"), "approverlistModel");
					// this._oPopover.setModel(this.getView().getModel("rangelistModel"), "rangelistModel");
				}
				this._oPopoverCAD.openBy(oEvent.getSource());
			} /*ended by Deeksha 02/11/2021*/

			/*if (!this._oPopover) {
				this._oPopover = sap.ui.xmlfragment("gb.wf.cer.purchase.init.view.fragments.InfoFragment", this);
				this.getView().addDependent(this._oPopover);
				// this._oPopover.setModel(this.getView().getModel("approverlistModel"), "approverlistModel");
				// this._oPopover.setModel(this.getView().getModel("rangelistModel"), "rangelistModel");
			}
			this._oPopover.openBy(oEvent.getSource());*/
		},

		onClearApproverSelection: function (oEvent) {
			var oPurModel = this.getView().getModel("pur");
			this.getView().byId("pjmComboBox").setSelectedKey(""); // added by deeksha 12/1/2022
			oPurModel.setProperty("/approverpjm", null);
			oPurModel.setProperty("/PJMApproverDisplay", null); // ended by deeksha 12/1/2022
			this.getView().byId("hodComboBox").setSelectedKey("");
			oPurModel.setProperty("/approverhod", null);
			oPurModel.setProperty("/HODApproverDisplay", null);
			this.getView().byId("directorComboBox").setSelectedKey("");
			oPurModel.setProperty("/approverdirector", null);
			oPurModel.setProperty("/DirectorApproverDisplay", null);
			this.getView().byId("vpComboBox").setSelectedKey("");
			oPurModel.setProperty("/approvervp", null);
			oPurModel.setProperty("/VPApproverDisplay", null);
			this.getView().byId("cfoComboBox").setSelectedKey("");
			oPurModel.setProperty("/approvercfo", null);
			oPurModel.setProperty("/CFOApproverDisplay", null);
			this.getView().byId("md1ComboBox").setSelectedKey("");
			oPurModel.setProperty("/approvermd1", null);
			oPurModel.setProperty("/MD1ApproverDisplay", null);
			this.getView().byId("md2ComboBox").setSelectedKey("");
			oPurModel.setProperty("/approvermd2", null);
			oPurModel.setProperty("/MD2ApproverDisplay", null);
			this.getView().byId("ceoComboBox").setSelectedKey("");
			oPurModel.setProperty("/approverceo", null);
			oPurModel.setProperty("/CEOApproverDisplay", null);
			oPurModel.setProperty("/Zappr", null);
			this._aForwardingUsers = [];
		},
		onChangeDatePicker: function (oEvent) {
			var oDP = oEvent.getSource();
			var bValid = oEvent.getParameter("valid");
			this._iEvent++;
			if (bValid) {
				oDP.setValueState(sap.ui.core.ValueState.None);
			} else {
				oDP.setValueState(sap.ui.core.ValueState.Error);
			}
		},
		handleChangeDate: function (evt) {
			var src = evt.getSource();
			// 			 oToDateValue = evt.getSource().getProperty("dateValue"),
			// 			 oModel = this.getView().getModel("fm");
			// 			 oModel.setProperty("/oDateValue",oToDateValue);
			this.isValid = evt.getParameter("valid");
			this.errorMsg = "";
			if (!this.isValid) {
				this.errorMsg = "Please enter proper date.";
				src.setValueState("Error");
				src.setValueStateText(this.errorMsg);
				src.setValue("");
				sap.m.MessageToast.show(this.errorMsg);
			} else {
				this.errorMsg = "";
				src.setValueState("None");
				src.setValueStateText(this.errorMsg);
			}
		},
		// Added by Dhanush
		approverList: function () {
			var oThis = this;
			//var oDataModel = this.getOwnerComponent().getModel("approval"); // commenetd by deeksha 25/1/2022
			var oDataModel = this.getOwnerComponent().getModel();
			var apptype = "Purchase";
			//var path = "/zgb_cds_wf_approval(im_type='" + apptype + "')/Set"; // commenetd by deeksha 25/1/2022
			var aFilter = [];
			aFilter.push(new Filter("WorkflowType", FilterOperator.EQ, "Purchase"));
			// var path = "/WfApproval_ControlSet?$filter=WorkflowType eq 'Purchase'";
			var path = "/WfApproval_ControlSet";
			oDataModel.read(path, {
				filters: aFilter,
				success: function (oData, oResponse) {
					var data = oData.results;
					oThis.getView().getModel("approverlistModel").setData(data);
					oThis.rangeList();
				},
				error: function (err) {

				}
			});
		},

		rangeList: function () {
			var oThis = this;
			var oDataModel = this.getOwnerComponent().getModel("range");
			// var path = "/Zgb_cds_wf_range?$orderby=APP_LEVEL";
			var path = "/Zgb_cds_wf_range";
			oDataModel.read(path, {
				sorters: [new Sorter("APP_LEVEL", false)],
				success: function (oData, oResponse) {
					var data = oData.results;
					oThis.getView().getModel("rangelistModel").setData(data);
				},
				error: function (err) {

				}
			});
		},
		//Ended by Dhanush
		checkApprovers: function () {
			var oPurModel = this.getView().getModel("pur");
			//var sRequestedBudget = oPurModel.getProperty("/sumAmountInEuro");
			var bLevel0 = (oPurModel.getProperty("/approverpjm") === undefined || oPurModel.getProperty("/approverpjm") === null ? false :
				true); // added by deeksha 12/1/2022
			var bLevel1 = (oPurModel.getProperty("/approverhod") === undefined || oPurModel.getProperty("/approverhod") === null ? false :
				true);
			var bLevel2 = (oPurModel.getProperty("/approverdirector") === undefined || oPurModel.getProperty("/approverdirector") === null ?
				false : true);
			var bLevel3 = (oPurModel.getProperty("/approvervp") === undefined || oPurModel.getProperty("/approvervp") === null ? false :
				true);
			var bLevel4 = (oPurModel.getProperty("/approvercfo") === undefined || oPurModel.getProperty("/approvercfo") === null ? false :
				true);
			var bLevel5 = (oPurModel.getProperty("/approvermd1") === undefined || oPurModel.getProperty("/approvermd1") === null ? false :
				true);
			var bLevel6 = (oPurModel.getProperty("/approvermd2") === undefined || oPurModel.getProperty("/approvermd2") === null ? false :
				true);
			var bLevel7 = (oPurModel.getProperty("/approverceo") === undefined || oPurModel.getProperty("/approverceo") === null ? false :
				true);

			// Added by Dhanush

			// var isSufficientApproval = true;
			var isSufficientApproval = false;
			//var sRequestedBudget = 30000 ;
			var sRequestedBudget = oPurModel.getProperty("/requestedBudget");
			var approver = this.getView().getModel('approverlistModel').getData();
			var range = this.getView().getModel('rangelistModel').getData();

			if (sRequestedBudget <= 0) {
				sap.m.MessageToast.show("Please enter the valid amount");
			} else if (sRequestedBudget > 0) {
				// var PJMAPPR_CC_CC = this.getView().getModel("ZGB_CDS_PJMAPPR").results[0];

				var pjmapprdata = this.getView().getModel("ZGB_CDS_PJMAPPR").results;
				var PJMAPPR_CC_CC = {};
				if (pjmapprdata.length !== 0) {
					for (var i = 0; i < pjmapprdata.length; i++) {
						if (pjmapprdata[i].COMPCODE === oPurModel.getProperty("/legalEntity") && pjmapprdata[i].COSTCENTER === oPurModel.getProperty(
								"/costCenter")) {
							PJMAPPR_CC_CC = pjmapprdata[i];
						}
					}
				}

				for (var i = 0; i < range.length; i++) {
					if (sRequestedBudget >= range[i].AMOUNT_FORM && sRequestedBudget < range[i].AMOUNT_TO) {
						if (range[i].APP_LEVEL === 0 && oPurModel.getProperty("/legalEntity") == PJMAPPR_CC_CC.COMPCODE && oPurModel.getProperty(
								"/costCenter") ==
							PJMAPPR_CC_CC.COSTCENTER) {
							if (bLevel0 || bLevel1 || bLevel2 || bLevel3 || bLevel4 || bLevel5 || bLevel6 || bLevel7) {
								isSufficientApproval = true;
							}
						} else if (range[i].APP_LEVEL === 0 && (oPurModel.getProperty("/legalEntity") != PJMAPPR_CC_CC.COMPCODE || oPurModel.getProperty(
								"/costCenter") != PJMAPPR_CC_CC.COSTCENTER)) {
							if (bLevel1 || bLevel2 || bLevel3 || bLevel4 || bLevel5 || bLevel6 || bLevel7) {
								isSufficientApproval = true;
							}
						} else if (range[i].APP_LEVEL === 1 || range[i].APP_LEVEL === 2) {
							if (bLevel1 || bLevel2 || bLevel3 || bLevel4 || bLevel5 || bLevel6 || bLevel7) {
								isSufficientApproval = true;
							}
						} else if (range[i].APP_LEVEL === 3) {
							if (bLevel2 || bLevel3 || bLevel4 || bLevel5 || bLevel6 || bLevel7) {
								isSufficientApproval = true;
							}
						} else if (range[i].APP_LEVEL === 4) {
							if (bLevel3 || bLevel4 || bLevel5 || bLevel6 || bLevel7) {
								isSufficientApproval = true;
							}
						} else if (range[i].APP_LEVEL === 5) {
							if (bLevel4 && (bLevel5 || bLevel6)) {
								isSufficientApproval = true;
							}
						} else if (range[i].APP_LEVEL === 6) {
							if (bLevel4 && bLevel5 && bLevel6) {
								isSufficientApproval = true;
							}
						} else if (range[i].APP_LEVEL === 7) {
							if (bLevel4 && bLevel7) {
								isSufficientApproval = true;
							}
						}
						// for(var j=0;j<approver.length;j++){
						// 	if(range[i].APP_LEVEL===approver[j].APP_LEVEL){
						// 		//(bLevel1 || bLevel2 || bLevel3 || bLevel4 || bLevel5 || bLevel6 || bLevel7
						// 		if(approver[j].HOD==="X"){
						// 			if(!bLevel1){
						// 				isSufficientApproval = false;
						// 			}
						// 		}
						// 		if(approver[j].DIRECTOR==="X"){
						// 			if(!bLevel2){
						// 				isSufficientApproval = false;
						// 			}
						// 		}
						// 		if(approver[j].VP==="X"){
						// 			if(!bLevel3){
						// 				isSufficientApproval = false;
						// 			}
						// 		}
						// 		if(approver[j].CFO==="X"){
						// 			if(!bLevel4){
						// 				isSufficientApproval = false;
						// 			}
						// 		}
						// 		if(approver[j].MD1==="X"){
						// 			if(!bLevel5){
						// 				isSufficientApproval = false;
						// 			}
						// 		}
						// 		if(approver[j].MD2==="X"){
						// 			if(!bLevel6){
						// 				isSufficientApproval = false;
						// 			}
						// 		}
						// 		if(approver[j].CEO==="X"){
						// 			if(!bLevel7){
						// 				isSufficientApproval = false;
						// 			}
						// 		}
						// 	}
						// }
					}
				}
			}
			// Ended by Dhanush
			// Commented by Dhanush
			// if(sRequestedBudget <=50){
			// 	// no approver neccessary
			// 	isSufficientApproval = true;
			// }else if(sRequestedBudget > 50 && sRequestedBudget < 2500){
			// 	//HOD 
			// 	if(bLevel1 || bLevel2 || bLevel3 || bLevel4 || bLevel5 || bLevel6 || bLevel7){
			// 		isSufficientApproval = true;
			// 	}
			// }else if(sRequestedBudget >= 2500 && sRequestedBudget < 10000){
			// 	//HOD u Director
			// 	if(bLevel2 || bLevel3 || bLevel4 || bLevel5 || bLevel6 || bLevel7){
			// 		isSufficientApproval = true;
			// 	}
			// }else if(sRequestedBudget >= 10000 && sRequestedBudget <= 25000){
			// 	//HOD, DIRECTOR and VP	min 1 person >= level 3
			// 	if(bLevel3 || bLevel4 || bLevel5 || bLevel6 || bLevel7){
			// 		isSufficientApproval = true;
			// 	}
			// }else if(sRequestedBudget > 25000 && sRequestedBudget < 50000){
			// 	//HOD, DIRECTOR, VP, CFO and 1x MD	min 1 person = level 4 and 1 person >= level 5
			// 	if(bLevel4 && (bLevel5 || bLevel6 || bLevel7)){
			// 		isSufficientApproval = true;
			// 	}
			// }else if(sRequestedBudget >= 50000 && sRequestedBudget < 200000){
			// 	//HOD, DIRECTOR, VP, CFO and 2x MD	min 1 person = level 4 and 2 person >= level 5
			// 	if((bLevel4 && (bLevel5 && bLevel6) || (bLevel5 && bLevel7) || (bLevel6 && bLevel7))){
			// 		isSufficientApproval = true;
			// 	}
			// }else if(sRequestedBudget >= 200000){
			// 	//HOD, DIRECTOR, VP, CFO, 2x MD and CEO	min 1 person = level 4 and 1 person = level 7
			// 	if(bLevel4  && bLevel7){
			// 		isSufficientApproval = true;
			// 	}
			// }
			// Ended by Dhanush
			oPurModel.setProperty("/PJMset", false); // added by deeksha 12/1/2022
			oPurModel.setProperty("/HODset", false);
			oPurModel.setProperty("/DIRECTORset", false);
			oPurModel.setProperty("/VPset", false);
			oPurModel.setProperty("/CFOset", false);
			oPurModel.setProperty("/MD1set", false);
			oPurModel.setProperty("/MD2set", false);
			oPurModel.setProperty("/CEOset", false);
			//			var approver = "joezud01@GOODBABYINT.COM";
			var app = [];
			if (isSufficientApproval) {
				if (bLevel0) { // added by deeksha 12/1/2022
					oPurModel.setProperty("/PJMset", true);
					oPurModel.setProperty("/PJMApprover", oPurModel.getProperty("/approverpjm"));
					app.push("PJM");
					if (this.oBindingContextPJM !== undefined || this.oBindingContextPJM !== null) {
						this.addUserToForwardingUsers(this.oBindingContextPJM, "PJM");
					}
				} // ended by deeksha 12/1/2022
				if (bLevel1) {
					oPurModel.setProperty("/HODset", true);
					oPurModel.setProperty("/HODApprover", oPurModel.getProperty("/approverhod"));
					app.push("HOD");
					if (this.oBindingContextHOD !== undefined || this.oBindingContextHOD !== null) {
						this.addUserToForwardingUsers(this.oBindingContextHOD, "HOD");
					}
				}
				if (bLevel2) {
					oPurModel.setProperty("/DIRECTORset", true);
					oPurModel.setProperty("/DirectorApprover", oPurModel.getProperty("/approverdirector"));
					app.push("DIRECTOR");
					if (this.oBindingContextDIRECTOR !== undefined || this.oBindingContextDIRECTOR !== null) {
						this.addUserToForwardingUsers(this.oBindingContextDIRECTOR, "DIRECTOR");
					}
				}
				if (bLevel3) {
					oPurModel.setProperty("/VPset", true);
					oPurModel.setProperty("/VPApprover", oPurModel.getProperty("/approvervp"));
					app.push("VP");
					if (this.oBindingContextVP !== undefined || this.oBindingContextVP !== null) {
						this.addUserToForwardingUsers(this.oBindingContextVP, "VP");
					}
				}
				if (bLevel4) {
					oPurModel.setProperty("/CFOset", true);
					oPurModel.setProperty("/CFOApprover", oPurModel.getProperty("/approvercfo"));
					app.push("CFO");
					if (this.oBindingContextCFO !== undefined || this.oBindingContextCFO !== null) {
						this.addUserToForwardingUsers(this.oBindingContextCFO, "CFO");
					}
				}
				if (bLevel5) {
					oPurModel.setProperty("/MD1set", true);
					oPurModel.setProperty("/MD1Approver", oPurModel.getProperty("/approvermd1"));
					app.push("MD1");
					if (this.oBindingContextMD1 !== undefined || this.oBindingContextMD1 !== null) {
						this.addUserToForwardingUsers(this.oBindingContextMD1, "MD1");
					}
				}
				if (bLevel6) {
					oPurModel.setProperty("/MD2set", true);
					oPurModel.setProperty("/MD2Approver", oPurModel.getProperty("/approvermd2"));
					app.push("MD2");
					if (this.oBindingContextMD2 !== undefined || this.oBindingContextMD2 !== null) {
						this.addUserToForwardingUsers(this.oBindingContextMD2, "MD2");
					}
				}
				if (bLevel7) {
					oPurModel.setProperty("/CEOset", true);
					oPurModel.setProperty("/CEOApprover", oPurModel.getProperty("/approverceo"));
					app.push("CEO");
					if (this.oBindingContextCEO !== undefined || this.oBindingContextCEO !== null) {
						this.addUserToForwardingUsers(this.oBindingContextCEO, "CEO");
					}
				}
			}
			this._findFirstApprover();
			oPurModel.setData({
				ApproverList: app
			}, true);
			// console.log("Hallo");
			return isSufficientApproval;
		},

		_findFirstApprover: function () {
			var oPurModel = this.getView().getModel("pur");
			if (oPurModel.getProperty("/PJMset")) { // added by deeksha 12/1/2022
				oPurModel.setProperty("/Zappr", oPurModel.getProperty("/PJMApproverDisplay"));
				oPurModel.setProperty("/Zappr_email", oPurModel.getProperty("/PJMMail"));
				oPurModel.setProperty("/Zappr_role", "PJM");
				return;
			} // ended by deeksha 12/1/2022
			if (oPurModel.getProperty("/HODset")) {
				oPurModel.setProperty("/Zappr", oPurModel.getProperty("/HODApproverDisplay"));
				oPurModel.setProperty("/Zappr_email", oPurModel.getProperty("/HODMail"));
				oPurModel.setProperty("/Zappr_role", "HOD");
				return;
			}
			if (oPurModel.getProperty("/DIRECTORset")) {
				oPurModel.setProperty("/Zappr", oPurModel.getProperty("/DirectorApproverDisplay"));
				oPurModel.setProperty("/Zappr_email", oPurModel.getProperty("/DIRECTORMail"));
				oPurModel.setProperty("/Zappr_role", "DIRECTOR");
				return;
			}
			if (oPurModel.getProperty("/VPset")) {
				oPurModel.setProperty("/Zappr", oPurModel.getProperty("/VPApproverDisplay"));
				oPurModel.setProperty("/Zappr_email", oPurModel.getProperty("/VPMail"));
				oPurModel.setProperty("/Zappr_role", "VP");
				return;
			}
			if (oPurModel.getProperty("/CFOset")) {
				oPurModel.setProperty("/Zappr", oPurModel.getProperty("/CFOApproverDisplay"));
				oPurModel.setProperty("/Zappr_email", oPurModel.getProperty("/CFOMail"));
				oPurModel.setProperty("/Zappr_role", "CFO");
				return;
			}
			if (oPurModel.getProperty("/MD1set")) {
				oPurModel.setProperty("/Zappr", oPurModel.getProperty("/MD1ApproverDisplay"));
				oPurModel.setProperty("/Zappr_email", oPurModel.getProperty("/MD1Mail"));
				oPurModel.setProperty("/Zappr_role", "MD1");
				return;
			}
			if (oPurModel.getProperty("/MD2set")) {
				oPurModel.setProperty("/Zappr", oPurModel.getProperty("/MD2ApproverDisplay"));
				oPurModel.setProperty("/Zappr_email", oPurModel.getProperty("/MD2Mail"));
				oPurModel.setProperty("/Zappr_role", "MD2");
				return;
			}
			if (oPurModel.getProperty("/CEOset")) {
				oPurModel.setProperty("/Zappr", oPurModel.getProperty("/CEOApproverDisplay"));
				oPurModel.setProperty("/Zappr_email", oPurModel.getProperty("/CEOMail"));
				oPurModel.setProperty("/Zappr_role", "CEO");
				return;
			}
			// console.log("Hallo");
		},

		onFileDelete: function (oEvent) {
			var item = oEvent.getParameter("item");
			var ctx = item.getBinding("fileName").getContext();
			ctx.getModel().remove(ctx.getPath());
		},

		onAfterRendering: function () {
			var bucketId = this.getView().getModel("pur").getProperty("/bucketId");
			this.bucketId = bucketId; // Added by Dhanush
			var sPath = "/Buckets(\'" + bucketId + "\')/Files";
			var oUploadCollection = this.getView().byId("UploadCollection");
			oUploadCollection.getBinding("items").sPath = sPath;
			oUploadCollection.getBinding("items").refresh();
			// var sUserId = new sap.ushell.services.UserInfo().getUser().getId();
			var sUserId = new sap.ushell.Container.getService("UserInfo").getUser().getId();
			// var sUserId = "mujcho01@goodbabyint.com";
			if (sUserId !== null && sUserId !== undefined) {
				// var sUserDisplayName = new sap.ushell.services.UserInfo().getUser().getFullName();
				var sUserDisplayName = new sap.ushell.Container.getService("UserInfo").getUser().getFullName();
				// var sUserDisplayName = "Mujeeb Choudhari";
				// var sUserEmail = new sap.ushell.services.UserInfo().getUser().getEmail();
				var aSplits = sUserId.split("@");
				var sRequesterId = aSplits[0] + "@" + aSplits[1].toUpperCase();
				this.getView().getModel("pur").setProperty("/requester", sRequesterId);
				//this.getView().getModel("pur").setProperty("/requesterEmail",sUserEmail);
				this.getView().getModel("pur").setProperty("/requesterName", sUserDisplayName);
			}
			// console.log("MODEL", this.getView().getModel("pur"));				
		},

		onChangeRequisitionType: function (oEvent) {

			var buttonId = oEvent.getSource().getSelectedButton().getId();
			var index = oEvent.getSource().getSelectedIndex();
			if (index === 1) {
				var dialog = new Dialog({
					title: "Information",
					type: "Message",
					state: "Information",
					content: new Text({
						text: "In the 'Framework Requisition' process only 1 quantity will be taken in each line item in position table."
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
		},

		onBeforeUploadStarts: function (oEvent) {

			// this.getView().getModel().setProperty("/bucketId", UUID);
			var bucketId = this.getView().getModel("pur").getProperty("/bucketId");

			var bucketPath = "/Buckets(\'" + bucketId + "\'/Files";
			this.getView().getModel("pur").setProperty("/bucketPath", bucketPath);
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
		getAttachmentURLs: function (oEvent) {
			var sUrls = "-----";
			var sUrlsForStatusReport;
			var aItems = this.getView().byId("UploadCollection").getItems();
			if (aItems.length > 0) {
				sUrls = aItems.map(function (row) {
					return row.getUrl();
				}).join("\n");

				sUrlsForStatusReport = aItems.map(function (row) {
					return row.getUrl();
				}).join("#");
			}

			this.getView().getModel("pur").setProperty("/sAttachmentLinks", sUrlsForStatusReport);
			return sUrls;
		},

		/*		getAttachmentURLsForStatusReport: function(){
				    		var sUrls;
				    		
							var aItems = this.getView().byId("UploadCollection").getItems();
							if(aItems.length > 0){
								 sUrls = aItems.map(function(row){
									return row.getUrl();
								}).join("\n");
			
							}
					
					this.getView().getModel("pur").setProperty("/sAttachmentLinks", sUrls);
				},
			*/
		getTablePositionsAsString: function () {
			//var sPositions = "----";
			var oNumberFormatter = Intl.NumberFormat('en-US', {
				minimumFractionDigits: 2
			});
			var sPositions = this.getView().getModel("pos").getProperty("/data")
				.filter(function (row) {
					return row.Currency !== undefined && row.Amount !== undefined && row.Currency !== null && row.Amount !== null;
				})
				.map(function (row) {
					return "Pos.: " + row.PositionNum + ", Descr.: " + row.Description + ", Supplier: " + row.SupplierDisplay + ", Delivery: " +
						row.Delivery + ", GLAccount: " + row.GlAccountDisplay + " - " + row.GlAccount + ", Qty.: " + oNumberFormatter.format(row.Quantity) +
						", Amount: " + oNumberFormatter.format(row.Amount) + ", Total: " + oNumberFormatter.format(row.TotalAmount) + ", Cur.: " +
						row.Currency + ", Unit: " + row.UnitDisplay;
				})
				.join("\n");
			return sPositions.length > 0 ? sPositions : "-----";
		},
		_startInstance: function (token) {
			var oModel = this.getView().getModel("pur");
			if (oModel.getProperty("/Name") === null || oModel.getProperty("/Name") === undefined ||
				oModel.getProperty("/Street1") === null || oModel.getProperty("/Street1") === undefined ||
				oModel.getProperty("/HouseNo") === null || oModel.getProperty("/HouseNo") === undefined ||
				oModel.getProperty("/PostalCode") === null || oModel.getProperty("/PostalCode") === undefined ||
				oModel.getProperty("/City") === null || oModel.getProperty("/City") === undefined ||
				oModel.getProperty("/CountryName") === null || oModel.getProperty("/CountryName") === undefined) {
				dialog = new Dialog({
					title: "Error",
					type: "Message",
					state: "Error",
					content: new Text({
						text: "Please fill in the delivery address."
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
				return;
			}
			var oModelPos = this.getView().getModel("pos");
			var dialog;
			oModel.setData({
				receiverIndirectProcurement: "joezud01@GOODBABYINT.COM"
			}, true);
			var requestedBudget = oModel.getProperty("/requestedBudget");
			//	requestedBudget = parseFloat(requestedBudget.toString()).toFixed(2);
			//	var requestedBudgetFormattedMail = requestedBudget.toString().replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
			//	oModel.setData({requestedBudgetFormattedMail:requestedBudgetFormattedMail},true);
			var requestedBudgetFormattedMail = new Intl.NumberFormat('en-US', {
				minimumFractionDigits: 2
			}).format(requestedBudget);
			oModel.setProperty("/requestedBudgetFormattedMail", requestedBudgetFormattedMail);
			oModel.getProperty("/requestedBudgetFormattedMail");

			var ZOF = this.getView().byId("ZOF");
			if (ZOF.getSelected()) {
				oModel.setData({
					prType: "ZFO"
				}, true);
				oModel.setData({
					prTypeDisplay: "Framework requisition"
				}, true);
			} else {
				oModel.setData({
					prType: "ZNB"
				}, true);
				oModel.setData({
					prTypeDisplay: "Purchase requisition"
				}, true);
			};
			var opex = this.getView().byId("OC");
			var sTypValue;
			if (opex.getSelected()) {
				oModel.setData({
					type: "OC"
				}, true);
				sTypValue = "O"; //needed for status entity.
				oModel.setData({
					typeDisplay: "OPEX"
				}, true);
			} else {
				oModel.setData({
					type: "IV"
				}, true);
				sTypValue = "I"; //needed for status entity.
				oModel.setData({
					typeDisplay: "CAPEX"
				}, true);
			};
			var sAttachmentURLs = this.getAttachmentURLs();
			oModel.setData({
				attachmentURLs: sAttachmentURLs
			}, true);
			// Commented by Vikas
			// this.getView().byId("UploadCollection").destroyItems();

			var sPositionsAsString = this.getTablePositionsAsString();
			oModel.setData({
				tablePositionsAsString: sPositionsAsString
			}, true);
			var oNumberFormatter = Intl.NumberFormat('en-US', {
				minimumFractionDigits: 2
			});
			var obj = {
				"data": oModelPos.getProperty("/data")
					.filter(function (row) {
						return (row.Quantity !== undefined && row.Quantity !== null && row.Supplier !== null);
					}).map(function (row) {
						var newEntry = new Object();
						newEntry.Amount = row.Amount.toFixed(2);
						newEntry.Currency = row.Currency;
						newEntry.Delivery = row.Delivery;
						newEntry.Description = row.Description;
						newEntry.GlAccount = row.GlAccount;
						newEntry.GlAccountDisplay = row.GlAccountDisplay;
						newEntry.PositionNum = row.PositionNum;
						newEntry.Quantity = row.Quantity.toFixed(2);
						newEntry.Supplier = row.Supplier;
						newEntry.SupplierDisplay = row.SupplierDisplay;
						newEntry.TotalAmount = row.TotalAmount.toFixed(2);
						newEntry.UnitDisplay = row.UnitDisplay;
						newEntry.UnitMeasure = row.UnitMeasure;
						return newEntry;
					})

			};
			oModel.setData({
				position: obj
			}, true);
			oModel.setData({
				isIndirectProcurement: false
			}, true);
			oModel.setData({
				isCreateAsset: true
			}, true);
			oModel.setData({
				showAccountDetails: false
			}, true);
			oModel.setData({
				requesterEmail: oModel.getProperty("/requesterEmail")
			}, true);
			oModel.setData({
				workflowStep: 0
			}, true);
			oModel.setData({
				pjmComment: null
			}, true); // added by deeksha 12/1/2022
			oModel.setData({
				hodComment: null
			}, true);
			oModel.setData({
				dirComment: null
			}, true);
			oModel.setData({
				vpComment: null
			}, true);
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
			var sApprover = oModel.getProperty("/invoiceApprover") !== undefined ? oModel.getProperty("/invoiceApprover") : oModel.getProperty(
				"/requester");
			var oNumberFormatter = Intl.NumberFormat('en-US', {
				minimumFractionDigits: 2
			});
			var oHead = {
				CostCenter: oModel.getProperty("/costCenter"),
				ExternalComment: oModel.getProperty("/externalComment"),
				InternalOrder: oModel.getProperty("/sInternalOrder"),
				ObjectClass: oModel.getProperty("/type"),
				PurchaseType: oModel.getProperty("/prType"),
				Plant: oModel.getProperty("/plant"),
				PurchasingOrganization: oModel.getProperty("/purchasingOrganization"),
				Requisitioner: oModel.getProperty("/requester"),
				Approver: sApprover,
				Name: oModel.getProperty("/Name"),
				Name2: oModel.getProperty("/Name2"),
				Street1: oModel.getProperty("/Street1"),
				HouseNo: oModel.getProperty("/HouseNo"),
				PostalCode: oModel.getProperty("/PostalCode"),
				City: oModel.getProperty("/City"),
				Country: oModel.getProperty("/CountryName"),
				"to_PurchaseItem": oModelPos.getProperty("/data")
					.filter(function (row) {
						return (row.Quantity !== undefined && row.Quantity !== null && row.Supplier !== null);
					}).map(function (row) {
						var newEntry = new Object();
						newEntry.Amount = row.Amount.toFixed(2);
						newEntry.Currency = row.Currency;
						newEntry.Delivery = row.Delivery;
						newEntry.Description = row.Description;
						newEntry.GlAccount = row.GlAccount;
						newEntry.GlAccountDisplay = row.GlAccountDisplay;
						newEntry.PositionNum = row.PositionNum;
						newEntry.Quantity = row.Quantity.toFixed(2);
						newEntry.Supplier = row.Supplier;
						newEntry.SupplierDisplay = row.SupplierDisplay;
						newEntry.TotalAmount = row.TotalAmount.toFixed(2);
						newEntry.UnitDisplay = row.UnitDisplay;
						newEntry.UnitMeasure = row.UnitMeasure;
						return newEntry;
					})
			};
			oModel.setData({
				PurchaseRequisition: oHead
			}, true);

			//build status Data for status report
			var ZOF = this.getView().byId("ZOF");
			var sZOFValue;
			if (ZOF.getSelected()) {
				sZOFValue = "ZFO";
			} else {
				sZOFValue = "ZNB";
			}
			/*			var sDate = "\/Date("+Date.now()+")\/";
						var oStatusData ={
						 	"ReqId": oModel.getProperty("/bucketId"),
						 	"ReqBy": oModel.getProperty("/requesterName"),
							"WfType":"Purchase",
							"CompCd":oModel.getProperty("/legalEntity"),
							"CompTxt":oModel.getProperty("/legalEntityDisplayName"),
							"CostCt":oModel.getProperty("/CostCenter"),
							"PurOrg":oModel.getProperty("/purchasingOrganization"),
							"ReqTyp":oModel.getProperty("/typeDisplay"),
							"PurTyp":oModel.getProperty("/prTypeDisplay"),		
							"IntOrd":oModel.getProperty("/InternalOrder"),
							"ReqEmail":oModel.getProperty("/requesterEmail"),
							"Zplant":oModel.getProperty("/plant"), 
							"Zprcomments":oModel.getProperty("/commentText"),
							"Zstatus1": "open",
							"ReqDt": sDate,
						    "to_position": oModelPos.getProperty("/data").filter(function(row) {
									return (row.Quantity !== undefined && row.Quantity !== null && row.Supplier !== null);}).map(function(row) {
									var newEntry = new Object();
									newEntry.ReqId = row.ItemPosition;
									newEntry.PoItem= "1234"; //We do not have a PO item in this WF. Field is marked as key in entityset PositionTab. So use dummyData here, until its fixed in the service.
									newEntry.PoDec = row.Description;
									newEntry.Zsup = row.Supplier;
								//	newEntry.Zdeldt = row.Delivery;
									newEntry.GlAcct = row.GlAccount;
									newEntry.Zqty = row.Quantity;
									newEntry.Zcurr = row.Currency;
								//	newEntry.Zamt = row.TotalAmount;
									newEntry.Zuom = row.UnitMeasure;
									return newEntry;
							})
							
						};
						oModel.setData({oStatusData: oStatusData}, true);
			*/
			if (!this.checkApprovers()) {
				dialog = new Dialog({
					title: "Error",
					type: "Message",
					state: "Error",
					content: new Text({
						text: "Approvers selection is not sufficient.For more information please hover the info icon."
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
			} else if (oModel.getProperty("/requester") === undefined || oModel.getProperty("/requesterEmail") === undefined || oModel.getProperty(
					"/legalEntity") === undefined || oModel.getProperty("/costCenter") === undefined || oModel.getProperty("/plant") ===
				undefined || oModel.getProperty("/sInternalOrder") === undefined || oModel.getProperty("/Name") === undefined || oModel.getProperty(
					"/Street1") === undefined || oModel.getProperty("/City") === undefined || oModel.getProperty("/CountryName") === undefined ||
				oModel.getProperty("/invoiceApprover") === undefined
			) {
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
				oModel.setData({
					isApproved: false
				}, true);
				//				oModel.setData({workflowStep: 1}, true);
				//"OC" = OPEX		"IV" = CAPEX
				var opex = this.getView().byId("OC");
				if (opex.getSelected()) {
					oModel.setData({
						type: "OC"
					}, true);
					//oModel.setData({eMailReceivers: "Emea.central.purchasing@goodbabyint.com}, true);
					oModel.setData({
						eMailReceivers: "thiago.cavalcante@goodbabyint.com"
					}, true);
				} else {
					oModel.setData({
						type: "IV"
					}, true);
					//oModel.setData({eMailReceivers: "Emea.central.purchasing@goodbabyint.com,Emea.central.finance@goodbabyint.com"}, true);
					oModel.setData({
						eMailReceivers: "thiago.cavalcante@goodbabyint.com"
					}, true);
				}

				var ZOF = this.getView().byId("ZOF");
				if (ZOF.getSelected()) {
					oModel.setData({
						prType: "ZFO"
					}, true);
				} else {
					oModel.setData({
						prType: "ZNB"
					}, true);
				}

				{
					// nur für Prerelease auf true, ansonsten auf false setzen.
					oModel.setData({
						isPreRelease: false
					}, true);
					var sComment = oModel.getProperty("/requesterComment");
					if (sComment === null || sComment === undefined) {
						sComment = '-----';
					} else {
						sComment = sComment;
					}
					oModel.setData({
						commentText: sComment
					}, true);
					var oDate = new Date(Date.now());
					var options = {
						month: '2-digit',
						day: '2-digit',
						year: 'numeric',
						hour: 'numeric',
						minute: 'numeric',
						second: 'numeric'
					};
					var sCommentHistory = oDate.toLocaleString('de-DE', options) + ", " + "Requester" + " " + this.getView().getModel("pur").getProperty(
						"/requesterName") + ": " + sComment + "\n";
					oModel.setData({
						sCommentHistory: sCommentHistory
					}, true);

					var oNumberFormatter = Intl.NumberFormat('en-US', {
						minimumFractionDigits: 2
					});
					var sDate = "\/Date(" + Date.now() + ")\/";
					var oStatusData = {
						"ReqId": oModel.getProperty("/bucketId"),
						"RequesterID": oModel.getProperty("/requester"),
						"ReqBy": oModel.getProperty("/requesterName"),
						"WfType": "Purchase",
						"CompCd": oModel.getProperty("/legalEntity"),
						"CompTxt": oModel.getProperty("/legalEntityDisplayName"),
						"CostCt": oModel.getProperty("/costCenter"),
						"PurOrg": oModel.getProperty("/purchasingOrganization"),
						"ReqTyp": oModel.getProperty("/typeDisplay"),
						"PurTyp": oModel.getProperty("/prTypeDisplay"),
						"IntOrd": oModel.getProperty("/sInternalOrder"),
						"ReqEmail": oModel.getProperty("/requesterEmail"),
						"ReqBudYr1": oModel.getProperty("/requestedBudgetThisYear").toFixed(2),
						"ReqBudYr2": oModel.getProperty("/requestedBudgetNextYear").toFixed(2),
						"Zplant": oModel.getProperty("/plant"),
						"Zprcomments": oModel.getProperty("/sCommentHistory"),
						"Zstatus1": "Open",
						"ReqDt": sDate,
						"Zappr": oModel.getProperty("/Zappr"),
						"Zappr_email": oModel.getProperty("/Zappr_email"),
						"Short_Text": oModel.getProperty("/ShortText"),
						"Zcurr": oModel.getProperty("/currencyCode"),
						// "Zappr_role": oModel.getProperty("/Zappr_role"),
						"URL": oModel.getProperty("/sAttachmentLinks"),
						"to_position": oModelPos.getProperty("/data").filter(function (row) {
							return (row.Quantity !== undefined && row.Quantity !== null && row.Supplier !== null);
						}).map(function (row) {
							// var aDelDt = row.Delivery.split("-");
							// var oDelDt = aDelDt[2]+"."+aDelDt[1]+"."+aDelDt[0];
							var newEntry = new Object();
							newEntry.ReqId = oModel.getProperty("/bucketId");
							newEntry.PoItem = row.PositionNum.toString(); //We do not have a PO item in this WF. Field is marked as key in entityset PositionTab. So use dummyData here, until its fixed in the service.
							newEntry.PoDec = row.Description;
							newEntry.Zsup = row.Supplier;
							newEntry.Zdeldt = row.Delivery; //row.Delivery;
							newEntry.GlAcct = row.GlAccount;
							newEntry.Zqty = row.Quantity.toFixed(2);
							newEntry.Zcurr = row.Currency;
							newEntry.Zamt = row.TotalAmount.toFixed(2);
							newEntry.Zuom = row.UnitMeasure;
							return newEntry;
						})
					};
					if (oModel.getProperty("/Zappr_role") === "MD1" || oModel.getProperty("/Zappr_role") === "MD2") {
						oStatusData.Zappr_role = "MD";
					} else {
						oStatusData.Zappr_role = oModel.getProperty("/Zappr_role");
					}
					this.oStatusData = oStatusData; // Added by Dhanush
					oModel.setData({
						oStatusData: oStatusData
					}, true);
					if (oModel.getProperty("/ShortText") === undefined) {
						oModel.setProperty("/ShortText", "");
					}
					var oForwardingUsers = oModel.getProperty("/oForwardingUsers");
					var aForwardingConcat = oForwardingUsers.concat(this._aForwardingUsers);
					oModel.setData({
						oForwardingUsers: aForwardingConcat
					}, true);
					$.ajax({
						url: "/bpmworkflowruntime/rest/v1/workflow-instances",
						method: "POST",
						async: false,
						contentType: "application/json",
						headers: {
							"X-CSRF-Token": token
						},
						data: JSON.stringify({
							definitionId: "purchasereq",
							context: oModel.oData

						}),
						success: function (result, xhr, data) {
							oModel.setProperty("/result", JSON.stringify(result, null, 4));

							//clear the model, but keep the requesterinformation for the creation of following tasks.
							var sRequester = oModel.getProperty("/requester");
							var sRequesterEmail = oModel.getProperty("/requesterEmail");
							var sRequesterName = oModel.getProperty("/requesterName");
							oModel.setData({});
							oModel.setProperty("/requester", sRequester);
							oModel.setProperty("/requesterEmail", sRequesterEmail);
							oModel.setProperty("/requesterName", sRequesterName);
							var tableChangeSupplement = this.getView().byId("changeSupplementTable");
							var oEmptyModel = new sap.ui.model.json.JSONModel();
							oEmptyModel.setData({
								mData: []
							});
							this.getView().setModel(oEmptyModel, "emptyModel");
							tableChangeSupplement.bindRows({
								path: "emptyModel>/mData"
							});
							var oOpex = this.getView().byId("OC");
							oOpex.setSelected(true);
							var oZNB = this.getView().byId("ZNB");
							oZNB.setSelected(true);
							//var positionModel = new sap.ui.model.json.JSONModel();
							var oPosModel = this.getView().getModel("pos");
							var dataObject = {
								data: [{
									PositionNum: 10
								}, {
									PositionNum: 20
								}, {
									PositionNum: 30
								}, {
									PositionNum: 40
								}, {
									PositionNum: 50
								}, {
									PositionNum: 60
								}, {
									PositionNum: 70
								}, {
									PositionNum: 80
								}, {
									PositionNum: 90
								}, {
									PositionNum: 100
								}]
							};
							oPosModel.setData(dataObject);
							//this.setModel(positionModel, "pos");
							dialog = new Dialog({
								title: "Purchase order request",
								type: "Message",
								state: "Success",
								content: new Text({
									text: "Your request has been successfully submitted and is being processed."
								}),
								beginButton: new Button({
									text: "OK",
									press: function () {
										dialog.close();
										var loc = location;
										loc.reload();
									}
								}),
								afterClose: function () {
									dialog.destroy();
								}
							});
							dialog.open();
							// Added by Dhanush
							var oDataModel = this.getOwnerComponent().getModel();
							var opath = "/WfRequestSet";
							this.oStatusData.ReqId = this.bucketId;
							this.oStatusData.WFInstance = result.id;
							oDataModel.create(opath, this.oStatusData, {
								success: function (oData, oResponse) {},
								error: function (err) {

								}
							});
							// Ended by Dhanush
						}.bind(this),
						error: function (error) {
							//	alert(JSON.stringify(error));
							dialog = new Dialog({
								title: "Error",
								type: "Message",
								state: "Error",
								content: new Text({
									text: "The requested purchase requistions can't be sent to the SAP-System."
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
			}

		}
	});
});