sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"sap/m/UploadCollectionParameter",
	"sap/ui/unified/FileUploaderParameter",
	"sap/m/Dialog",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/Text",
	"sap/m/Button",
	"sap/ui/core/Fragment",
	'sap/m/library',
	"sap/m/MessageBox"
], function (Controller, MessageToast, UploadCollectionParameter, FileUploaderParameter, Dialog, Formatter, Filter, FilterOperator, Text,
	Button,Fragment,mobileLibrary,MessageBox) {
	"use strict";

	var URLHelper = mobileLibrary.URLHelper;
	return Controller.extend("gb.wf.cer.purchase.approve.controller.ApprovePurchase", {
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

			var approversModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(approversModel, "approvers");

			var InvoiceapproversModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(InvoiceapproversModel, "InvoiceapproversModel");

			var internalOrdersModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(internalOrdersModel, "internalOrders");

			var bugetModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(bugetModel, "bugetModel");

			// var fieldEnable = new sap.ui.model.json.JSONModel(); // added by feb2022
			// this.getView().setModel(fieldEnable, "fieldEnable");

			// this.getView().getModel("fieldEnable").setProperty("/PJM", false); // added by feb2022
			// this.getView().getModel("fieldEnable").setProperty("/NONPJM", false);

			var localModel = new sap.ui.model.json.JSONModel();
			localModel.setProperty("/isEditMode", false);
			this.getView().setModel(localModel, "lcl");

			this.getView().getModel("test").read("/AvailableCurrency", {
				success: function (oResponse) {
					this.getView().getModel("currency").setProperty("/currencies", oResponse.results);
				}.bind(this)
			});

			this.getView().getModel("test").read("/UnitMeasure", {
				success: function (oResponse) {
					this.getView().getModel("unitMeasure").setProperty("/unitMeasures", oResponse.results);
				}.bind(this)
			});
			this.getView().byId("calculate").setEnabled(false);
			this._aForwardingUsers = [];
			this._bindRadioGroupType();

			var that = this; // added on feb2022
			var pjmAppr = "/ZGB_CDS_PJMAPPR";
			this._setUser();
			var oDataModel = this.getView().getModel("test");
			oDataModel.read(pjmAppr, {
				success: function (oData, oResponse) {
					that.getView().setModel(oData, "ZGB_CDS_PJMAPPR");
					//	that.getView().getModel("ZGB_CDS_PJMAPPR").setData(oData);
				},
				error: function (error) {

				}
			});
		},
		//Added by Sowjanya
		_setUser: function () {
			var oUserInfo;
			var mPath = jQuery.sap.getModulePath("gb.wf.cer.purchase.approve");
			$.ajax({
				url: mPath + '/services/userapi/currentUser',
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
		onSelect: function (oEvent) {
			//var oIndex = oEvent.getSource().getSelectedIndex();
			var oPurModel = this.getOwnerComponent().getModel("ctx");
			var oContext = oEvent.getParameters().rowContext;
			if (oContext !== null) {
				var oSItem = oContext.getObject();
				if (oSItem !== undefined) {
					oPurModel.setProperty("/bRTitle", oSItem.Short_Text);
					oPurModel.setProperty("/bRId", oSItem.ReqId);
				}
				this.handleTableClose();
			}
			//console.log(oEvent);
		},
		handleTableClose: function (oEvent) {
			this._pDialog.then(function (oDialog) {
				//this._configDialog(oButton, oDialog);
				oDialog.close();
			}.bind(this));
		},
		_onBudgetListPress: function (oEvent) {
			this.getView().setBusy(true);
			var oContextModel = this.getOwnerComponent().getModel("ctx");
			var costct = oContextModel.getProperty("/costCenter");
			var intord = oContextModel.getProperty("/sInternalOrder");
			this._getBudgetList(costct, intord);
			var oButton = oEvent.getSource(),
				oView = this.getView();
			if (!this._pDialog) {
				this._pDialog = Fragment.load({
					id: oView.getId(),
					name: "gb.wf.cer.purchase.approve.view.fragments.BudgetList",
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

		},
		onClickofReq: function (oEvent) {
			var oContext = oEvent.getSource().getBindingContext("bugetModel");
			var reqId = oContext.getModel().getProperty(oContext.sPath).ReqId;
			this.onBRequestDetail(reqId);
		},
		onClickofBReq: function () {
			var oContextModel = this.getOwnerComponent().getModel("ctx");
			var rId = oContextModel.getProperty("/bRId");
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
		onEditPressed: function (oEvent) {
			var oContextModel = this.getOwnerComponent().getModel("ctx");
			this._sCompanyCode = oContextModel.getProperty("/legalEntity");
			this._sCostCenter = oContextModel.getProperty("/costCenter");
			this._sType = oContextModel.getProperty("/type");
			this._sInternalOrder = oContextModel.getProperty("/internalOrder");
			this._sPurchasingOrganization = oContextModel.getProperty("/purchasingOrganization");
			this._sType = oContextModel.getProperty("/type");
			this._bindCostCenterComboWF();
			this._bindPurchasingOrderComboBox();
			this._bindPlantComboBox();
			this._bindTableData();
			this._bindApproversModel();
			this.setInvoiceApprover();
			this._bindInternalOrderComboBox(); // Changed by Dhanush
			this._bindRadioGroupPurchaseType();
			this._bindRadioGroupType();
			this.getView().getModel("lcl").setProperty("/isEditMode", true);
		},

		onRefreshAssetsPressed: function (oEvent) {
			this._bindAssetSelectBox();
		},

		_bindCostCenterComboWF: function () {
			var costCenterComboBox = this.getView().byId("costCenterComboBoxWF");
			costCenterComboBox.bindItems({
				path: "test>/LegalEntity('" + this._sCompanyCode + "')/to_CostCenter",
				template: new sap.ui.core.ListItem({
					key: "{test>CostCenter}",
					text: "{test>CostCenterName}",
					additionalText: "{test>CostCenter}"
				})
			});
		},

		_bindInternalOrderComboBox: function () {
			var aFilter = [];
			var legal = this.getView().byId("legalEntityComboBoxWF").getSelectedKey();
			var cost = this.getView().byId("costCenterComboBoxWF").getSelectedKey();
			var type = this.getView().getModel("ctx").getProperty("/type");
			aFilter.push(new Filter("CompanyCode", FilterOperator.EQ, legal));
			aFilter.push(new Filter("CostCenter", FilterOperator.EQ, cost));
			//	if (opex.getSelected()) {
			aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, type)); // = OPEX	
			//	} else {
			//	aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "IV")); // = CAPEX
			//	}
			this.getView().getModel("test").read("/InternalOrder", {
				filters: aFilter,
				success: function (oResponse) {
					this.getView().getModel("internalOrders").setProperty("/internalOrder", oResponse.results);
				}.bind(this)
			});
			// console.log(this.getView().getModel("internalOrders"));
		},

		_bindPurchasingOrderComboBox: function () {
			var purchasingOrderComboBox = this.getView().byId("purchasingOrderComboBoxWF");

			purchasingOrderComboBox.bindItems({
				path: "test>/LegalEntity('" + this._sCompanyCode + "')/to_PurchasingOrganization",
				template: new sap.ui.core.ListItem({
					key: "{test>PurchasingOrganization}",
					text: "{test>Description}",
					additionalText: "{test>PurchasingOrganization}"
				})
			});
		},

		_bindPlantComboBox: function () {
			var plantComboBoxWF = this.getView().byId("plantComboBoxWF");

			plantComboBoxWF.bindItems({
				path: "test>/PurchasingOrganization('" + this._sPurchasingOrganization + "')/to_Plant",
				template: new sap.ui.core.ListItem({
					key: "{test>Plant}",
					text: "{test>Description}",
					additionalText: "{test>Plant}"
				})
			});
		},
		_bindTableData: function () {
			var aFilter = [];
			aFilter.push(new Filter("PurchasingOrganization", FilterOperator.EQ, this._sPurchasingOrganization));
			aFilter.push(new Filter("LegalEntity", FilterOperator.EQ, this._sCompanyCode));

			this.getView().getModel("test").read("/Supplier", {
				filters: aFilter,
				success: function (oResponse) {
					this.getView().getModel("supplier").setProperty("/suppliers", oResponse.results);
				}.bind(this)
			});
			this.getView().getModel("test").read("/AvailableCurrency", {
				success: function (oResponse) {
					this.getView().getModel("currency").setProperty("/currencies", oResponse.results);
				}.bind(this)
			});

			this.getView().getModel("test").read("/UnitMeasure", {
				success: function (oResponse) {
					this.getView().getModel("unitMeasure").setProperty("/unitMeasures", oResponse.results);
				}.bind(this)
			});

			var aAccountFilter = [];
			aAccountFilter.push(new Filter("CompanyCode", FilterOperator.EQ, this._sCompanyCode));
			aAccountFilter.push(new Filter("Scope", FilterOperator.EQ, this._sType));
			this.getView().getModel("test").read("/GLAccount", {
				filters: aAccountFilter,
				success: function (oResponse) {
					this.getView().getModel("account").setProperty("/accounts", oResponse.results);
				}.bind(this)
			});
		},

		setInvoiceApprover: function () {
			var approversModel = this.getView().getModel("InvoiceapproversModel");
			var oContextModel = this.getView().getModel("ctx");
			var aFilter = [];
			var sCompanyCode = oContextModel.getProperty("/legalEntity");
			var sCostCenter = oContextModel.getProperty("/costCenter");
			aFilter.push(new Filter("Zwfbukrs", FilterOperator.EQ, sCompanyCode));
			// aFilter.push(new Filter("Zwfkstlh", FilterOperator.EQ, sCostCenter));
			this.getView().getModel("test").read("/SelectApprover", {
				filters: aFilter,
				success: function (oResponse) {
					approversModel.setProperty("/invoiceapprovers", oResponse.results);
				}.bind(this),
				error: function (oError) {
					var tmp = oError;
				}.bind(this)
			});

		},

		_bindApproversModel: function () {
			var approversModel = this.getView().getModel("approvers");
			var oContextModel = this.getView().getModel("ctx");
			var aFilter = [];
			var sCompanyCode = oContextModel.getProperty("/legalEntity");
			var sCostCenter = oContextModel.getProperty("/costCenter");
			aFilter.push(new Filter("Zwfbukrs", FilterOperator.EQ, sCompanyCode));
			aFilter.push(new Filter("Zwfkstlh", FilterOperator.EQ, sCostCenter));
			this.getView().getModel("test").read("/SelectApprover", {
				filters: aFilter,
				success: function (oResponse) {
					approversModel.setProperty("/approvers", oResponse.results);
				}.bind(this),
				error: function (oError) {
					var tmp = oError;
				}.bind(this)
			});

		},
		_bindRadioGroupPurchaseType: function () {
			var sPurchaseType = this.getView().getModel("ctx").getProperty("/prType");
			if (sPurchaseType === "ZNB") {
				this.getView().byId("ZNB").setSelected(true);
			} else {
				this.getView().byId("ZOF").setSelected(true);
			}
		},

		_bindRadioGroupType: function () {
			var sType = this.getView().getModel("ctx").getProperty("/type");
			if (sType === "OC") {
				this.getView().byId("OC").setSelected(true);
				this.getView().byId("ZOF").setEnabled(true); // Added by Dhanush 06.05.2021
			} else {
				this.getView().byId("IV").setSelected(true);
				this.getView().byId("ZOF").setEnabled(false); // Added by Dhanush 06.05.2021	
				this.getView().byId("ZNB").setSelected(true); // Added by Dhanush 06.05.2021
			}
		},

		handleValueHelpGLAccount: function (oEvent) {
			if (!this._oValueHelpDialogAccount) {
				this._oValueHelpDialogAccount = sap.ui.xmlfragment("gb.wf.cer.purchase.approve.view.fragments.GLAccount", this);
				this.getView().addDependent(this._oValueHelpDialogAccount);
			}
			var legalEntityComboBox = this.getView().byId("legalEntityComboBoxWF");
			var legalEntityKey = legalEntityComboBox.getSelectedKey();
			var costCenterComboBox = this.getView().byId("costCenterComboBoxWF");
			var costCenterKey = costCenterComboBox.getSelectedKey();
			var accountComboBox = this.getView().byId("accountComboBox");

			var aFilter = [];
			aFilter.push(new Filter("CompanyCode", FilterOperator.EQ, legalEntityKey));

			var context = oEvent.getSource().getBindingContext("ctx");
			this._oValueHelpDialogAccount.setBindingContext(context, "ctx");

			this._oValueHelpDialogAccount.getBinding("items").filter(aFilter);
			this._oValueHelpDialogAccount.open();
		},

		handleSearchGLAccount: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var aAccountFilter = [];
			var legalEntityComboBox = this.getView().byId("legalEntityComboBoxWF");
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

		handleConfirmGLAccount: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				var sAccountNumber = aContexts[0].getObject().AccountNumber;
				var sAccountLongText = aContexts[0].getObject().LongText;
				var source = oEvent.getSource();
				var bindingContext = source.getBindingContext("ctx");
				bindingContext.getModel("ctx").setProperty("GlAccount", sAccountNumber, bindingContext);
				bindingContext.getModel("ctx").setProperty("GlAccountDisplay", sAccountLongText, bindingContext);
			}
		},

		handleValueHelpSupplier: function (oEvent) {
			if (!this._oValueHelpDialogSupplier) {
				this._oValueHelpDialogSupplier = sap.ui.xmlfragment("gb.wf.cer.purchase.approve.view.fragments.SupplierDialog", this);
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
			var context = oEvent.getSource().getBindingContext("ctx");
			this._oValueHelpDialogSupplier.setBindingContext(context, "ctx");
			this._oValueHelpDialogSupplier.open();
		},

		handleSearchSupplier: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var legalEntityComboBox = this.getView().byId("legalEntityComboBoxWF");
			var legalEntityKey = legalEntityComboBox.getSelectedKey();
			var poComboBox = this.getView().byId("purchasingOrderComboBoxWF");
			var poKey = poComboBox.getSelectedKey();
			var aFilterSupplier = [];
			aFilterSupplier.push(new Filter("Name1", sap.ui.model.FilterOperator.Contains, sValue));
			aFilterSupplier.push(new Filter("PurchasingOrganization", FilterOperator.EQ, poKey));
			aFilterSupplier.push(new Filter("LegalEntity", FilterOperator.EQ, legalEntityKey));
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter(aFilterSupplier);
		},

		handleConfirmSupplier: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				var sSupplier = aContexts[0].getObject().Vendor;
				var sSupplierDisplay = aContexts[0].getObject().Name1;
				var source = oEvent.getSource();
				var bindingContext = source.getBindingContext("ctx");
				bindingContext.getModel().setProperty("Supplier", sSupplier, bindingContext);
				bindingContext.getModel().setProperty("SupplierDisplay", sSupplierDisplay, bindingContext);
			}
		},

		onChangeSupplier: function (oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");
			var oContext = oSelectedItem.getBindingContext("supplier");
			var sDisplayName = oContext.getProperty("Name1");
			var source = oEvent.getSource();
			var bindingContext = source.getBindingContext("ctx");
			bindingContext.getModel().setProperty("SupplierDisplay", sDisplayName, bindingContext);
		},

		// Added by Dhanush
		onChangeCurrency: function (oEvent) {
			/*var oBindingCtx = oEvent.getSource().getBindingContext("pos");*/
			var oBindingCtx = oEvent.getSource().getBindingContext("ctx"); /*added by deeksha 11/11/2021*/
			this.getView().getModel("ctx").setProperty("/onClickCalculate", false);
			var spath = oBindingCtx.sPath;
			var arr = spath.split("/");
			var index = arr[arr.length - 1];
			var quantity = oBindingCtx.getProperty("Quantity");
			var unitPrice = oBindingCtx.getProperty("Amount");
			if (quantity === undefined || quantity === "") {
				sap.m.MessageToast.show("Please fill the quantity field");
				/*this.getView().byId('positionNumberTable').getRows()[index].getCells()[5].setValueState("Error");*/
				this.getView().byId('positionNumberTableWF').getRows()[index].getCells()[5].setValueState("Error");
				this.getView().byId("calculate").setEnabled(false);
			} else if (unitPrice === undefined || unitPrice === "") {
				sap.m.MessageToast.show("Please fill the unit price field");
				this.getView().byId("calculate").setEnabled(false);
				/*this.getView().byId('positionNumberTable').getRows()[index].getCells()[6].setValueState("Error");*/
				this.getView().byId('positionNumberTableWF').getRows()[index].getCells()[6].setValueState("Error");
			} else {
				this.getView().byId("calculate").setEnabled(true);
				/*this.getView().byId('positionNumberTable').getRows()[index].getCells()[5].setValueState("None");
				this.getView().byId('positionNumberTable').getRows()[index].getCells()[6].setValueState("None");*/
				this.getView().byId('positionNumberTableWF').getRows()[index].getCells()[5].setValueState("None");
				this.getView().byId('positionNumberTableWF').getRows()[index].getCells()[6].setValueState("None"); /*ended by deeksha 11/11/2021*/
			}

		},
		// Ended by Dhanush

		onChangeUoM: function (oEvent) {
			this.getView().getModel("ctx").setProperty("/onClickCalculate", false);
			var oSelectedItem = oEvent.getParameter("selectedItem");
			var oContext = oSelectedItem.getBindingContext("unitMeasure");
			var sDisplayName = oContext.getProperty("UnitText");
			var source = oEvent.getSource();
			var bindingContext = source.getBindingContext("ctx");
			bindingContext.getModel().setProperty("UnitDisplay", sDisplayName, bindingContext);
		},

		onSubmitUnitPrice: function (oEvent) {
			this.getView().getModel("ctx").setProperty("/onClickCalculate", false);
			var oBindingCtx = oEvent.getSource().getBindingContext("ctx");
			var spath = oBindingCtx.sPath;
			var arr = spath.split("/");
			var index = arr[arr.length - 1];
			var qty = this.getView().byId('positionNumberTableWF').getRows()[index].getCells()[5].getValue();
			var unitP = this.getView().byId('positionNumberTableWF').getRows()[index].getCells()[6].getValue();
			if (qty !== "" && parseFloat(qty) > 0) {
				// this.getView().getModel('pos').getData().data[index].Quantity = qty;
				this.getView().byId('positionNumberTableWF').getRows()[index].getCells()[5].setValueState("None");
			} else {
				this.getView().getModel('ctx').getData().position.data[index].Quantity = undefined;
			}
			if (unitP !== "" && parseFloat(unitP) > 0) {
				// this.getView().getModel('pos').getData().data[index].Amount = unitP;
				this.getView().byId('positionNumberTableWF').getRows()[index].getCells()[6].setValueState("None");
			} else {
				this.getView().getModel('ctx').getData().position.data[index].Amount = undefined;
			}
			var quantity = oBindingCtx.getProperty("Quantity");
			var unitPrice = oBindingCtx.getProperty("Amount");
			if (quantity !== null && quantity !== undefined && quantity !== "" && unitPrice !== null && unitPrice !== undefined && unitPrice !==
				"") {
				// var totalAmount = quantity * unitPrice;
				var totalAmount = quantity * unitPrice;
				oBindingCtx.getModel().setProperty("TotalAmount", totalAmount.toFixed(2), oBindingCtx);
				this.getView().byId("calculate").setEnabled(true);
				this.getView().byId('positionNumberTableWF').getRows()[index].getCells()[5].setValueState("None");
				this.getView().byId('positionNumberTableWF').getRows()[index].getCells()[6].setValueState("None");
			} else {
				totalAmount = undefined;
				oBindingCtx.getModel().setProperty("TotalAmount", totalAmount, oBindingCtx);
				this.getView().byId("calculate").setEnabled(false);
				if (quantity === undefined) {
					this.getView().byId('positionNumberTableWF').getRows()[index].getCells()[5].setValueState("Error");
				} else if (unitPrice === undefined) {
					this.getView().byId('positionNumberTableWF').getRows()[index].getCells()[6].setValueState("Error");
				}
			}
			//this.getView().byId("btnStartRequest").setEnabled(false);
			//this.getView().byId("btnStartRequest").setEnabled(false);
			//this.setApproversEnabled(false);
		},
		handleValueHelpInternalOrder: function () {
			if (!this._oValueHelpDialog) {
				this._oValueHelpDialog = sap.ui.xmlfragment("gb.wf.cer.purchase.approve.view.fragments.InternalOrderDialog", this);
				// this._oValueHelpDialog.setModel(this.getView().getModel("internalOrders"), "internalOrders")
				this.getView().addDependent(this._oValueHelpDialog);
			}
			var Purorg = this.getView().byId("purchasingOrderComboBoxWF").getSelectedKey();
			var plant = this.getView().byId("plantComboBoxWF").getSelectedKey();
			var sPlant = this.getView().getModel("test").oData["Plant(PurchOrg='" + Purorg + "',Plant='" + plant + "')"].Description;
			var purmodel = this.getView().getModel("ctx");
			// purmodel.setProperty("/plantdescription", sPlant);
			purmodel.setData({
				plantdescription: sPlant
			}, true);
			// var legalEntityComboBox = this.getView().byId("legalEntityComboBoxWF");
			// var legalEntityKey = legalEntityComboBox.getSelectedKey();
			// var costCenterComboBox = this.getView().byId("costCenterComboBoxWF");
			// var costCenterKey = costCenterComboBox.getSelectedKey();
			// var aFilter = [];
			// aFilter.push(new Filter("CompanyCode", FilterOperator.EQ, legalEntityKey));
			// aFilter.push(new Filter("CostCenter", FilterOperator.EQ, costCenterKey));
			// var oOpex = this.getView().byId("OC");
			// if (oOpex.getSelected()) {
			// 	aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "OC")); // = OPEX	
			// } else {
			// 	aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, "IV")); // = CAPEX
			// }

			// this._oValueHelpDialog.getBinding("items").filter(aFilter);
			// console.log(this._oValueHelpDialog.getBinding("items"));
			this._bindInternalOrderComboBox();
			this._oValueHelpDialog.open();
		},

		handleCancelInternalOrder: function () {
			// this._oValueHelpDialog.close();
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

		handleConfirmInternalOrder: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			//for suggestion: oEvent.getParameter("selectedItem").getText() | getKey()

			if (aContexts && aContexts.length) {
				var sOrderNumber = aContexts[0].getObject().OrderNumber;
				var sOrderDescription = aContexts[0].getObject().Description;
				var oPurchaseModel = this.getView().getModel("ctx");
				oPurchaseModel.setProperty("/sInternalOrder", sOrderNumber);
				if(sOrderDescription!==oPurchaseModel.getProperty("/sInternalOrderDescription")){
					this._onChangeHDetails();
				}
				oPurchaseModel.setProperty("/sInternalOrderDescription", sOrderDescription);
			}
			var aAccountFilter = [];
			var legalEntityComboBox = this.getView().byId("legalEntityComboBoxWF");
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
			this.getView().getModel("test").read("/GLAccount", {
				filters: aAccountFilter,
				success: function (oResponse) {
					this.getView().getModel("account").setProperty("/accounts", oResponse.results);
				}.bind(this)
			});

			var internalOrderComboBox = this.getView().byId("internalOrderSelectDialog");
			var sOrderNumber = aContexts[0].getObject().OrderNumber;
			var internalOrderKey = internalOrderComboBox.getSelectedKey();
			var aFilter = [];
			/*			var changeSupplementTable = this.getView().byId("changeSupplementTable");
						aFilter.push(new Filter("InternalOrder", FilterOperator.EQ, sOrderNumber));
						changeSupplementTable.bindRows({  
				        	path : "test>/RequestedOrder",
				        	filters: aFilter
						});
			*/
			this.getView().getModel("test").read("/RequestedOrder", {
				filters: aFilter,
				success: function (oResponse) {
					this.getView().getModel("ctx").setProperty("/budgets", oResponse.results);
				}.bind(this),
				error: function (oError) {
					var tmp = oError;
				}.bind(this)
			});

			var aAddressFilters = [];
			//PurchaseOrganisation/ LegalEntity / Plant
			aAddressFilters.push(new Filter("LegalEntity", FilterOperator.EQ, legalEntityKey));
			var oPlantComboBox = this.getView().byId("plantComboBoxWF");
			var sPlantKey = oPlantComboBox.getSelectedKey();
			aAddressFilters.push(new Filter("Plant", FilterOperator.EQ, sPlantKey));
			var oPoComboBox = this.getView().byId("purchasingOrderComboBoxWF");
			var sPoKey = oPoComboBox.getSelectedKey();
			aAddressFilters.push(new Filter("PurchaseOrganization", FilterOperator.EQ, sPoKey));
			this.getView().getModel("test").read("/DeliveryAddress", {
				filters: aAddressFilters,
				success: function (oData, response) {
					if (oData.results[0] != undefined) {
						var oValues = oData.results[0];
						var oModel = this.getView().getModel("ctx");
						oModel.setProperty("/Name", oValues.Name);
						oModel.setProperty("/Name2", oValues.Name2);
						oModel.setProperty("/Street", oValues.Street);
						oModel.setProperty("/HouseNo", oValues.HouseNo);
						oModel.setProperty("/PostalCode", oValues.PostalCode);
						oModel.setProperty("/City", oValues.City);
						oModel.setProperty("/Street1", oValues.Street1);
						oModel.setProperty("/Country", oValues.Country);
						// oModel.setProperty("/CountryName", oValues.CountryName);
						oModel.setProperty("/CountryName", oValues.Country); // Added newly from CountryName to Country.
						oModel.setProperty("/CountryNameDisplay", oValues.CountryName); // Added by Dhanush
						// console.log(oData);
					}
				}.bind(this),
				error: function (oError) {
					// console.log(oError);
				}.bind(this)
			});
		},

		onExit: function () {
			if (this._oPopover) {
				this._oPopover.destroy();
			}
			/*if (this._oPopoverUSD) {
				this._oPopoverUSD.destroy();
			}
			if (this._oPopoverCAD) {
				this._oPopoverCAD.destroy();
			}*/
		},
		onCloseInfo: function (oEvent) {
			this._oPopover.close();
		},

		/*onCloseInfoUSD: function (oEvent) {
			this._oPopoverUSD.close();
		},
		
		onCloseInfoCAD: function (oEvent) {
			this._oPopoverCAD.close();
		},*/

		onOpenInfo: function (oEvent) {
			// create popover
			if (!this._oPopover) {
				this._oPopover = sap.ui.xmlfragment("gb.wf.cer.purchase.approve.view.fragments.InfoFragment", this);
				// this.addDependent(this._oPopover);
				// this._oPopover.setModel(this.getView().getModel("approverlistModel"), "approverlistModel");
				// this._oPopover.setModel(this.getView().getModel("rangelistModel"), "rangelistModel");
			}
			this._oPopover.openBy(oEvent.getSource());

			/*var oCurrency = this.getView().getModel("Currency").getData("CurrencyCode");   
			if(oCurrency.CurrencyCode == "EUR") {
				if (!this._oPopover) {
				this._oPopover = sap.ui.xmlfragment("gb.wf.cer.purchase.approve.view.fragments.InfoFragment", this);
				this.getView().addDependent(this._oPopover);
				// this._oPopover.setModel(this.getView().getModel("approverlistModel"), "approverlistModel");
				// this._oPopover.setModel(this.getView().getModel("rangelistModel"), "rangelistModel");
			}
			this._oPopover.openBy(oEvent.getSource());
			}
			else if(oCurrency.CurrencyCode == "USD"){
				if (!this._oPopoverUSD) {
				this._oPopoverUSD = sap.ui.xmlfragment("gb.wf.cer.purchase.approve.view.fragments.USDInfoFragment", this);
				this.getView().addDependent(this._oPopoverUSD);
				// this._oPopover.setModel(this.getView().getModel("approverlistModel"), "approverlistModel");
				// this._oPopover.setModel(this.getView().getModel("rangelistModel"), "rangelistModel");
			}
			this._oPopoverUSD.openBy(oEvent.getSource());
			}   
			else if(oCurrency.CurrencyCode == "CAD"){
				if (!this._oPopoverCAD) {
				this._oPopoverCAD = sap.ui.xmlfragment("gb.wf.cer.purchase.approve.view.fragments.CADInfoFragment", this);
				this.getView().addDependent(this._oPopoverCAD);
				// this._oPopover.setModel(this.getView().getModel("approverlistModel"), "approverlistModel");
				// this._oPopover.setModel(this.getView().getModel("rangelistModel"), "rangelistModel");
			}
			this._oPopoverCAD.openBy(oEvent.getSource());
			}  */

		},

		_bindChangeSupplementTable: function () {
			var oContextModel = this.getOwnerComponent().getModel("ctx");
			var oTableChangeSupplementWF = this.getView().byId("changeSupplementTable");
			var aFilter = [];
			aFilter.push(new Filter("InternalOrder", FilterOperator.EQ, oContextModel.getProperty("/sInternalOrder")));
			oTableChangeSupplementWF.bindRows({
				path: "test>/RequestedOrder",
				filters: aFilter
			});
		},
		//[FR:987001413]
		_onChangeHDetails:function(){
			this.getView().getModel("ctx").setProperty("/requestedBudget", undefined);
			this.getView().getModel("ctx").setProperty("/requestedBudgetNextYear", undefined);
			this.getView().getModel("ctx").setProperty("/sumAmountInCompCurrencyCode", undefined);

			var ctxModel = this.getView().getModel("ctx");
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
			ctxModel.setProperty("/position/", dataObject);
		},

		onTypeChange: function (oEvent) {
			this.getView().getModel("ctx").setData({
				sInternalOrderDescription: undefined
			}, true);
			this.getView().getModel("ctx").setProperty("/sInternalOrder", undefined);
			this.getView().getModel("ctx").setProperty("/sInternalOrderDescription", undefined);
			this.getView().getModel("ctx").setProperty("/requestedBudget", undefined);
			this.getView().getModel("ctx").setProperty("/requestedBudgetNextYear", undefined);
			this.getView().getModel("ctx").setProperty("/sumAmountInCompCurrencyCode", undefined);

			var ctxModel = this.getView().getModel("ctx");
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
			ctxModel.setProperty("/position/", dataObject);

			var aAccountFilter = [];
			var legalEntityComboBox = this.getView().byId("legalEntityComboBoxWF");
			var legalEntityKey = legalEntityComboBox.getSelectedKey();
			aAccountFilter.push(new Filter("CompanyCode", FilterOperator.EQ, legalEntityKey));
			var opex = this.getView().byId("OC");
			var sTypeKey;
			if (opex.getSelected()) {
				sTypeKey = "OC";
				ctxModel.setData({
					type: "OC"
				}, true);
				// sTypValue= "O";//needed for status entity.
				ctxModel.setData({
					typeDisplay: "OPEX"
				}, true);
				this.getView().byId("ZOF").setEnabled(true); // Added by Dhanush 06.05.2021
			} else {
				sTypeKey = "IV";
				ctxModel.setData({
					type: "IV"
				}, true);
				// sTypValue= "I";//needed for status entity.
				ctxModel.setData({
					typeDisplay: "CAPEX"
				}, true);
				this.getView().byId("ZOF").setEnabled(false); // Added by Dhanush 06.05.2021	
				this.getView().byId("ZNB").setSelected(true); // Added by Dhanush 06.05.2021
			}
			aAccountFilter.push(new Filter("Scope", FilterOperator.EQ, sTypeKey));
			this.getView().getModel("test").read("/GLAccount", {
				filters: aAccountFilter,
				success: function (oResponse) {
					this.getView().getModel("account").setProperty("/accounts", oResponse.results);
				}.bind(this)
			});
			// this._bindInternalOrderComboBox();

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

		onSelectLegalEntity: function (oEvent) {
			var oModel = this.getView().getModel("ctx");
			var costCenterComboBox = this.getView().byId("costCenterComboBoxWF");
			var purchasingOrderComboBox = this.getView().byId("purchasingOrderComboBoxWF");
			var oSelectedItem = oEvent.getParameter("selectedItem");
			var oItemContext = oSelectedItem.getBindingContext();
			var sLegalEntityDisplayName = oItemContext.getProperty("CompanyCodeName");
			if(oModel.getProperty("/legalEntityDisplayName")!==sLegalEntityDisplayName){
				this._onChangeHDetails();
			}
			oModel.setData({
				legalEntityDisplayName: sLegalEntityDisplayName
			}, true);
			costCenterComboBox.setEnabled(true);
			costCenterComboBox.bindItems({
				path: "test>/LegalEntity('" + oSelectedItem.getKey() + "')/to_CostCenter",
				template: new sap.ui.core.ListItem({
					key: "{test>CostCenter}",
					text: "{test>CostCenterName}",
					additionalText: "{test>CostCenter}"
				})
			});
			var r = new sap.ui.model.json.JSONModel; /*added by Deeksha 02/11/2021*/
			var that = this;
			var oDataModel = this.getView().getModel("test");
			/*	var opath = oItemContext.getPath() + "/to_Currency";*/
			var opath = "/LegalEntity('" + oSelectedItem.getKey() + "')/to_Currency"; /*added by deeksha 11/11/2021*/
			oDataModel.read(opath, {
				success: function (oData, oResponse) {
					var oCurrency = oData;
					var oCurModel = new sap.ui.model.json.JSONModel();
					that.getView().setModel(oCurModel, "Currency");
					var currCode;
					if (oData.Currency !== "USD") {
						currCode = "EUR";
					} else {
						currCode = oData.Currency;
					}
					that.getView().getModel("Currency").setData({
						"CurrencyCode": currCode
					});
					that.getView().getModel("ctx").getData().currencyCode = currCode;
				},
				error: function (err) {

				}
			});
			// costCenterComboBox.bindItems({
			// 	path: oItemContext.getPath() + "/to_CostCenter",
			// 	sorter: new sap.ui.model.Sorter({ path: "CostCenterName" }),
			// 	template: new sap.ui.core.ListItem({
			// 		key: "{CostCenter}",
			// 		text: "{CostCenterName}",
			// 		additionalText: "{CostCenter}"
			// 	})
			// });
			// purchasingOrderComboBox.setEnabled(true);
			purchasingOrderComboBox.bindItems({
				path: "test>/LegalEntity('" + oSelectedItem.getKey() + "')/to_PurchasingOrganization",
				template: new sap.ui.core.ListItem({
					key: "{test>PurchasingOrganization}",
					text: "{test>Description}",
					additionalText: "{test>PurchasingOrganization}"
				})
			});
			this.getView().getModel("ctx").setProperty("/sInternalOrder", undefined);
			this.getView().getModel("ctx").setProperty("/sInternalOrderDescription", undefined);
			this.getView().getModel("ctx").setProperty("/plant", undefined);
			this.getView().getModel("ctx").setProperty("/plantdescription", undefined);
			this.getView().getModel("ctx").setProperty("/purchasingOrganization", undefined);
			this.getView().getModel("ctx").setProperty("/purchasingOrgDisplayName", undefined);

			var oDataModel = this.getView().getModel("test");
			var oThis = this;
			var opath = "/Plant_PurchaseOrgSet(CompCd='" + oSelectedItem.getKey() + "')";
			this.getView().setBusy(true);
			oDataModel.read(opath, {
				success: jQuery.proxy(function (oData, oResponse) {
					this.getView().setBusy(false);
					var plant = oData.Plant;
					var purorg = oData.PurOrg;
					var legal = oData.CompCd;
					this.getView().byId("purchasingOrderComboBoxWF").setSelectedKey(purorg);
					var oPurchaseModel = this.getView().getModel("ctx");
					var sPurOrg = this.getView().getModel("test").oData["PurchasingOrganization('" + purorg + "')"].Description;
					oPurchaseModel.setData({
						purchasingOrgDisplayName: sPurOrg
					}, true);
					var plantComboBox = this.getView().byId("plantComboBoxWF");
					// var oItem = this.getView().byId("purchasingOrderComboBox").mBindingInfos.selectedKey.binding.getPath();
					var oItemContextpath = "test>/PurchasingOrganization" + "('" + purorg + "')";
					// plantComboBox.setEnabled(true);
					plantComboBox.bindItems({
						path: oItemContextpath + "/to_Plant",
						template: new sap.ui.core.ListItem({
							key: "{test>Plant}",
							text: "{test>Description}",
							additionalText: "{test>Plant}"
						})
					});
					this.getView().byId("plantComboBoxWF").setSelectedKey(plant);
					// oPurchaseModel.setProperty("/plantdescription", oPlantText);
					this.autoPlantUpdate(purorg, legal);
				}, this),
				error: jQuery.proxy(function (err) {
					this.getView().setBusy(false);
					var plantComboBox = this.getView().byId("plantComboBoxWF");
					this.getView().byId("purchasingOrderComboBoxWF").setSelectedKey("");
					plantComboBox.setSelectedKey("");
					// plantComboBox.setEnabled(false);
				}, this)
			});
		},

		autoPlantUpdate: function (purorg, legal) {
			var aFilter = [];
			aFilter.push(new Filter("PurchasingOrganization", FilterOperator.EQ, purorg));
			aFilter.push(new Filter("LegalEntity", FilterOperator.EQ, legal));
			// aAccountFilter.push(new Filter("CompanyCode", FilterOperator.EQ, legalEntityKey));
			this.getView().getModel("test").read("/Supplier", {
				filters: aFilter,
				success: jQuery.proxy(function (oResponse) {
					this.getView().getModel("supplier").setProperty("/suppliers", oResponse.results);
				}, this)
			});
			this.getView().getModel("test").read("/AvailableCurrency", {
				success: jQuery.proxy(function (oResponse) {
					this.getView().getModel("currency").setProperty("/currencies", oResponse.results);
				}, this)
			});

			this.getView().getModel("test").read("/UnitMeasure", {
				success: jQuery.proxy(function (oResponse) {
					this.getView().getModel("unitMeasure").setProperty("/unitMeasures", oResponse.results);
				}, this)
			});
		},

		onSelectCostCenter: function (oEvent) {
			var oPurchaseModel = this.getView().getModel("ctx");
			var internalOrderComboBox = this.getView().byId("internalOrderSelectDialogWF");
			var legalEntityComboBox = this.getView().byId("legalEntityComboBoxWF");
			var opex = this.getView().byId("OC");
			var legalEntityKey = legalEntityComboBox.getSelectedKey();
			var oSelectedItem = oEvent.getParameter("selectedItem");
			var oItemContext = oSelectedItem.getBindingContext();
			var sCostCenterDisplayName = oSelectedItem.getText();
			if(sCostCenterDisplayName!==oPurchaseModel.getProperty("/costCenterDisplayName")){
				this._onChangeHDetails();
			}
			oPurchaseModel.setData({
				costCenterDisplayName: sCostCenterDisplayName
			}, true);
			var costCenterKey = oSelectedItem.getKey();

			// this.setApproversValues();
			// this.setInvoiceApproverValues();

			// check if user is allowed to go on 

			//NICHT NOTWENDIG, DA REQUESTER SCHON GESETZT IST
			this.getView().getModel("test").callFunction("/GetValidRequestors", {
				urlParameters: {
					Zwfdomain1: oPurchaseModel.getProperty("/requester"),
					Zwfbukrs: legalEntityKey,
					Zwfkstlh: costCenterKey
				},

				success: function (oData, oResponse) {
					if (oResponse.data.results.length == 0) {
						// internalOrderComboBox.setEnabled(false);
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
					}
					// else{
					// 	var aForwardingUsers = [];
					// 	var oEmptEntry = {
					// 		"FirstName": "-----",
					// 		"SecondName": "-----",
					// 		"Name": "-----",
					// 		"Role": "NONE",
					// 		"Email": "",
					// 		"Zwfdomain1": "EMPTY"
					// 	};
					// 	aForwardingUsers.push(oEmptEntry);
					// 	var oForwardingUser = {
					// 		"FirstName": oData.results[0].FirstName,
					// 		"SecondName": oData.results[0].SecondName,
					// 		"Name": oData.results[0].FirstName + " " + oData.results[0].SecondName,
					// 		"Role": "Requester",
					// 		"Email": oData.results[0].Zwfmail1,
					// 		"Zwfdomain1": oData.results[0].Zwfdomain1,
					// 		"DeputyFirstName": oData.results[0].Zwfname3,
					// 		"DeputySecondName": oData.results[0].Zwfname4,
					// 		"DeputyName": oData.results[0].Zwfname3 + " " + oData.results[0].Zwfname4,
					// 		"DeputyRole": "Requester",
					// 		"DeputyEmail": oData.results[0].Zwfmail2,
					// 		"Zwfdomain2": oData.results[0].Zwfdomain2
					// 	};
					// 	var oModel = this.getView().getModel("pur");
					// 	aForwardingUsers.push(oForwardingUser);
					// 	oModel.setData({oForwardingUsers: aForwardingUsers}, true);
					// 	var sRequesterEmail = oData.results[0].Zwfmail1;
					// 	oModel.setData({isForwarding: false},true);
					// 	oModel.setProperty("/requesterEmail", sRequesterEmail);
					// 	//this.getView().getModel("pur").setProperty("/requesterEmail","j.zude@uniorg.de");
					// 	internalOrderComboBox.setEnabled(true);
					// }

				}.bind(this),
				error: function (oError) {}.bind(this)
			});

			this.getView().getModel("ctx").setProperty("/sInternalOrder", undefined);
			this.getView().getModel("ctx").setProperty("/sInternalOrderDescription", undefined);
			// this.getView().getModel("ctx").setProperty("/plant", undefined);
			// this.getView().getModel("ctx").setProperty("/plantdescription", undefined);
			// this.getView().getModel("ctx").setProperty("/purchasingOrganization", undefined);
			// this.getView().getModel("ctx").setProperty("/purchasingOrgDisplayName", undefined);
			//this.setApproversEnabled(false);
		},

		onChangeRequisitionType: function (oEvent) {
			var buttonId = oEvent.getSource().getSelectedButton().getId();
			var index = oEvent.getSource().getSelectedIndex();
			var oModel = this.getView().getModel("ctx");
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
		},

		addUserToForwardingUsers: function (oBindingContext, sRole) {
			//check if a user with the given role is already in the list. If so replace it with the new one.

			//var iIdx = this._aForwardingUsers.findIndex((element) => element.Role === sRole)// INDEX ERMITTELN
			//this._aForwardingUsers.splice(iIdx, 1, oForwardingUser);// EIN ELEMENT AN POSITION 'IDX' RAUSWERFEN
			//OLDENTRY BRAUCHE iCH DANN NICHT MEHR
			// var oOldEntry = this._aForwardingUsers.filter(function (row) {
			// 	return row.Role === sRole;
			// });
			// if (oOldEntry !== null && oOldEntry !== undefined && oOldEntry.length > 0) {
			// 	oOldEntry.FirstName = oBindingContext.getProperty("FirstName");
			// 	oOldEntry.SecondName = oBindingContext.getProperty("SecondName");
			// 	oOldEntry.Name = oBindingContext.getProperty("FirstName") + " " + oBindingContext.getProperty("SecondName");
			// 	oOldEntry.Role = sRole;
			// 	oOldEntry.Email = oBindingContext.getProperty("Zwfmail1");
			// 	oOldEntry.Zwfdomain1 = oBindingContext.getProperty("Zwfdomain1");
			// 	oOldEntry.DeputyFirstName = oBindingContext.getProperty("Zwfname3");
			// 	oOldEntry.DeputySecondName = oBindingContext.getProperty("Zwfname4");
			// 	oOldEntry.DeputyName = oBindingContext.getProperty("Zwfname3") + " " + oBindingContext.getProperty("Zwfname4");
			// 	oOldEntry.DeputyRole = sRole;
			// 	oOldEntry.DeputyEmail = oBindingContext.getProperty("Zwfmail2");
			// 	oOldEntry.Zwfdomain2 = oBindingContext.getProperty("Zwfdomain2");
			// } else {

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
			this.getView().getModel("ctx").setProperty("/aForwardingUsers", this._aForwardingUsers);
			// console.log("listlocal", this._aForwardingUsers);
			// console.log("list", this.getView().getModel("ctx").getProperty("/aForwardingUsers"));
			// }
		},

		onSelectPjm: function (oEvent) {
			var oModel = this.getView().getModel("ctx");
			var params = oEvent.getParameters();
			var sApproverName = params.selectedItem.getProperty("text");
			var sEmail = params.selectedItem.getProperty("key");
			oModel.setData({
				PJMApproverDisplay: sApproverName
			}, true);
			oModel.setData({
				PJMMail: sEmail
			}, true);
			//add selected User to array "forwardingUsers"
			var oBindingContext = params.selectedItem.getBindingContext("approvers");
			// oModel.setData({
			// 	oBindingContextHOD : params.selectedItem.getBindingContext("approvers")
			// }, true);
			// this.oBindingContextHOD = params.selectedItem.getBindingContext("approvers");
			this.addUserToForwardingUsers(oBindingContext, "PJM");

		},

		onSelectHod: function (oEvent) {
			var oModel = this.getView().getModel("ctx");
			var params = oEvent.getParameters();
			var sApproverName = params.selectedItem.getProperty("text");
			var sEmail = params.selectedItem.getProperty("key");
			oModel.setData({
				HODApproverDisplay: sApproverName
			}, true);
			oModel.setData({
				HODMail: sEmail
			}, true);
			//add selected User to array "forwardingUsers"
			var oBindingContext = params.selectedItem.getBindingContext("approvers");
			// oModel.setData({
			// 	oBindingContextHOD : params.selectedItem.getBindingContext("approvers")
			// }, true);
			// this.oBindingContextHOD = params.selectedItem.getBindingContext("approvers");
			this.addUserToForwardingUsers(oBindingContext, "HOD");
		},

		onSelectDirector: function (oEvent) {
			var oModel = this.getView().getModel("ctx");
			var params = oEvent.getParameters();

			var sApproverName = params.selectedItem.getProperty("text");
			var sEmail = params.selectedItem.getProperty("key");

			oModel.setData({
				DirectorApproverDisplay: sApproverName
			}, true);
			oModel.setData({
				DirectorMail: sEmail
			}, true);
			//add selected User to array "forwardingUsers"
			var oBindingContext = params.selectedItem.getBindingContext("approvers");
			// oModel.setData({
			// 	oBindingContextDIRECTOR : params.selectedItem.getBindingContext("approvers")
			// }, true);
			// this.oBindingContextDIRECTOR = params.selectedItem.getBindingContext("approvers");
			this.addUserToForwardingUsers(oBindingContext, "DIRECTOR");
		},

		onSelectVp: function (oEvent) {
			var oModel = this.getView().getModel("ctx");
			var params = oEvent.getParameters();

			var sApproverName = params.selectedItem.getProperty("text");
			var sEmail = params.selectedItem.getProperty("key");

			oModel.setData({
				VPApproverDisplay: sApproverName
			}, true);
			oModel.setData({
				VPMail: sEmail
			}, true);
			//add selected User to array "forwardingUsers"
			var oBindingContext = params.selectedItem.getBindingContext("approvers");
			// oModel.setData({
			// 	oBindingContextVP : params.selectedItem.getBindingContext("approvers")
			// }, true);
			// this.oBindingContextVP = params.selectedItem.getBindingContext("approvers");
			this.addUserToForwardingUsers(oBindingContext, "VP");
		},

		onSelectCfo: function (oEvent) {
			var oModel = this.getView().getModel("ctx");
			var params = oEvent.getParameters();

			var sApproverName = params.selectedItem.getProperty("text");
			var sEmail = params.selectedItem.getProperty("key");

			oModel.setData({
				CFOApproverDisplay: sApproverName
			}, true);
			oModel.setData({
				CFOMail: sEmail
			}, true);
			//add selected User to array "forwardingUsers""approvers"
			var oBindingContext = params.selectedItem.getBindingContext("approvers");
			// oModel.setData({
			// 	oBindingContextCFO : params.selectedItem.getBindingContext("approvers")
			// }, true);
			// this.oBindingContextCFO = params.selectedItem.getBindingContext("approvers");
			this.addUserToForwardingUsers(oBindingContext, "CFO");
		},

		onSelectMd1: function (oEvent) {
			var oModel = this.getView().getModel("ctx");
			var params = oEvent.getParameters();

			var sApproverName = params.selectedItem.getProperty("text");
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
			var oBindingContext = params.selectedItem.getBindingContext("approvers");
			// oModel.setData({
			// 	oBindingContextMD1 : params.selectedItem.getBindingContext("approvers")
			// }, true);
			// this.oBindingContextMD1 = params.selectedItem.getBindingContext("approvers");
			this.addUserToForwardingUsers(oBindingContext, "MD");
		},

		onSelectMd2: function (oEvent) {
			var oModel = this.getView().getModel("ctx");
			var params = oEvent.getParameters();

			var sApproverName = params.selectedItem.getProperty("text");
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
			var oBindingContext = params.selectedItem.getBindingContext("approvers");
			// oModel.setData({
			// 	oBindingContextMD2 : params.selectedItem.getBindingContext("approvers")
			// }, true);
			// this.oBindingContextMD2 = params.selectedItem.getBindingContext("approvers");
			this.addUserToForwardingUsers(oBindingContext, "MD");
		},

		onSelectCeo: function (oEvent) {
			var oModel = this.getView().getModel("ctx");
			var params = oEvent.getParameters();

			var sApproverName = params.selectedItem.getProperty("text");
			var sEmail = params.selectedItem.getProperty("key");

			oModel.setData({
				CEOApproverDisplay: sApproverName
			}, true);
			oModel.setData({
				CEOMail: sEmail
			}, true);
			var oBindingContext = params.selectedItem.getBindingContext("approvers");
			// oModel.setData({
			// 	oBindingContextCEO : params.selectedItem.getBindingContext("approvers")
			// }, true);
			// this.oBindingContextCEO = params.selectedItem.getBindingContext("approvers");
			this.addUserToForwardingUsers(oBindingContext, "CEO");
		},

		onSelectPurchasingOrganization: function (oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem").getKey();
			var oPurchaseModel = this.getView().getModel("ctx");
			var plantComboBox = this.getView().byId("plantComboBox");
			plantComboBox.setEnabled(true);

			var legalEntityComboBox = this.getView().byId("legalEntityComboBox");
			var legalEntityKey = legalEntityComboBox.getSelectedKey();

			var oSelectedItemPU = oEvent.getParameter("selectedItem");
			var oItemContext = oSelectedItemPU.getBindingContext();

			var sPurchasingOrgDisplayName = oItemContext.getProperty("Description");
			oPurchaseModel.setData({
				purchasingOrgDisplayName: sPurchasingOrgDisplayName
			}, true);

			plantComboBox.setEnabled(true);
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

			this.getView().getModel("test").read("/Supplier", {
				filters: aFilter,
				success: function (oResponse) {
					this.getView().getModel("supplier").setProperty("/suppliers", oResponse.results);
				}.bind(this)
			});
			this.getView().getModel("test").read("/AvailableCurrency", {
				success: function (oResponse) {
					this.getView().getModel("currency").setProperty("/currencies", oResponse.results);
				}.bind(this)
			});

			this.getView().getModel("test").read("/UnitMeasure", {
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

		onDeleteRow: function (oEvent) {
			var sIdxPath = oEvent.getSource().getBindingContext("ctx").sPath;
			var iIdx = parseInt(sIdxPath.split('/')[3], 10);
			var oModel = this.getView().getModel("ctx");
			var aTableRows = oModel.getData().position.data;

			//aTableRows[iIdx].Description= null;
			//aTableRows[iIdx].SupplierDisplay= null;
			// aTableRows[iIdx].Supplier= null;
			//aTableRows[iIdx].Delivery= null;
			//aTableRows[iIdx].GlAccount= null;
			//aTableRows[iIdx].GlAccountDisplay= null;
			//aTableRows[iIdx].Quantity= null;
			//aTableRows[iIdx].Amount= null;
			//aTableRows[iIdx].Currency= null;
			//aTableRows[iIdx].TotalAmount = null;
			//aTableRows[iIdx].UnitMeasure= null;
			// aTableRows[iIdx].UnitDisplay= null;
			aTableRows.splice(iIdx, 1);
			var pos = 0;
			for (var i = 0; i < aTableRows.length; i++) {
				pos = pos + 10;
				aTableRows[i].PositionNum = pos;
			}
			var obj = {};
			obj.data = aTableRows;
			oModel.setData({
				position: obj
			}, true);
			//this.getView().byId("btnStartRequest").setEnabled(false);
			//this.getView().byId("prTypeRadioButtonWF").setEnabled(false); // Commented by Dhanush
			this.getView().byId("calculate").setEnabled(true);
			this.onClearApproverSelection();
			this.setApproversEnabled();
			this.getView().byId('positionNumberTableWF').getRows()[iIdx].getCells()[5].setValueState("None");
			this.getView().byId('positionNumberTableWF').getRows()[iIdx].getCells()[6].setValueState("None");
			var oPurchaseModel = this.getView().getModel("ctx");
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
			var tableData = this.getView().getModel("ctx").getProperty("/position/data")
				.filter(function (row) {
					return (row.GlAccount !== undefined || row.Currency !== undefined || row.Amount !== undefined ||
						row.Description !== undefined || row.Supplier !== undefined || row.Delivery !== undefined || row.Quantity !== undefined || row
						.UnitMeasure !== undefined) && !(row.GlAccount !== undefined && row.Currency !== undefined && row.Amount !== undefined &&
						row.Description !== undefined && row.Supplier !== undefined && row.Delivery !== undefined && row.Quantity !== undefined && row
						.UnitMeasure !== undefined);
				});
			return tableData.length;
		},

		onPressCalculateTotal: function (oEvent) {
			if (this.getView().getModel("ctx").getProperty("/sInternalOrder") === undefined) {
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

			var aTableData = this.getView().getModel("ctx").getProperty("/position/data")
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
				var sInputData = this.getView().getModel("ctx").getProperty("/position/data")
					.filter(function (row) {
						return row.Currency !== undefined && row.Amount !== undefined;
					})
					.map(function (row) {
						return row.TotalAmount + "#" + row.Currency + "#" + row.Delivery + "#";
					})
					.join("#");

				// console.log(sInputData);

				//this.getView().getModel("test").callFunction("/sap/fiori/cerpurchaseapprove/sap/opu/odata/sap/Z_WORKFLOW_SRV/CauculateTotals", {
				this.getView().getModel("test").callFunction("/CauculateTotals", {
					urlParameters: {
						InputData: sInputData.replace(/#$/, ''),
						CompanyCode: this.getView().getModel("ctx").getProperty("/legalEntity"),
						InternalOrder: this.getView().getModel("ctx").getProperty("/sInternalOrder")
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
						} else if (fCurrentAvailable < fCurrentSum || fNextAvailable < fNextSum) {
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
							var oPurchaseModel = this.getView().getModel("ctx");
							oPurchaseModel.setProperty("/requestedBudget", fValueEur);
							oPurchaseModel.setProperty("/requestedBudgetThisYear", oData.ValueEur);
							oPurchaseModel.setProperty("/requestedBudgetNextYear", fNextSum);
							var requestedBudgetFormatted = parseInt(oData.ValueEur, 10);
							oPurchaseModel.setData({
								requestedBudgetFormatted: requestedBudgetFormatted
							}, true);
							oPurchaseModel.setProperty("/sumAmountInCompCurrencyCode", oData.ValueComCurr);
							oPurchaseModel.setProperty("/compCurrencyCode", oData.CompanyCurr);
							// this.getView().byId("prTypeRadioButtonWF").setEnabled(true); // Commented by Dhanush
							this.setApproversValues();
							this.setInvoiceApproverValues();

							var legalEntityComboBox = this.getView().byId("legalEntityComboBoxWF").getSelectedKey(); // ADDED ON FEB2022
							var costCenterComboBox = this.getView().byId("costCenterComboBoxWF").getSelectedKey();
							var aZGB_CDS_PJMAPPR = this.getView().getModel("ZGB_CDS_PJMAPPR").results[0];
							var finalBudget = parseFloat(this.getView().getModel("ctx").getProperty("/sumAmountInCompCurrencyCode"));
							/*if (legalEntityComboBox === aZGB_CDS_PJMAPPR.COMPCODE && costCenterComboBox === aZGB_CDS_PJMAPPR.COSTCENTER && finalBudget <
								500) {
								this.getView().getModel("fieldEnable").setProperty("/PJM", true);
								this.getView().getModel("fieldEnable").setProperty("/NONPJM", false);
							} else { */
							this.getView().getModel("fieldEnable").setProperty("/PJM", true);
							this.getView().getModel("fieldEnable").setProperty("/NONPJM", true);
							//}

							/*this.getView().byId("hodComboBox").setEnabled(true); //commenetd on feb2022
							this.getView().byId("directorComboBox").setEnabled(true);
							this.getView().byId("vpComboBox").setEnabled(true);
							this.getView().byId("cfoComboBox").setEnabled(true);
							this.getView().byId("md1ComboBox").setEnabled(true);
							this.getView().byId("md2ComboBox").setEnabled(true);
							this.getView().byId("ceoComboBox").setEnabled(true);*/
							this.getView().byId("commentTextArea").setEnabled(true);
							oPurchaseModel.setProperty("/ApproverList", undefined);
							oPurchaseModel.setProperty("/edit", true);
							oPurchaseModel.setProperty("/onClickCalculate", true);
							this.onClearApproverSelection();
						}

					}.bind(this),
					error: function (oError) {
						var erDialog = new Dialog({
							title: "Error",
							type: "Message",
							state: "Error",
							content: new Text({
								text: "The chosen currency is not available in the current system!"
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
		},

		setApproversEnabled: function () {

			/*if (enable === true) { // added on feb2022
				var legalEntityComboBox = this.getView().byId("legalEntityComboBoxWF").getSelectedKey();
				var costCenterComboBox = this.getView().byId("costCenterComboBoxWF").getSelectedKey();
				var aZGB_CDS_PJMAPPR = this.getView().getModel("ZGB_CDS_PJMAPPR").results[0];
				var finalBudget = parseFloat(this.getView().getModel("ctx").getProperty("/sumAmountInCompCurrencyCode"));
				if (legalEntityComboBox === aZGB_CDS_PJMAPPR.COMPCODE && costCenterComboBox === aZGB_CDS_PJMAPPR.COSTCENTER && finalBudget < 500) {
					this.getView().getModel("fieldEnable").setProperty("/PJM", true);
					this.getView().getModel("fieldEnable").setProperty("/NONPJM", false);
				} else {
					this.getView().getModel("fieldEnable").setProperty("/PJM", false);
					this.getView().getModel("fieldEnable").setProperty("/NONPJM", true);
				}
			} else {*/
			this.getView().getModel("fieldEnable").setProperty("/PJM", true);
			this.getView().getModel("fieldEnable").setProperty("/NONPJM", true);
			//}
			/*this.getView().byId("hodComboBox").setEnabled(true);
			this.getView().byId("directorComboBox").setEnabled(true);
			this.getView().byId("vpComboBox").setEnabled(true);
			this.getView().byId("cfoComboBox").setEnabled(true);
			this.getView().byId("md1ComboBox").setEnabled(true);
			this.getView().byId("md2ComboBox").setEnabled(true);
			this.getView().byId("ceoComboBox").setEnabled(true);*/
			this.getView().byId("commentTextArea").setEnabled(true);
			// this.getView().byId("btnStartRequest").setEnabled(true);
		},

		setInvoiceApproverValues: function () {
			var costCenterComboBox = this.getView().byId("costCenterComboBoxWF");
			var costCenterKey = costCenterComboBox.getSelectedKey();

			var legalEntityComboBox = this.getView().byId("legalEntityComboBoxWF");
			var legalEntityKey = legalEntityComboBox.getSelectedKey();

			//var approversModel = new sap.ui.model.json.JSONModel();
			//this.getView().setModel(approversModel, "approvers");
			var approversModel = this.getView().getModel("InvoiceapproversModel");
			var aFilter = [];
			aFilter.push(new Filter("Zwfbukrs", FilterOperator.EQ, legalEntityKey));
			// aFilter.push(new Filter("Zwfkstlh", FilterOperator.EQ, costCenterKey));

			//HOD
			this.getView().getModel("test").read("/SelectApprover", {
				filters: aFilter,
				success: function (oResponse) {
					approversModel.setProperty("/invoiceapprovers", oResponse.results);
				}.bind(this),
				error: function (oError) {
					var tmp = oError;
				}.bind(this)
			});
		},

		setApproversValues: function () {
			var costCenterComboBox = this.getView().byId("costCenterComboBoxWF");
			var costCenterKey = costCenterComboBox.getSelectedKey();

			var legalEntityComboBox = this.getView().byId("legalEntityComboBoxWF");
			var legalEntityKey = legalEntityComboBox.getSelectedKey();

			//var approversModel = new sap.ui.model.json.JSONModel();
			//this.getView().setModel(approversModel, "approvers");
			var approversModel = this.getView().getModel("approvers");
			var aFilter = [];
			aFilter.push(new Filter("Zwfbukrs", FilterOperator.EQ, legalEntityKey));
			aFilter.push(new Filter("Zwfkstlh", FilterOperator.EQ, costCenterKey));

			//HOD
			this.getView().getModel("test").read("/SelectApprover", {
				filters: aFilter,
				success: function (oResponse) {
					approversModel.setProperty("/approvers", oResponse.results);
				}.bind(this),
				error: function (oError) {
					var tmp = oError;
				}.bind(this)
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
		_ondataModification: function () {
			var bucketId = this.getView().getModel("ctx").getProperty("/bucketId");
			this.getView().getModel("ctx").setProperty("/edit", false);
			this.getView().getModel("ctx").setProperty("/onClickCalculate", true);
			var sPath = "/Buckets(\'" + bucketId + "\')/Files";
			var oUploadCollection = this.getView().byId("UploadCollection");
			oUploadCollection.getBinding("items").sPath = sPath;
			oUploadCollection.getBinding("items").refresh();
			this.onBeforeRenderingFwd();
			this._bindChangeSupplementTable();
			this._bindApproversModel();
			this.setInvoiceApprover();
			this._bindRadioGroupPurchaseType();
		},

		_bindAssetSelectBox: function () {
			var oModel = this.getView().getModel("ctx");
			var oModelTest = this.getView().getModel("test");
			var aFilterVP = [];
			aFilterVP.push(new Filter("CompanyCode", FilterOperator.EQ, oModel.getProperty("/legalEntity")));
			// aFilterVP.push(new Filter("CostCenter", FilterOperator.EQ, oModel.getProperty("/costCenter")));
			var aResult = oModelTest.read("/AssetNumbers", {
				filters: aFilterVP,
				success: function (data) {
					oModel.setProperty("/assetNumbers/d/", data);
					// console.log(oModel); 

					// console.log("Received Data");
				}
			});

		},

		handleValueHelpAsset: function (oEvent) {
			if (!this._oValueHelpDialogAsset) {
				this._oValueHelpDialogAsset = sap.ui.xmlfragment("gb.wf.cer.purchase.approve.view.fragments.AssetDialog", this);
				this.getView().addDependent(this._oValueHelpDialogAsset);
			}
			var context = oEvent.getSource().getBindingContext("ctx");
			this._oValueHelpDialogAsset.setBindingContext(context, "pos");

			// var sGLAccount = context.getObject().GlAccount;
			// this._oValueHelpDialogAsset.getBinding("items").filter([new Filter("GlAccount", FilterOperator.EQ, sGLAccount)]);
			// console.log("this._oValueHelpDialogAsset", this._oValueHelpDialogAsset);
			this._oValueHelpDialogAsset.open();
		},

		onAssetDataReceived: function (oEvent) {
			var oData = oEvent.getParameter("data");

			// console.log("asset data", oData);
		},

		onAssetNumberDataChange: function (oEvent) {
			//var oData = oEvent.getParameter("data");
			var oSource = oEvent.getSource(),
				oBindingContext = oSource.getBindingContext("ctx"),
				sPath = (oBindingContext) ? oBindingContext.getPath() : null;

			if (sPath && sPath.startsWith("/PurchaseRequisition/to_PurchaseItem")) {
				// console.log("onAssetNumberDataChange", oSource);

				//oSource.getBinding("suggestionItems").filter
			}
		},

		handleSearchAsset: function (oEvent) {
			var oModel = this.getView().getModel("ctx");
			var context = oEvent.getSource().getBindingContext("pos");
			var sGLAccount = context.getObject().GlAccount;
			var sValue = oEvent.getParameter("value");
			var aFilter = [];
			aFilter.push(new Filter("MainAssetNumber", sap.ui.model.FilterOperator.Contains, sValue));
			// aFilter.push(new Filter("GlAccount", sap.ui.model.FilterOperator.Contains, sGLAccount));
			aFilter.push(new Filter("CompanyCode", sap.ui.model.FilterOperator.Contains, oModel.getProperty("/legalEntity")));
			// aFilter.push(new Filter("CostCenter", sap.ui.model.FilterOperator.Contains, oModel.getProperty("/costCenter")));
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter(aFilter);

		},

		handleConfirmAsset: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				var sAssetNumber = aContexts[0].getObject().MainAssetNumber;
				var sSubAsset = aContexts[0].getObject().AssetSubnumber;
				var source = oEvent.getSource();
				var bindingContext = source.getBindingContext("pos");
				bindingContext.getModel("pos").setProperty("AssetNumber", sAssetNumber, bindingContext);
				bindingContext.getModel("pos").setProperty("SubAssetNumber", sSubAsset, bindingContext);
			}
		},

		onClearApproverSelection: function (oEvent) {
			var oPurModel = this.getView().getModel("ctx");
			this.getView().byId("pjmComboBox").setSelectedKey(""); //added by feb2022
			oPurModel.setProperty("/approverpjm", null);
			oPurModel.setProperty("/PJMApproverDisplay", null);
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
			var aForwardingUsers = oPurModel.getProperty("/oForwardingUsers");
			var aForwardingUsersList = Array.from(aForwardingUsers);
			aForwardingUsersList.splice(1);
			oPurModel.setProperty("/oForwardingUsers", aForwardingUsersList);
		},

		onBeforeRenderingFwd: function () {
			var aForwardingUsers = this.getView().getModel("ctx").getProperty("/oForwardingUsers");
			// this._aForwardingUsers = Array.from(aForwardingUsers);
			if (aForwardingUsers !== undefined) {
				var aForwardingUsersDisplay = Array.from(aForwardingUsers);
			}
			var iWorkflowstep = this.getView().getModel("ctx").getProperty("/workflowStep");
			if (iWorkflowstep == 0) {

			} else if (iWorkflowstep == 1) {
				aForwardingUsersDisplay.splice(1);
			} else if (iWorkflowstep == 2) {
				aForwardingUsersDisplay.splice(2);
			} else if (iWorkflowstep == 3) {
				aForwardingUsersDisplay.splice(3);
			} else if (iWorkflowstep == 4) {
				aForwardingUsersDisplay.splice(4);
			} else if (iWorkflowstep == 5) {
				aForwardingUsersDisplay.splice(5);
			} else if (iWorkflowstep == 6) {
				aForwardingUsersDisplay.splice(6);
			} else if (iWorkflowstep == 7) {
				aForwardingUsersDisplay.splice(7);
			} else if (iWorkflowstep == 8) {
				aForwardingUsersDisplay.splice(8);
			} else if (iWorkflowstep == 9) {
				aForwardingUsersDisplay.splice(8);
			}
			this.getView().getModel("ctx").setProperty("/aForwardingUsersDisplay", aForwardingUsersDisplay);
			// console.log("users", aForwardingUsers);
			// console.log("usersDisplay", aForwardingUsersDisplay);
		},

		onSelectForwarding: function (oEvent) {
			var params = oEvent.getParameters();
			var sEmail = params.selectedItem.getBindingContext("ctx").getProperty("Email");
			var sUserId = params.selectedItem.getBindingContext("ctx").getProperty("Zwfdomain1").toLowerCase();
			var sApproverName = params.selectedItem.getBindingContext("ctx").getProperty("FirstName") + " " + params.selectedItem.getBindingContext(
				"ctx").getProperty("SecondName");
			var sApproverNameFullName = params.selectedItem.getBindingContext("ctx").getProperty("Name");
			var sRole = params.selectedItem.getBindingContext("ctx").getProperty("Role");
			var oModel = this.getView().getModel("ctx");
			oModel.setProperty("/isForwarderSelected", true);
			oModel.setProperty("/forwardToRole", sRole);
			var aForwardingsUsers = oModel.getProperty("/oForwardingUsers");
			if (sRole === "REQUESTER") {
				oModel.setProperty("/fwdReqMail", sEmail);
				oModel.setProperty("/fwdReqId", sUserId);
				oModel.setProperty("/fwdReqApprover", sApproverNameFullName);
			} else if (sRole === "PJM") { //added on feb2022
				oModel.setProperty("/fwdPJMMail", sEmail);
				oModel.setProperty("/fwdPJMId", sUserId);
				oModel.setProperty("/fwdPJMApprover", sApproverNameFullName);
			} else if (sRole === "HOD") {
				oModel.setProperty("/fwdHODMail", sEmail);
				oModel.setProperty("/fwdHODId", sUserId);
				oModel.setProperty("/fwdHODApprover", sApproverNameFullName);
			} else if (sRole === "VP") {
				oModel.setProperty("/fwdVPMail", sEmail);
				oModel.setProperty("/fwdVPId", sUserId);
				oModel.setProperty("/fwdVPApprover", sApproverNameFullName);
			} else if (sRole === "CONTROLLING") {
				oModel.setProperty("/fwdCCMail", sEmail);
				oModel.setProperty("/fwdCCId", sUserId);
				oModel.setProperty("/fwdCCApprover", sApproverNameFullName);
			} else if (sRole === "CFO") {
				oModel.setProperty("/fwdCFOMail", sEmail);
				oModel.setProperty("/fwdCFOId", sUserId);
				oModel.setProperty("/fwdCFOApprover", sApproverNameFullName);
			} else if (sRole === "MD1") {
				oModel.setProperty("/fwdMD1Mail", sEmail);
				oModel.setProperty("/fwdMD1Id", sUserId);
				oModel.setProperty("/fwdMD1Approver", sApproverNameFullName);
			} else if (sRole === "MD2") {
				oModel.setProperty("/fwdMD2Mail", sEmail);
				oModel.setProperty("/fwdMD2Id", sUserId);
				oModel.setProperty("/fwdMD2Approver", sApproverNameFullName);
			} else if (sRole === "DIR") {
				oModel.setProperty("/fwdDIRMail", sEmail);
				oModel.setProperty("/fwdDIRId", sUserId);
				oModel.setProperty("/fwdDIRApprover", sApproverNameFullName);
			} else if (sRole === "CEO") {
				oModel.setProperty("/fwdCEOMail", sEmail);
				oModel.setProperty("/fwdCEOId", sUserId);
				oModel.setProperty("/fwdCEOApprover", sApproverNameFullName);
			}
			// console.log(sEmail, sUserId, sApproverName, sRole, sApproverNameFullName);
			//	this.getView().getModel("ctx").setProperty("/approverNameForStatusReport", sApproverName);
			//	this.getView().getModel("ctx").setProperty("/approver", sUserId);
		},

		onFileDelete: function (oEvent) {
			var item = oEvent.getParameter("item");
			var ctx = item.getBinding("fileName").getContext();
			ctx.getModel().remove(ctx.getPath());
		},

		onBeforeUploadStarts: function (oEvent) {
			var bucketId = this.getView().getModel("ctx").getProperty("/bucketId");
			var bucketPath = "/Buckets(\'" + bucketId + "\'/Files";
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
		},

		formatter: Formatter,
	});
});