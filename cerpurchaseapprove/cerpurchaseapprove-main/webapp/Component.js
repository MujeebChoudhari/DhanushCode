sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"./model/models",
	"sap/m/Button",
	"sap/m/Dialog",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/Text",
	"sap/ui/model/Sorter"
], function (UIComponent, JSONModel, Device, models, Button, Dialog, Filter, FilterOperator, Text, Sorter) {
	"use strict";

	return UIComponent.extend("gb.wf.cer.purchase.approve.Component", {

		_sCommentHistory: undefined,
		_isForwarding: undefined,
		_isPFStep: undefined,

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

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			var contextData;
			// get task data
			var oComponentData = this.getComponentData();
			var dLoadModel = new sap.ui.model.json.JSONModel({
				"dataLoaded": false
			});
			this.setModel(dLoadModel, "dLoadModel");
			var fieldEnable = new sap.ui.model.json.JSONModel(); // added by feb2022
			this.setModel(fieldEnable, "fieldEnable");

			this.getModel("fieldEnable").setProperty("/PJM", false); // added by feb2022
			this.getModel("fieldEnable").setProperty("/NONPJM", false);
			if (oComponentData) {
				// only available in workflow process!!!
				var startupParameters = this.getComponentData().startupParameters;
				var taskModel = startupParameters.taskModel;
				var taskData = taskModel.getData();
				var taskId = taskData.InstanceID;

				// read process context & bind it to
				// the view's model
				var that = this;
				var contextModel = new JSONModel(
					"/bpmworkflowruntime/rest/v1/task-instances/" + taskId + "/context");
				contextData = contextModel.getData();

				// update the workflow context with
				// task related information
				// note that this information is not
				// persisted, but is available only
				// when the
				// particular task UI is loaded

				// Since the model is loaded
				// asynchronously we add the task
				// related information
				// in the call back function
				contextModel.attachRequestCompleted(function () {
					contextData = contextModel.getData();
					// Get task related data
					// to be set in UI
					// ObjectHeader
					contextData.task = {};
					contextData.task.Title = taskData.TaskTitle;
					contextData.task.Priority = taskData.Priority;
					contextData.task.Status = taskData.Status;

					// Set priority 'state'
					// based on the priority
					if (taskData.Priority === "HIGH") {
						contextData.task.PriorityState = "Warning";
					} else if (taskData.Priority === "VERY HIGH") {
						contextData.task.PriorityState = "Error";
					} else {
						contextData.task.PriorityState = "Success";

						this._isForwarding = contextModel.getProperty("/isForwarding");

					}

					// Get date on which
					// task was created
					contextData.task.CreatedOn = taskData.CreatedOn.toDateString();

					// Get task description
					// and add it to the UI
					// model
					startupParameters.inboxAPI.getDescription("NA", taskData.InstanceID)
						.done(function (dataDescr) {
							contextData.task.Description = dataDescr.Description;
							contextModel.setData(contextData);
							that.getModel("dLoadModel").setProperty("/dataLoaded", true);
						})
						.fail(
							function (errorText) {
								jQuery.sap.require("sap.m.MessageBox");
								sap.m.MessageBox.error(errorText, {
									title: "Error"
								});
							}
						);

					var oNegativeAction = {
						sBtnTxt: "Reject",
						onBtnPressed: function () {
							that._triggerComplete(
								that.oComponentData.inboxHandle.attachmentHandle.detailModel.getData().InstanceID,
								false,
								jQuery.proxy(that._refreshTask, that)
							);
						}
					};

					// Accept
					var oPositiveAction = {
						sBtnTxt: "Approve",
						onBtnPressed: function () {
							that._handlePositiveAction(
								that.oComponentData.inboxHandle.attachmentHandle.detailModel.getData().InstanceID,
								true,
								jQuery.proxy(that._refreshTask, that)
							);
						}
					};

					var oAdditionalAction = {
						sBtnTxt: "ADDITIONAL",
						onBtnPressed: function (oEvent) {
							that._handleAdditionalAction(
								that.oComponentData.inboxHandle.attachmentHandle.detailModel.getData().InstanceID,
								true,
								jQuery.proxy(that._refreshTask, that)
							);
						}
					};

					// Add the Accept & Reject buttons
					startupParameters.inboxAPI.addAction({
							action: oPositiveAction.sBtnTxt,
							label: oPositiveAction.sBtnTxt,
							type: "Accept"
						},
						oPositiveAction.onBtnPressed
					);

					if (!this._isForwarding) {
						startupParameters.inboxAPI.addAction({
								action: oAdditionalAction.sBtnTxt,
								label: "Forwarding",
								type: "Reject"
							},
							oAdditionalAction.onBtnPressed
						);
					}

					if (!this._isForwarding) {
						startupParameters.inboxAPI.addAction({
								action: oNegativeAction.sBtnTxt,
								label: oNegativeAction.sBtnTxt,
								type: "Reject"
							},
							oNegativeAction.onBtnPressed
						);
					}

				});

				contextModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
				this.setModel(contextModel, "ctx");
				// console.log("CTX");
				// console.log(contextModel);
				// Implementation for the confirm
				// actions

				// Reject
				/*				var oNegativeAction = {
									sBtnTxt: "Reject",
									onBtnPressed: function () {
										that._triggerComplete(
											that.oComponentData.inboxHandle.attachmentHandle.detailModel.getData().InstanceID,
											false,
											jQuery.proxy(that._refreshTask, that)
										);
									}
								};

								// Accept
								var oPositiveAction = {
									sBtnTxt: "Approve",
									onBtnPressed: function () {
										that._triggerComplete(
											that.oComponentData.inboxHandle.attachmentHandle.detailModel.getData().InstanceID,
											true,
											jQuery.proxy(that._refreshTask, that)
										);
									}
								};
								
								var oAdditionalAction = {
									sBtnTxt: "ADDITIONAL",
									onBtnPressed: function (oEvent) {
										that._handleAdditionalAction(
											that.oComponentData.inboxHandle.attachmentHandle.detailModel.getData().InstanceID,
											true,
											jQuery.proxy(that._refreshTask, that)
										);
									}
								};

								// Add the Accept & Reject buttons
								startupParameters.inboxAPI.addAction({
										action: oPositiveAction.sBtnTxt,
										label: oPositiveAction.sBtnTxt,
										type: "Accept"
									},
									oPositiveAction.onBtnPressed
								);
								
								
								if(!this._isForwarding){
									startupParameters.inboxAPI.addAction({
											action: oAdditionalAction.sBtnTxt,
											label: "Forwarding",
											type: "Reject"
										},
										oAdditionalAction.onBtnPressed
									);
								}

						//	if(contextModel.getProperty("isCreateAsset") === true){
								startupParameters.inboxAPI.addAction({
										action: oNegativeAction.sBtnTxt,
										label: oNegativeAction.sBtnTxt,
										type: "Reject"
									},
									oNegativeAction.onBtnPressed
								);
						//	}*/
			} else {
				// design only
				var contextModel = new JSONModel({
					task: {
						Title: "Task Title",
						CreatedOn: null,
						Description: "Task Description",
						Status: "READY",
						Priority: "MEDIUM"
					}
				});
				this.setModel(contextModel);
			} // eof worflow init

			var ApproverModel = new sap.ui.model.json.JSONModel();
			this.setModel(ApproverModel, "approverlistModel");

			var RangeModel = new sap.ui.model.json.JSONModel();
			this.setModel(RangeModel, "rangelistModel");
			this.approverList();

			var that = this; // added on feb2022
			var pjmAppr = "/ZGB_CDS_PJMAPPR";
			var oDataModel = this.getModel("test");
			oDataModel.read(pjmAppr, {
				success: function (oData, oResponse) {
					that.setModel(oData, "ZGB_CDS_PJMAPPR");
					//	that.getView().getModel("ZGB_CDS_PJMAPPR").setData(oData);
				},
				error: function (error) {

				}
			});

		},
       // [FR:987001413]
		_resetLastapproverData: function () {
			var oModel = this.getModel("ctx");
			var appData = oModel.getProperty('/ApproverList');
			for (var i = 0; i < appData.length; i++) {
				if (appData[i] === oModel.getProperty("/next").toUpperCase()) {
					oModel.setProperty("/workflowStep", (i + 1));
					return;
				} else {
					if (appData[i] === "DIRECTOR") {
						var property = "/Dirapproved";
					} else {
						property = "/" + appData[i] + "approved";
					}
					oModel.setProperty(property, true);
				}
			}
		},
		//[FR:987001413]
		_setLastFwdApproverData: function () {
			var oModel = this.getModel("ctx");

			if (!this.getModel("fieldEnable").getProperty("/PJM") && !this.getModel("fieldEnable").getProperty("/NONPJM") && oModel.getProperty(
					"/isForwardingToRequester")) {
				oModel.setProperty("/FwdRequester", false);
				this._isPFStep = 0;
				this._resetLastapproverData();
			} else if (oModel.getProperty("/isForwardingToPJM") || oModel.getProperty("/isForwardingToHOD") || oModel.getProperty(
					"/isForwardingToDIR") || oModel.getProperty("/isForwardingToVP") || oModel.getProperty("/isForwardingToCFO") || oModel.getProperty(
					"/isForwardingToMD1") || oModel.getProperty("/isForwardingToMD2")) {
				this._isPFStep = this.getModel("ctx").getProperty("/workflowStep");
				this._resetLastapproverData();
			}
		},

		_handleAdditionalAction: function (taskId, approvalStatus, refreshTask) {
			this.getModel("ctx").setProperty("/isForwarding", true);
			var oModel = this.getModel("ctx");
			if (oModel.getProperty("/isForwarding") === true && oModel.getProperty("/forwardedToApprover") === undefined || oModel.getProperty(
					"/forwardedToApprover") === null || oModel.getProperty("/forwardedToApprover") === "-----") {
				var dialog = new Dialog({
					title: "Error",
					type: "Message",
					state: "Error",
					content: new Text({
						text: "Please select a forwarding user first."
					}),
					beginButton: new Button({
						text: "OK",
						press: function () {
							dialog.close();
							return;
						}
					}),
					afterClose: function () {
						dialog.destroy();
					}
				});
				dialog.open();
				return;
			} else {
				var Frole = oModel.getProperty("/forwardToRole");
				if (Frole === "REQUESTER") {
					oModel.setProperty("/isForwardingToRequester", true);
					oModel.setProperty("/isForwardingToPJM", false); // added on feb2022
					oModel.setProperty("/isForwardingToHOD", false);
					oModel.setProperty("/isForwardingToDIR", false);
					oModel.setProperty("/isForwardingToVP", false);
					oModel.setProperty("/isForwardingToCFO", false);
					oModel.setProperty("/isForwardingToMD1", false);
					oModel.setProperty("/isForwardingToMD2", false);
					oModel.setProperty("/isForwardingToCEO", false);
				} else if (Frole === "PJM") { // added on feb2022
					oModel.setProperty("/isForwardingToRequester", false);
					oModel.setProperty("/isForwardingToPJM", true);
					oModel.setProperty("/isForwardingToHOD", false);
					oModel.setProperty("/isForwardingToDIR", false);
					oModel.setProperty("/isForwardingToVP", false);
					oModel.setProperty("/isForwardingToCFO", false);
					oModel.setProperty("/isForwardingToMD1", false);
					oModel.setProperty("/isForwardingToMD2", false);
					oModel.setProperty("/isForwardingToCEO", false);
				} else if (Frole === "HOD") {
					oModel.setProperty("/isForwardingToRequester", false);
					oModel.setProperty("/isForwardingToPJM", false); // added on feb2022
					oModel.setProperty("/isForwardingToHOD", true);
					oModel.setProperty("/isForwardingToDIR", false);
					oModel.setProperty("/isForwardingToVP", false);
					oModel.setProperty("/isForwardingToCFO", false);
					oModel.setProperty("/isForwardingToMD1", false);
					oModel.setProperty("/isForwardingToMD2", false);
					oModel.setProperty("/isForwardingToCEO", false);
				} else if (Frole === "VP") {
					oModel.setProperty("/isForwardingToRequester", false);
					oModel.setProperty("/isForwardingToPJM", false); // added on feb2022
					oModel.setProperty("/isForwardingToHOD", false);
					oModel.setProperty("/isForwardingToDIR", false);
					oModel.setProperty("/isForwardingToVP", true);
					oModel.setProperty("/isForwardingToCFO", false);
					oModel.setProperty("/isForwardingToMD1", false);
					oModel.setProperty("/isForwardingToMD2", false);
					oModel.setProperty("/isForwardingToCEO", false);
				} else if (Frole === "CONTROLLING") {
					oModel.setProperty("/isForwardingToRequester", false);
					oModel.setProperty("/isForwardingToPJM", false); // added on feb2022
					oModel.setProperty("/isForwardingToHOD", false);
					oModel.setProperty("/isForwardingToVP", false);
					oModel.setProperty("/isForwardingToCC", true);
					oModel.setProperty("/isForwardingToCFO", false);
					oModel.setProperty("/isForwardingToMD1", false);
					oModel.setProperty("/isForwardingToMD2", false);
					oModel.setProperty("/isForwardingToCEO", false);
				} else if (Frole === "CFO") {
					oModel.setProperty("/isForwardingToRequester", false);
					oModel.setProperty("/isForwardingToPJM", false); // added on feb2022
					oModel.setProperty("/isForwardingToHOD", false);
					oModel.setProperty("/isForwardingToDIR", false);
					oModel.setProperty("/isForwardingToVP", false);
					oModel.setProperty("/isForwardingToCFO", true);
					oModel.setProperty("/isForwardingToMD1", false);
					oModel.setProperty("/isForwardingToMD2", false);
					oModel.setProperty("/isForwardingToCEO", false);
				} else if (Frole === "MD1") {
					oModel.setProperty("/isForwardingToRequester", false);
					oModel.setProperty("/isForwardingToPJM", false); // added on feb2022
					oModel.setProperty("/isForwardingToHOD", false);
					oModel.setProperty("/isForwardingToDIR", false);
					oModel.setProperty("/isForwardingToVP", false);
					oModel.setProperty("/isForwardingToCFO", false);
					oModel.setProperty("/isForwardingToMD1", true);
					oModel.setProperty("/isForwardingToMD2", false);
					oModel.setProperty("/isForwardingToCEO", false);
				} else if (Frole === "MD2") {
					oModel.setProperty("/isForwardingToRequester", false);
					oModel.setProperty("/isForwardingToPJM", false); // added on feb2022
					oModel.setProperty("/isForwardingToHOD", false);
					oModel.setProperty("/isForwardingToDIR", false);
					oModel.setProperty("/isForwardingToVP", false);
					oModel.setProperty("/isForwardingToCFO", false);
					oModel.setProperty("/isForwardingToMD1", false);
					oModel.setProperty("/isForwardingToMD2", true);
					oModel.setProperty("/isForwardingToCEO", false);
				} else if (Frole === "DIR" || Frole === "DIRECTOR") {
					oModel.setProperty("/isForwardingToRequester", false);
					oModel.setProperty("/isForwardingToPJM", false); // added on feb2022
					oModel.setProperty("/isForwardingToHOD", false);
					oModel.setProperty("/isForwardingToVP", false);
					oModel.setProperty("/isForwardingToCFO", false);
					oModel.setProperty("/isForwardingToMD1", false);
					oModel.setProperty("/isForwardingToMD2", false);
					oModel.setProperty("/isForwardingToDIR", true);
					oModel.setProperty("/isForwardingToCEO", false);
				} else if (Frole === "CEO") {
					oModel.setProperty("/isForwardingToRequester", false);
					oModel.setProperty("/isForwardingToPJM", false); // added on feb2022
					oModel.setProperty("/isForwardingToHOD", false);
					oModel.setProperty("/isForwardingToVP", false);
					oModel.setProperty("/isForwardingToCFO", false);
					oModel.setProperty("/isForwardingToMD1", false);
					oModel.setProperty("/isForwardingToMD2", false);
					oModel.setProperty("/isForwardingToDIR", false);
					oModel.setProperty("/isForwardingToCEO", true);
				}
			}

			this._triggerComplete(taskId, approvalStatus, refreshTask);
		},
		_handlePositiveAction: function (taskId, approvalStatus, refreshTask) {
			var oModel = this.getModel("ctx");
			if (oModel.getProperty("/workflowStep") === 0) {
				oModel.setProperty("/isForwarderSelected", false);
			}
			if (oModel.getProperty("/workflowStep") === 1) { //added by deeksha 24/11/2021
				oModel.setProperty("/isForwarderSelected", false);
			}
			if (oModel.getProperty("/workflowStep") === 2) { //added by deeksha 25/11/2021
				oModel.setProperty("/isForwarderSelected", false);
			}
			if (oModel.getProperty("/isForwarderSelected") === true) {
				var dialog = new Dialog({
					title: "Error",
					type: "Message",
					state: "Error",
					content: new Text({
						text: "You have selected the forwarding user, hence approve action is not possible."
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
				oModel.setProperty("/isForwarderSelected", false);
				oModel.setProperty("/forwardedToApprover", null);
				return;
			}
			if (oModel.getProperty("/onClickCalculate") === false) {
				var Cdialog = new Dialog({
					title: "Error",
					type: "Message",
					state: "Error",
					content: new Text({
						text: "Please calculate the budget for the changes you made."
					}),
					beginButton: new Button({
						text: "OK",
						press: function () {
							Cdialog.close();
						}
					}),
					afterClose: function () {
						Cdialog.destroy();
					}
				});
				Cdialog.open();
				return;
			}
			var rFlag = this._beforeAPPRRejectValidation();
			if (!rFlag) {
				return;
			}
			if (oModel.getProperty("/workflowStep") === 0 && !this.checkApprovers()) {
				var dialog = new Dialog({
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
				return;
			}
			oModel.setProperty("/isForwarding", false);
			this._isPFStep = undefined;
			this._setLastFwdApproverData();
			oModel.setProperty("/isForwardingToRequester", false);
			oModel.setProperty("/isForwardingToPJM", false); // added on feb2022
			oModel.setProperty("/isForwardingToHOD", false);
			oModel.setProperty("/isForwardingToDIR", false);
			oModel.setProperty("/isForwardingToVP", false);
			oModel.setProperty("/isForwardingToCFO", false);
			oModel.setProperty("/isForwardingToMD1", false);
			oModel.setProperty("/isForwardingToMD2", false);
			this._triggerComplete(taskId, approvalStatus, refreshTask);
		},

		getTablePositionsAsString: function () {
			//var sPositions = "----";
			var oNumberFormatter = Intl.NumberFormat('en-US', {
				minimumFractionDigits: 2
			});
			var sPositions = this.getModel("ctx").getProperty("/position/data")
				.filter(function (row) {
					return row.Currency !== undefined && row.Amount !== undefined;
				})
				.map(function (row) {
					return "Pos.: " + row.PositionNum + ", Descr.: " + row.Description + ", Supplier: " + row.SupplierDisplay + ", Delivery: " + row
						.Delivery + ", GLAccount: " + row.GlAccountDisplay + " - " + row.GlAccount + ", Qty.: " + oNumberFormatter.format(row.Quantity) +
						", Amount: " + oNumberFormatter.format(row.Amount) + ", Total: " + oNumberFormatter.format(row.TotalAmount) + ", Cur.: " + row.Currency +
						", Unit: " + row.UnitDisplay;
				})
				.join("\n");

			return sPositions.length > 0 ? sPositions : "-----";
		},

		// Added by Dhanush
		approverList: function () {
			var oThis = this;
			var oDataModel = this.getModel("approval");
			var apptype = "Purchase";
			// var aFilter = [];
			// 	aFilter.push(new Filter("im_type", FilterOperator.EQ, "Purchase"));
			var path = "/zgb_cds_wf_approval(im_type='" + apptype + "')/Set";
			// var path = "/zgb_cds_wf_approval";
			oDataModel.read(path, {
				// filters: aFilter,
				success: function (oData, oResponse) {
					var data = oData.results;
					oThis.getModel("approverlistModel").setData(data);
					oThis.rangeList();
				},
				error: function (err) {

				}
			});
		},

		rangeList: function () {
			var oThis = this;
			var oDataModel = this.getModel("range");
			var path = "/Zgb_cds_wf_range";
			oDataModel.read(path, {
				sorters: [new Sorter("APP_LEVEL", false)],
				success: function (oData, oResponse) {
					var data = oData.results;
					oThis.getModel("rangelistModel").setData(data);
				},
				error: function (err) {

				}
			});
		},
		//Ended by Dhanush

		checkApprovers: function () {
			var oPurModel = this.getModel("ctx");
			//var sRequestedBudget = oPurModel.getProperty("/sumAmountInEuro");
			var bLevel0 = (oPurModel.getProperty("/approverpjm") === undefined || oPurModel.getProperty("/approverpjm") === null ? false : true);
			var bLevel1 = (oPurModel.getProperty("/approverhod") === undefined || oPurModel.getProperty("/approverhod") === null ? false : true);
			var bLevel2 = (oPurModel.getProperty("/approverdirector") === undefined || oPurModel.getProperty("/approverdirector") === null ?
				false : true);
			var bLevel3 = (oPurModel.getProperty("/approvervp") === undefined || oPurModel.getProperty("/approvervp") === null ? false : true);
			var bLevel4 = (oPurModel.getProperty("/approvercfo") === undefined || oPurModel.getProperty("/approvercfo") === null ? false : true);
			var bLevel5 = (oPurModel.getProperty("/approvermd1") === undefined || oPurModel.getProperty("/approvermd1") === null ? false : true);
			var bLevel6 = (oPurModel.getProperty("/approvermd2") === undefined || oPurModel.getProperty("/approvermd2") === null ? false : true);
			var bLevel7 = (oPurModel.getProperty("/approverceo") === undefined || oPurModel.getProperty("/approverceo") === null ? false : true);

			// var isSufficientApproval = true;
			var isSufficientApproval = false;
			//var sRequestedBudget = 30000 ;
			var sRequestedBudget = oPurModel.getProperty("/requestedBudget");
			var approver = this.getModel('approverlistModel').getData();
			var range = this.getModel('rangelistModel').getData();
			// var aZGB_CDS_PJMAPPR = this.getModel("ZGB_CDS_PJMAPPR").results[0];

			var pjmapprdata = this.getModel("ZGB_CDS_PJMAPPR").results;
			var aZGB_CDS_PJMAPPR = {};
			if (pjmapprdata.length !== 0) {
				for (var i = 0; i < pjmapprdata.length; i++) {
					if (pjmapprdata[i].COMPCODE === oPurModel.getProperty("/legalEntity") && pjmapprdata[i].COSTCENTER === oPurModel.getProperty(
							"/costCenter")) {
						aZGB_CDS_PJMAPPR = pjmapprdata[i];

					}
				}
			}

			if (sRequestedBudget <= 0) {
				sap.m.MessageToast.show("Please enter the valid amount");
			} else if (sRequestedBudget > 0) {
				for (var i = 0; i < range.length; i++) {
					if (sRequestedBudget >= range[i].AMOUNT_FORM && sRequestedBudget < range[i].AMOUNT_TO) {
						if (range[i].APP_LEVEL === 0 && oPurModel.getProperty("/legalEntity") === aZGB_CDS_PJMAPPR.COMPCODE && oPurModel.getProperty(
								"/costCenter") === aZGB_CDS_PJMAPPR.COSTCENTER) {
							if (bLevel0 || bLevel1 || bLevel2 || bLevel3 || bLevel4 || bLevel5 || bLevel6 || bLevel7) { // added 'bLevel0' by deeksha 12/1/2022
								isSufficientApproval = true;
							}
						} else if (range[i].APP_LEVEL === 0 && (oPurModel.getProperty("/legalEntity") !== aZGB_CDS_PJMAPPR.COMPCODE || oPurModel.getProperty(
								"/costCenter") !== aZGB_CDS_PJMAPPR.COSTCENTER)) {
							if (bLevel1 || bLevel2 || bLevel3 || bLevel4 || bLevel5 || bLevel6 || bLevel7) { // added 'bLevel0' by deeksha 12/1/2022
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
			oPurModel.setProperty("/PJMset", false); // added on feb2022
			oPurModel.setProperty("/HODset", false);
			oPurModel.setProperty("/DIRECTORset", false);
			oPurModel.setProperty("/VPset", false);
			oPurModel.setProperty("/CFOset", false);
			oPurModel.setProperty("/MD1set", false);
			oPurModel.setProperty("/MD2set", false);
			oPurModel.setProperty("/CEOset", false);

			//			var approver = "joezud01@GOODBABYINT.COM";

			if (oPurModel.getProperty("/edit") === true) {
				var app = [];
				this._aForwardingUsers = [];
				var fusers = oPurModel.getProperty("/aForwardingUsers");
			}
			if (isSufficientApproval) {
				if (bLevel0) { // added by deeksha 12/1/2022
					oPurModel.setProperty("/PJMset", true);
					oPurModel.setProperty("/PJMApprover", oPurModel.getProperty("/approverpjm"));
					oPurModel.setProperty("/Zappr", oPurModel.getProperty("/PJMApproverDisplay"));
					if (oPurModel.getProperty("/edit") === true) {
						app.push("PJM");
						for (var i = 0; i < fusers.length; i++) {
							if (fusers[i].Role === "PJM") {
								// var array = fusers[i].split();
								this._aForwardingUsers.push(fusers[i]);
							}
						}
					}
				} // ended by deeksha 12/1/2022				
				if (bLevel1) {
					oPurModel.setProperty("/HODset", true);
					oPurModel.setProperty("/HODApprover", oPurModel.getProperty("/approverhod"));

					//set value for Zappr for oStatusReport. Can be different, depending on the requested amount.
					oPurModel.setProperty("/Zappr", oPurModel.getProperty("/HODApproverDisplay"));
					if (oPurModel.getProperty("/edit") === true) {
						app.push("HOD");
						for (var i = 0; i < fusers.length; i++) {
							if (fusers[i].Role === "HOD") {
								// var array = fusers[i].split();
								this._aForwardingUsers.push(fusers[i]);
							}
						}
					}
				}
				if (bLevel2) {
					oPurModel.setProperty("/DIRECTORset", true);
					oPurModel.setProperty("/DirectorApprover", oPurModel.getProperty("/approverdirector"));
					// app.push("DIRECTOR");
					//set value for Zappr for oStatusReport. Can be different, depending on the requested amount.
					oPurModel.setProperty("/Zappr", oPurModel.getProperty("/DirectorApproverDisplay"));
					if (oPurModel.getProperty("/edit") === true) {
						app.push("DIRECTOR");
						for (var i = 0; i < fusers.length; i++) {
							if (fusers[i].Role === "DIRECTOR") {
								// var array = fusers[i].split();
								this._aForwardingUsers.push(fusers[i]);
							}
						}
					}

				}
				if (bLevel3) {
					oPurModel.setProperty("/VPset", true);
					oPurModel.setProperty("/VPApprover", oPurModel.getProperty("/approvervp"));
					// app.push("VP");
					//set value for Zappr for oStatusReport. Can be different, depending on the requested amount.
					oPurModel.setProperty("/Zappr", oPurModel.getProperty("/VPApproverDisplay"));
					if (oPurModel.getProperty("/edit") === true) {
						app.push("VP");
						for (var i = 0; i < fusers.length; i++) {
							if (fusers[i].Role === "VP") {
								// var array = fusers[i].split();
								this._aForwardingUsers.push(fusers[i]);
							}
						}
					}
				}
				if (bLevel4) {
					oPurModel.setProperty("/CFOset", true);
					oPurModel.setProperty("/CFOApprover", oPurModel.getProperty("/approvercfo"));
					// app.push("CFO");
					//set value for Zappr for oStatusReport. Can be different, depending on the requested amount.
					oPurModel.setProperty("/Zappr", oPurModel.getProperty("/CFOApproverDisplay"));
					if (oPurModel.getProperty("/edit") === true) {
						app.push("CFO");
						for (var i = 0; i < fusers.length; i++) {
							if (fusers[i].Role === "CFO") {
								// var array = fusers[i].split();
								this._aForwardingUsers.push(fusers[i]);
							}
						}
					}
				}
				if (bLevel5) {
					oPurModel.setProperty("/MD1set", true);
					oPurModel.setProperty("/MD1Approver", oPurModel.getProperty("/approvermd1"));
					// app.push("MD1");
					//set value for Zappr for oStatusReport. Can be different, depending on the requested amount.
					oPurModel.setProperty("/Zappr", oPurModel.getProperty("/MD1ApproverDisplay"));
					if (oPurModel.getProperty("/edit") === true) {
						app.push("MD1");
						for (var i = 0; i < fusers.length; i++) {
							if (fusers[i].Role === "MD1") {
								// var array = fusers[i].split();
								this._aForwardingUsers.push(fusers[i]);
							}
						}
					}
				}
				if (bLevel6) {
					oPurModel.setProperty("/MD2set", true);
					oPurModel.setProperty("/MD2Approver", oPurModel.getProperty("/approvermd2"));
					// app.push("MD2");
					//set value for Zappr for oStatusReport. Can be different, depending on the requested amount.
					oPurModel.setProperty("/Zappr", oPurModel.getProperty("/MD2ApproverDisplay"));
					if (oPurModel.getProperty("/edit") === true) {
						app.push("MD2");
						for (var i = 0; i < fusers.length; i++) {
							if (fusers[i].Role === "MD2") {
								// var array = fusers[i].split();
								this._aForwardingUsers.push(fusers[i]);
							}
						}
					}
				}
				if (bLevel7) {
					oPurModel.setProperty("/CEOset", true);
					oPurModel.setProperty("/CEOApprover", oPurModel.getProperty("/approverceo"));
					//set value for Zappr for oStatusReport. Can be different, depending on the requested amount.
					oPurModel.setProperty("/Zappr", oPurModel.getProperty("/CEOApproverDisplay"));
					if (oPurModel.getProperty("/edit") === true) {
						app.push("CEO");
						for (var i = 0; i < fusers.length; i++) {
							if (fusers[i].Role === "CEO") {
								// var array = fusers[i].split();
								this._aForwardingUsers.push(fusers[i]);
							}
						}
					}
				}
			}
			if (oPurModel.getProperty("/edit") === true) {
				oPurModel.setData({
					ApproverList: app
				}, true);
			}
			return isSufficientApproval;
		},
		_beforeAPPRRejectValidation: function () {
			var oModel = this.getModel("ctx");

			if (oModel.getProperty("/requestedBudget") === null || oModel.getProperty("/requestedBudget") === undefined) {
				var dialog = new Dialog({
					title: "Error",
					type: "Message",
					state: "Error",
					content: new Text({
						text: "Please calculate the total amount before you submit the request."
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
				return false;
			}

			if (oModel.getProperty("/Name") === null || oModel.getProperty("/Name") === undefined ||
				oModel.getProperty("/Street1") === null || oModel.getProperty("/Street1") === undefined ||
				oModel.getProperty("/HouseNo") === null || oModel.getProperty("/HouseNo") === undefined ||
				oModel.getProperty("/PostalCode") === null || oModel.getProperty("/PostalCode") === undefined ||
				oModel.getProperty("/City") === null || oModel.getProperty("/City") === undefined ||
				oModel.getProperty("/CountryName") === null || oModel.getProperty("/CountryName") === undefined || oModel.getProperty(
					"/invoiceApprover") === undefined) {
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
				return false;
			}
			return true;

		},

		getAttachments: function () {
			var oFileModel = this.getModel("filebucketservice");
			var sAttachmentLinks = "";
			var sAttachmentId;
			for (var file in oFileModel.oData) {
				sAttachmentId = file.split("\'")[1]; // tw72h2gxnz
			 sAttachmentLinks = sAttachmentLinks + "https://cerrepoaccessbi0brchgc3.eu2.hana.ondemand.com/FileBucketProvider/get?id="+sAttachmentId+"#";
				// sAttachmentLinks = sAttachmentLinks + "https://" + "cerrepoaccesstw72h2gxnz.eu2.hana.ondemand.com/" + "FileBucketProvider/get?id=" +
				// 	sAttachmentId + "#";
			}
			sAttachmentLinks = sAttachmentLinks.substring(0, sAttachmentLinks.length - 1);
			// console.log(sAttachmentLinks);
			this.getModel("ctx").setProperty("/sAttachmentLinks", sAttachmentLinks);
		},

		_findNextApprover: function () {
			var oModel = this.getModel("ctx");
			var sWorkflowStep = oModel.getProperty("/workflowStep");
			var aApproversList = oModel.getProperty("/Zappr");

			for (var i = sWorkflowStep + 1; i < aApproversList.length; i++) {
				var oValue = aApproversList[i];
				var sApproverName = "Indirect Procurement";
				if (oValue.ApproverName !== "NONE") {
					sApproverName = oValue.ApproverName;
					break;
				}
				oModel.setProperty("/Zappr", sApproverName);
			}
		},

		_bindAssetSelectBox: function () {
			var oModel = this.getModel("ctx");
			var oModelTest = this.getModel("test");
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

		// This method is called when the
		// confirm button is click by the end
		// user
		_triggerComplete: function (taskId, approvalStatus, refreshTask) {
			var oModel = this.getModel("ctx");
			// added by dhanush
			if (!approvalStatus) {
				this.getModel("ctx").setProperty("/isForwarding", false);
				var rFlag = this._beforeAPPRRejectValidation();
				if (!rFlag) {
					return;
				}
			}
			// ended by dhanush
			//commented by sowjanya
			// if(oModel.getProperty("/requestedBudget") === null || oModel.getProperty("/requestedBudget") === undefined){
			// 	dialog = new Dialog({
			// 		title: "Error",
			// 		type: "Message",
			// 		state: "Error",
			// 		content: new Text({
			// 			text: "Please calculate the total amount before you submit the request."
			// 		}),
			// 		beginButton: new Button({
			// 			text: "OK",
			// 			press: function () {
			// 				dialog.close();
			// 			}
			// 		}),
			// 		afterClose: function () {
			// 			dialog.destroy();
			// 		}
			// 	});
			// 	dialog.open();
			// 	return;
			// }

			//comment ended by sowjanya
			// if(oModel.getProperty("/workflowStep") == 0 && !this.checkApprovers()){
			// 	var	dialog = new Dialog({
			// 		title: "Error",
			// 		type: "Message",
			// 		state: "Error",
			// 		content: new Text({
			// 			text: "Approvers selection is not sufficient.For more information please hover the info icon."
			// 		}),
			// 		beginButton: new Button({
			// 			text: "OK",
			// 			press: function () {
			// 				dialog.close();
			// 				return;
			// 			}
			// 		}),
			// 		afterClose: function () {
			// 			dialog.destroy();
			// 		}
			// 	});
			// 	dialog.open();
			// 	return;
			// }

			//commented by sowjaya
			// if(oModel.getProperty("/Name") === null || oModel.getProperty("/Name") === undefined ||
			// 	oModel.getProperty("/Street1") === null || oModel.getProperty("/Street1") === undefined ||
			// 	oModel.getProperty("/HouseNo") === null|| oModel.getProperty("/HouseNo") === undefined ||
			// 	oModel.getProperty("/PostalCode") === null|| oModel.getProperty("/PostalCode") === undefined ||
			// 	oModel.getProperty("/City") === null|| oModel.getProperty("/City") === undefined ||
			// 	oModel.getProperty("/CountryName")=== null|| oModel.getProperty("/CountryName") === undefined
			// 	|| oModel.getProperty("/invoiceApprover") === undefined){
			// 	dialog = new Dialog({
			// 		title: "Error",
			// 		type: "Message",
			// 		state: "Error",
			// 		content: new Text({
			// 			text: "Please complete all required fields."
			// 		}),
			// 		beginButton: new Button({
			// 			text: "OK",
			// 			press: function () {
			// 				dialog.close();
			// 			}
			// 		}),
			// 		afterClose: function () {
			// 			dialog.destroy();
			// 		}
			// 	});
			// 	dialog.open();
			// 	return;
			// }
			//commented end by sowjanya

			if ((oModel.getProperty("/isForwarding") === true && oModel.getProperty("/forwardedToApprover") === undefined) || (oModel.getProperty(
					"/isForwarding") === true && oModel.getProperty("/forwardedToApprover") === null) || oModel.getProperty("/forwardedToApprover") ===
				"-----") {
				var dialog = new Dialog({
					title: "Error",
					type: "Message",
					state: "Error",
					content: new Text({
						text: "Please select a forwarding user first."
					}),
					beginButton: new Button({
						text: "OK",
						press: function () {
							dialog.close();
							return;
						}
					}),
					afterClose: function () {
						dialog.destroy();
					}
				});
				dialog.open();
				return;
			}
			var requestedBudget = oModel.getProperty("/requestedBudget");
			//commented by deeksha 15/11/2021 15:42pm//
			/*requestedBudget = parseFloat(requestedBudget.toString()).toFixed(2);
			var requestedBudgetFormattedMail = requestedBudget.toString().replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
			oModel.setData({requestedBudgetFormattedMail:requestedBudgetFormattedMail},true);*/

			//started by deeksha 15/11/2021//
			//oModel.setProperty("/requestedBudget", requestedBudget).toString();
			/*var requestedBudget = parseFloat(oModel.getProperty("/requestedBudget")) + parseFloat(oModel.getProperty(
					"/requestedBudget"));*/
			/*var requestedBudget = oModel.getProperty("/requestedBudget").toString();*/
			/*oModel.setProperty("/requestedBudget", requestedBudget);*/
			/*requestedBudget = parseFloat(requestedBudget.toString()).toFixed(2);*/
			var requestedBudgetFormattedMail = new Intl.NumberFormat('en-US', {
				minimumFractionDigits: 2
			}).format(requestedBudget);
			oModel.setProperty("/requestedBudgetFormattedMail", requestedBudgetFormattedMail);
			oModel.getProperty("/requestedBudgetFormattedMail");
			/*oModel.setProperty("/requestedBudget", requestedBudget);*/
			/*oModel.setData({requestedBudgetFormattedMail:requestedBudgetFormattedMail},true);*/
			/*oModel.setProperty("/requestedBudget", requestedBudget);*/
			//ended by deeksha 15/11/2021//

			//if (approvalStatus !== false) {
			//var oModel = this.getModel("pur").getData();
			//oModel.setData({isApproved: approvalStatus}, true);
			// var oContext = this.getModel("pur").getData();	
			// this.contextData.isApproved = approvalStatus;
			//NEW

			/*			var ZOF = this.getView().byId("ZOF");
						if (ZOF.getSelected()) {
							oModel.setData({prType: "ZFO"}, true);
							oModel.setData({prTypeDisplay: "Framework requisition"}, true);
						} else {
							oModel.setData({prType: "ZNB"}, true);
							oModel.setData({prTypeDisplay: "Purchase requisition"}, true);
						};
						var opex = this.getView().byId("OC");
						var sTypValue;
						if (opex.getSelected()) {
							oModel.setData({type: "OC"}, true);
							sTypValue= "O";//needed for status entity.
							oModel.setData({typeDisplay: "OPEX"}, true);
						} else {
							oModel.setData({type: "IV"}, true);
							sTypValue= "I";//needed for status entity.
							oModel.setData({typeDisplay: "CAPEX"}, true);
						}
			*/
			var sPositionsAsString = this.getTablePositionsAsString();
			oModel.setData({
				tablePositionsAsString: sPositionsAsString
			}, true);
			//END NEW 
			var oModelPos = this.getModel("ctx");
			var obj = {
				"data": oModelPos.getProperty("/position/data")
					.filter(function (row) {
						return (row.Quantity !== undefined && row.Quantity !== null && row.Supplier !== null);
					}).map(function (row) {
						var newEntry = new Object();
						newEntry.Amount = row.Amount.toString();
						newEntry.Currency = row.Currency;
						newEntry.Delivery = row.Delivery;
						newEntry.Description = row.Description;
						newEntry.GlAccount = row.GlAccount;
						newEntry.GlAccountDisplay = row.GlAccountDisplay;
						newEntry.PositionNum = row.PositionNum;
						newEntry.Quantity = row.Quantity.toString();
						newEntry.Supplier = row.Supplier;
						newEntry.SupplierDisplay = row.SupplierDisplay;
						newEntry.TotalAmount = row.TotalAmount.toString();
						newEntry.UnitDisplay = row.UnitDisplay;
						newEntry.UnitMeasure = row.UnitMeasure;
						return newEntry;
					})

			};
			oModel.setData({
				position: obj
			}, true);
			oModel.setProperty("/position/data/",obj.data);

			// this.getModel("ctx").setProperty("/accountAssignments", undefined);
			// this.getModel("ctx").setProperty("/assetNumbers", undefined);
			this.getModel("ctx").setProperty("/isApproved", approvalStatus);
			//	if(this.getModel("ctx").getProperty("/comment") !== undefined && this.getModel("ctx").getProperty("/comment").length > 0){

			var commentLabel = "\n \n" + this.getModel("ctx").getProperty("/workflowStepDescr") + ": \n";
			var commentText = this.getModel("ctx").getProperty("/commentText");
			// var sUserId = new sap.ushell.services.UserInfo().getUser().getId();
			var sUserId = new new sap.ushell.Container.getService("UserInfo").getUser().getId();
			// var sUserFullName = new sap.ushell.services.UserInfo().getUser().getFullName();
			var sUserFullName = new new sap.ushell.Container.getService("UserInfo").getUser().getFullName();
			var sCommentAppend = "";
			var oDate = new Date(Date.now());
			var options = {
				month: '2-digit',
				day: '2-digit',
				year: 'numeric',
				hour: 'numeric',
				minute: 'numeric',
				second: 'numeric'
			};
			this._sCommentHistory = "";
			var sCommentText = "-----";
			if (this.getModel("ctx").getProperty("/sCommentHistory") !== undefined) {
				this._sCommentHistory = this.getModel("ctx").getProperty("/sCommentHistory");
			}
			if (this.getModel("ctx").getProperty("/comment") !== null && this.getModel("ctx").getProperty("/comment") !== undefined) {
				sCommentAppend = this.getModel("ctx").getProperty("/comment");
			}

			// Commented by Dhanush
			// if(this.getModel("ctx").getProperty("/workflowStep") === 0){
			// 	commentText = commentText + "\n \n" + "Reenter commment: " + sCommentAppend;
			// 	//commentText = commentText + "\n \n" + "HOD comment: " + this.getModel("ctx").getProperty("/comment");
			// 	/*if(this.getModel("ctx").getProperty("/HODMail").toLowerCase() !== sUserId.toLowerCase()){
			// 		this.getModel("ctx").setProperty("/HODApproverDisplay",sUserFullName);
			// 	}
			// 	*/
			// 	this._sCommentHistory = this._sCommentHistory+ oDate.toLocaleString("de-DE",options)+", "+"Reenter"+" "+this.getModel("ctx").getProperty("/requesterName")+": "+sCommentAppend+ "\n";

			// }else if(this.getModel("ctx").getProperty("/workflowStep") === 1){
			// 	commentText = commentText + "\n \n" + "HOD comment: " + sCommentAppend;
			// 	//commentText = commentText + "\n \n" + "HOD comment: " + this.getModel("ctx").getProperty("/comment");
			// 	if(this.getModel("ctx").getProperty("/HODMail")!==undefined){
			// 		if(this.getModel("ctx").getProperty("/HODMail").toLowerCase() !== sUserId.toLowerCase()){
			// 		this.getModel("ctx").setProperty("/HODApproverDisplay",sUserFullName);
			// 	}
			// 	this._sCommentHistory = this._sCommentHistory+ oDate.toLocaleString("de-DE",options)+", "+"HOD"+" "+this.getModel("ctx").getProperty("/HODApproverDisplay")+": "+sCommentAppend+ "\n";
			// 	}
			// 	}else if(this.getModel("ctx").getProperty("/workflowStep") === 2){
			// 	commentText = commentText + "\n \n" + "DIRECTOR comment: " + sCommentAppend;
			// 	//commentText = commentText + "\n \n" + "Director comment: " + this.getModel("ctx").getProperty("/comment");
			// 	if(this.getModel("ctx").getProperty("/DirectorMail")!==undefined){
			// 		if(this.getModel("ctx").getProperty("/DirectorMail").toLowerCase() !== sUserId.toLowerCase()){
			// 		this.getModel("ctx").setProperty("/DirectorApproverDisplay",sUserFullName);
			// 	}
			// 	this._sCommentHistory = this._sCommentHistory+ oDate.toLocaleString("de-DE",options)+", "+"Director"+" "+this.getModel("ctx").getProperty("/DirectorApproverDisplay")+": "+sCommentAppend+ "\n";
			// 	}
			// 	}else if(this.getModel("ctx").getProperty("/workflowStep") === 3){
			// 	commentText = commentText + "\n \n" + "VP comment: " + sCommentAppend;
			// 	if(this.getModel("ctx").getProperty("/VPMail")!==undefined){
			// 		if(this.getModel("ctx").getProperty("/VPMail").toLowerCase() !== sUserId.toLowerCase()){
			// 		this.getModel("ctx").setProperty("/VPApproverDisplay",sUserFullName);
			// 	}
			// 	this._sCommentHistory = this._sCommentHistory+ oDate.toLocaleString("de-DE",options)+", "+"VP"+" "+this.getModel("ctx").getProperty("/VPApproverDisplay")+": "+sCommentAppend+ "\n";
			// 	}
			// 	}else if(this.getModel("ctx").getProperty("/workflowStep") === 4){
			// 	commentText = commentText + "\n \n" + "CFO comment: " + sCommentAppend;
			// 	if(this.getModel("ctx").getProperty("/CFOMail")!==undefined){
			// 		if(this.getModel("ctx").getProperty("/CFOMail").toLowerCase() !== sUserId.toLowerCase()){
			// 		this.getModel("ctx").setProperty("/CFOApproverDisplay",sUserFullName);
			// 	}
			// 	this._sCommentHistory = this._sCommentHistory+ oDate.toLocaleString("de-DE",options)+", "+"CFO"+" "+this.getModel("ctx").getProperty("/CFOApproverDisplay")+": "+sCommentAppend+ "\n";
			// 	}
			// 	}else if(this.getModel("ctx").getProperty("/workflowStep") === 5){
			// 	commentText = commentText + "\n \n" + "MD1 comment: " + sCommentAppend;
			// 	if(this.getModel("ctx").getProperty("/MD1Mail")!==undefined){
			// 		if(this.getModel("ctx").getProperty("/MD1Mail").toLowerCase() !== sUserId.toLowerCase()){
			// 		this.getModel("ctx").setProperty("/MD1ApproverDisplay",sUserFullName);
			// 	}
			// 	this._sCommentHistory = this._sCommentHistory+ oDate.toLocaleString("de-DE",options)+", "+"MD1"+" "+this.getModel("ctx").getProperty("/MD1ApproverDisplay")+": "+sCommentAppend+ "\n";
			// 	}
			// 	}else if(this.getModel("ctx").getProperty("/workflowStep") === 6){
			// 	commentText = commentText + "\n \n" + "MD2 comment: " + this.getModel("ctx").getProperty("/comment");
			// 	if(this.getModel("ctx").getProperty("/MD2Mail")!==undefined){
			// 		if(this.getModel("ctx").getProperty("/MD2Mail").toLowerCase() !== sUserId.toLowerCase()){
			// 		this.getModel("ctx").setProperty("/MD2ApproverDisplay",sUserFullName);
			// 	}
			// 	this._sCommentHistory = this._sCommentHistory+ oDate.toLocaleString("de-DE",options)+", "+"MD2"+" "+this.getModel("ctx").getProperty("/MD2ApproverDisplay")+": "+sCommentAppend+ "\n";
			// 	}
			// 	}else if(this.getModel("ctx").getProperty("/workflowStep") === 7){
			// 	commentText = commentText + "\n \n" + "CEO comment: " + this.getModel("ctx").getProperty("/comment");
			// 	if(this.getModel("ctx").getProperty("/CEOMail")!==undefined){
			// 		if(this.getModel("ctx").getProperty("/CEOMail").toLowerCase() !== sUserId.toLowerCase()){
			// 		this.getModel("ctx").setProperty("/CEOApproverDisplay",sUserFullName);
			// 	}
			// 	this._sCommentHistory = this._sCommentHistory+ oDate.toLocaleString("de-DE",options)+", "+"CEO"+" "+this.getModel("ctx").getProperty("/CEOApproverDisplay")+": "+sCommentAppend+ "\n";
			// 	}
			// 	}else
			// 	if (this.getModel("ctx").getProperty("/workflowStep") === 8){
			// 	commentText = commentText + "\n \n" + "comment: " + this.getModel("ctx").getProperty("/comment");
			// 		this._sCommentHistory = this._sCommentHistory+ oDate.toLocaleString("de-DE",options)+", "+"Ind. Procurement"+ sCommentAppend+ "\n";
			// }

			//Added by Dhanush
			var sWorkflowStep = this.getModel("ctx").getProperty("/workflowStep");
			var appdata = this.getModel("ctx").getProperty('/ApproverList');
			var newcomment = this.getModel("ctx").getProperty('/comment');
			var oldcomment = this.getModel("ctx").getProperty('/sCommentHistory');
			var descWFstep = this.getModel("ctx").getProperty("/workflowStepDescr");
			//Start of changes by Dhanush M V on 22.02.2022 (instead of using 'sWorkflowStep' in below IF conditions I am taking new variable 'WFstepcount' )
			var WFstepcount = sWorkflowStep;
			if (sWorkflowStep !== 0 && appdata[0] === "PJM") {
				WFstepcount = WFstepcount + 1;
			}

			//comment workflowstep
			if (this._isPFStep === undefined) {
				var cWFStep = WFstepcount;
			} else {
				cWFStep = this._isPFStep;
				if (cWFStep !== 0 && appdata[0] === "PJM") {
					cWFStep = cWFStep + 1;
				}
			}

			//End of changes by Dhanush M V on 22.02.2022
			if (cWFStep === 0 && descWFstep !== undefined && descWFstep !== "PJM") {
				commentText = commentText + "\n \n" + "Requestor comment: " + this.getModel("ctx").getProperty("/comment");
				// if(this.getModel("ctx").getProperty("/HODMail")!==undefined){
				// if(this.getModel("ctx").getProperty("/HODMail").toLowerCase() !== sUserId.toLowerCase()){
				// this.getModel("ctx").setProperty("/HODApproverDisplay",sUserFullName);
				// }
				this._sCommentHistory = this._sCommentHistory + oDate.toLocaleString("de-DE", options) + ", " + "Requester" + " " + this.getModel(
					"ctx").getProperty("/requesterName") + ": " + sCommentAppend + "\n";
				// }
			} else if (descWFstep === "PJM" && cWFStep === 0) { // added on feb2022
				commentText = commentText + "\n \n" + "PJM comment: " + this.getModel("ctx").getProperty("/comment");
				// if(this.getModel("ctx").getProperty("/HODMail")!==undefined){
				// if(this.getModel("ctx").getProperty("/HODMail").toLowerCase() !== sUserId.toLowerCase()){
				this.getModel("ctx").setProperty("/PJMApproverDisplay", sUserFullName);
				// }
				this._sCommentHistory = this._sCommentHistory + oDate.toLocaleString("de-DE", options) + ", " + "PJM" + " " + this.getModel("ctx")
					.getProperty("/PJMApproverDisplay") + ": " + sCommentAppend + "\n";
				// }
			} else if (appdata[cWFStep - 1] === "HOD") { //Changed by Dhanush M V on 22.02.2022 (replaced 'sWorkflowStep-1' with 'WFstepcount-1' )
				commentText = commentText + "\n \n" + "HOD comment: " + this.getModel("ctx").getProperty("/comment");
				// if(this.getModel("ctx").getProperty("/HODMail")!==undefined){
				// if(this.getModel("ctx").getProperty("/HODMail").toLowerCase() !== sUserId.toLowerCase()){
				this.getModel("ctx").setProperty("/HODApproverDisplay", sUserFullName);
				// }
				this._sCommentHistory = this._sCommentHistory + oDate.toLocaleString("de-DE", options) + ", " + "HOD" + " " + this.getModel("ctx")
					.getProperty("/HODApproverDisplay") + ": " + sCommentAppend + "\n";
				// }
			} else if (appdata[cWFStep - 1] === "DIRECTOR") { //Changed by Dhanush M V on 22.02.2022 (replaced 'sWorkflowStep-1' with 'WFstepcount-1' )
				commentText = commentText + "\n \n" + "DIRECTOR comment: " + this.getModel("ctx").getProperty("/comment");
				// if(this.getModel("ctx").getProperty("/DirectorMail")!==undefined){
				// if(this.getModel("ctx").getProperty("/DirectorMail").toLowerCase() !== sUserId.toLowerCase()){
				this.getModel("ctx").setProperty("/DirectorApproverDisplay", sUserFullName);
				// }
				this._sCommentHistory = this._sCommentHistory + oDate.toLocaleString("de-DE", options) + ", " + "Director" + " " + this.getModel(
					"ctx").getProperty("/DirectorApproverDisplay") + ": " + sCommentAppend + "\n";
				// }
			} else if (appdata[cWFStep - 1] === "VP") { //Changed by Dhanush M V on 22.02.2022 (replaced 'sWorkflowStep-1' with 'WFstepcount-1' )
				commentText = commentText + "\n \n" + "VP comment: " + this.getModel("ctx").getProperty("/comment");
				// if(this.getModel("ctx").getProperty("/VPMail")!==undefined){
				// if(this.getModel("ctx").getProperty("/VPMail").toLowerCase() !== sUserId.toLowerCase()){
				this.getModel("ctx").setProperty("/VPApproverDisplay", sUserFullName);
				// }
				this._sCommentHistory = this._sCommentHistory + oDate.toLocaleString("de-DE", options) + ", " + "VP" + " " + this.getModel("ctx").getProperty(
					"/VPApproverDisplay") + ": " + sCommentAppend + "\n";
				// }
			} else if (appdata[cWFStep - 1] === "CFO") { //Changed by Dhanush M V on 22.02.2022 (replaced 'sWorkflowStep-1' with 'WFstepcount-1' )
				commentText = commentText + "\n \n" + "CFO comment: " + this.getModel("ctx").getProperty("/comment");
				// if(this.getModel("ctx").getProperty("/CFOMail")!==undefined){
				// if(this.getModel("ctx").getProperty("/CFOMail").toLowerCase() !== sUserId.toLowerCase()){
				this.getModel("ctx").setProperty("/CFOApproverDisplay", sUserFullName);
				// }
				this._sCommentHistory = this._sCommentHistory + oDate.toLocaleString("de-DE", options) + ", " + "CFO" + " " + this.getModel("ctx")
					.getProperty("/CFOApproverDisplay") + ": " + sCommentAppend + "\n";
				// }
			} else if (appdata[cWFStep - 1] === "MD1") { //Changed by Dhanush M V on 22.02.2022 (replaced 'sWorkflowStep-1' with 'WFstepcount-1' )
				commentText = commentText + "\n \n" + "MD1 comment: " + this.getModel("ctx").getProperty("/comment");
				// if(this.getModel("ctx").getProperty("/MD1Mail")!==undefined){
				// if(this.getModel("ctx").getProperty("/MD1Mail").toLowerCase() !== sUserId.toLowerCase()){
				this.getModel("ctx").setProperty("/MD1ApproverDisplay", sUserFullName);
				// }
				this._sCommentHistory = this._sCommentHistory + oDate.toLocaleString("de-DE", options) + ", " + "MD1" + " " + this.getModel("ctx")
					.getProperty("/MD1ApproverDisplay") + ": " + sCommentAppend + "\n";
				// }
			} else if (appdata[cWFStep - 1] === "MD2") { //Changed by Dhanush M V on 22.02.2022 (replaced 'sWorkflowStep-1' with 'WFstepcount-1' )
				commentText = commentText + "\n \n" + "MD comment: " + this.getModel("ctx").getProperty("/comment");
				// if(this.getModel("ctx").getProperty("/MD2Mail")!==undefined){
				// if(this.getModel("ctx").getProperty("/MD2Mail").toLowerCase() !== sUserId.toLowerCase()){
				this.getModel("ctx").setProperty("/MD2ApproverDisplay", sUserFullName);
				// }
				this._sCommentHistory = this._sCommentHistory + oDate.toLocaleString("de-DE", options) + ", " + "MD2" + " " + this.getModel("ctx")
					.getProperty("/MD2ApproverDisplay") + ": " + sCommentAppend + "\n";
				// }
			} else if (appdata[cWFStep - 1] === "CEO") { //Changed by Dhanush M V on 22.02.2022 (replaced 'sWorkflowStep-1' with 'WFstepcount-1' )
				commentText = commentText + "\n \n" + "CEO comment: " + this.getModel("ctx").getProperty("/comment");
				// if(this.getModel("ctx").getProperty("/CEOMail")!==undefined){
				// if(this.getModel("ctx").getProperty("/CEOMail").toLowerCase() !== sUserId.toLowerCase()){
				this.getModel("ctx").setProperty("/CEOApproverDisplay", sUserFullName);
				// }
				this._sCommentHistory = this._sCommentHistory + oDate.toLocaleString("de-DE", options) + ", " + "CEO" + " " + this.getModel("ctx")
					.getProperty("/CEOApproverDisplay") + ": " + sCommentAppend + "\n";
				// }
			} else if (cWFStep === 8) {
				commentText = commentText + "\n \n" + "comment: " + this.getModel("ctx").getProperty("/comment");
				this.getModel("ctx").setProperty("/IndProcurementApproverDisplay", sUserFullName);
				this._sCommentHistory = this._sCommentHistory + oDate.toLocaleString("de-DE", options) + ", " + "Ind.Procurement" + " " + this.getModel(
					"ctx").getProperty("/IndProcurementApproverDisplay") + ": " + sCommentAppend + "\n"; // }
			} else if (cWFStep === 9) {
				commentText = commentText + "\n \n" + "comment: " + this.getModel("ctx").getProperty("/comment");
				this.getModel("ctx").setProperty("/EMEACentralFinanceApproverDisplay", sUserFullName);
				this._sCommentHistory = this._sCommentHistory + oDate.toLocaleString("de-DE", options) + ", " + "EMEA Central Finance" + " " +
					this.getModel("ctx").getProperty("/EMEACentralFinanceApproverDisplay") + ": " + sCommentAppend + "\n";
			}

			this.getModel("ctx").setProperty("/sCommentHistory", this._sCommentHistory);
			//this.getModel("ctx").setProperty("/commentText", commentText);
			this.getModel("ctx").setProperty("/commentText", this._sCommentHistory);
			this.getModel("ctx").setProperty("/comment", undefined);
			this.getModel("ctx").setProperty("/forwardedToApprover", undefined);
			this.getModel("ctx").setProperty("/NextApproverName", undefined);
			this.getModel("ctx").setProperty("/NextApproverMail", undefined);
			this.getModel("ctx").setProperty("/NextApproverRole", undefined);

			if (this.getModel("ctx").getData().isForwarding === false) {

				if (appdata[WFstepcount] === "PJM") { // added on feb2022 //Changed by Dhanush M V on 22.02.2022 (replaced 'sWorkflowStep' with 'WFstepcount' )
					this.getModel("ctx").setProperty("/NextApproverName", this.getModel("ctx").getProperty("/PJMApproverDisplay"));
					this.getModel("ctx").setProperty("/NextApproverMail", this.getModel("ctx").getProperty("/PJMMail"));
					this.getModel("ctx").setProperty("/NextApproverRole", "PJM");
				} else if (appdata[WFstepcount] === "HOD") { //Changed by Dhanush M V on 22.02.2022 (replaced 'sWorkflowStep' with 'WFstepcount' )
					this.getModel("ctx").setProperty("/NextApproverName", this.getModel("ctx").getProperty("/HODApproverDisplay"));
					this.getModel("ctx").setProperty("/NextApproverMail", this.getModel("ctx").getProperty("/HODMail"));
					this.getModel("ctx").setProperty("/NextApproverRole", "HOD");
				} else if (appdata[WFstepcount] === "DIRECTOR") { //Changed by Dhanush M V on 22.02.2022 (replaced 'sWorkflowStep' with 'WFstepcount' )
					this.getModel("ctx").setProperty("/NextApproverName", this.getModel("ctx").getProperty("/DirectorApproverDisplay"));
					this.getModel("ctx").setProperty("/NextApproverMail", this.getModel("ctx").getProperty("/DirectorMail"));
					this.getModel("ctx").setProperty("/NextApproverRole", "DIRECTOR");
				} else if (appdata[WFstepcount] === "VP") { //Changed by Dhanush M V on 22.02.2022 (replaced 'sWorkflowStep' with 'WFstepcount' )
					this.getModel("ctx").setProperty("/NextApproverName", this.getModel("ctx").getProperty("/VPApproverDisplay"));
					this.getModel("ctx").setProperty("/NextApproverMail", this.getModel("ctx").getProperty("/VPMail"));
					this.getModel("ctx").setProperty("/NextApproverRole", "VP");
				} else if (appdata[WFstepcount] === "CFO") { //Changed by Dhanush M V on 22.02.2022 (replaced 'sWorkflowStep' with 'WFstepcount' )
					this.getModel("ctx").setProperty("/NextApproverName", this.getModel("ctx").getProperty("/CFOApproverDisplay"));
					this.getModel("ctx").setProperty("/NextApproverMail", this.getModel("ctx").getProperty("/CFOMail"));
					this.getModel("ctx").setProperty("/NextApproverRole", "CFO");
				} else if (appdata[WFstepcount] === "MD1") { //Changed by Dhanush M V on 22.02.2022 (replaced 'sWorkflowStep' with 'WFstepcount' )
					this.getModel("ctx").setProperty("/NextApproverName", this.getModel("ctx").getProperty("/MD1ApproverDisplay"));
					this.getModel("ctx").setProperty("/NextApproverMail", this.getModel("ctx").getProperty("/MD1Mail"));
					this.getModel("ctx").setProperty("/NextApproverRole", "MD1");
				} else if (appdata[WFstepcount] === "MD2") { //Changed by Dhanush M V on 22.02.2022 (replaced 'sWorkflowStep' with 'WFstepcount' )
					this.getModel("ctx").setProperty("/NextApproverName", this.getModel("ctx").getProperty("/MD2ApproverDisplay"));
					this.getModel("ctx").setProperty("/NextApproverMail", this.getModel("ctx").getProperty("/MD2Mail"));
					this.getModel("ctx").setProperty("/NextApproverRole", "MD2");
				} else if (appdata[WFstepcount] === "CEO") { //Changed by Dhanush M V on 22.02.2022 (replaced 'sWorkflowStep' with 'WFstepcount' )
					this.getModel("ctx").setProperty("/NextApproverName", this.getModel("ctx").getProperty("/CEOApproverDisplay"));
					this.getModel("ctx").setProperty("/NextApproverMail", this.getModel("ctx").getProperty("/CEOMail"));
					this.getModel("ctx").setProperty("/NextApproverRole", "CEO");
				} else if (appdata.length === sWorkflowStep) {
					if (this.getModel("ctx").getData().type === "OC") {
						this.getModel("ctx").setProperty("/NextApproverName", "Ind. Procurement");
						this.getModel("ctx").setProperty("/NextApproverMail", "emea.central.purchasing@goodbabyint.com");
						this.getModel("ctx").setProperty("/NextApproverRole", "PROCUREMENT");
					} else if (this.getModel("ctx").getData().type === "IV") {
						this.getModel("ctx").setProperty("/NextApproverName", "EMEA Central Finance");
						this.getModel("ctx").setProperty("/NextApproverMail", "emea.central.finance@goodbabyint.com");
						this.getModel("ctx").setProperty("/NextApproverRole", "ACCOUNTING");
					}
				} else if (this.getModel("ctx").getProperty("/workflowStep") === 9) {
					this.getModel("ctx").setProperty("/NextApproverName", "Ind. Procurement");
					this.getModel("ctx").setProperty("/NextApproverMail", "emea.central.purchasing@goodbabyint.com");
					this.getModel("ctx").setProperty("/NextApproverRole", "PROCUREMENT");
				}
			} else if (this.getModel("ctx").getData().isForwarding === true) {
				if (this.getModel("ctx").getData().isForwardingToRequester === true) {
					this.getModel("ctx").setProperty("/NextApproverName", this.getModel("ctx").getProperty("/requesterName"));
					this.getModel("ctx").setProperty("/NextApproverMail", this.getModel("ctx").getProperty("/requester"));
					this.getModel("ctx").setProperty("/NextApproverRole", "REQUESTER");
				} else if (this.getModel("ctx").getData().isForwardingToPJM === true) { // added on feb2022
					this.getModel("ctx").setProperty("/NextApproverName", this.getModel("ctx").getProperty("/PJMApproverDisplay"));
					this.getModel("ctx").setProperty("/NextApproverMail", this.getModel("ctx").getProperty("/PJMMail"));
					this.getModel("ctx").setProperty("/NextApproverRole", "PJM");
				} else if (this.getModel("ctx").getData().isForwardingToHOD === true) {
					this.getModel("ctx").setProperty("/NextApproverName", this.getModel("ctx").getProperty("/HODApproverDisplay"));
					this.getModel("ctx").setProperty("/NextApproverMail", this.getModel("ctx").getProperty("/HODMail"));
					this.getModel("ctx").setProperty("/NextApproverRole", "HOD");
				} else if (this.getModel("ctx").getData().isForwardingToVP === true) {
					this.getModel("ctx").setProperty("/NextApproverName", this.getModel("ctx").getProperty("/VPApproverDisplay"));
					this.getModel("ctx").setProperty("/NextApproverMail", this.getModel("ctx").getProperty("/VPMail"));
					this.getModel("ctx").setProperty("/NextApproverRole", "VP");
				} else if (this.getModel("ctx").getData().isForwardingToDIR === true) {
					this.getModel("ctx").setProperty("/NextApproverName", this.getModel("ctx").getProperty("/DirectorApproverDisplay"));
					this.getModel("ctx").setProperty("/NextApproverMail", this.getModel("ctx").getProperty("/DirectorMail"));
					this.getModel("ctx").setProperty("/NextApproverRole", "DIRECTOR");
				} else if (this.getModel("ctx").getData().isForwardingToCFO === true) {
					this.getModel("ctx").setProperty("/NextApproverName", this.getModel("ctx").getProperty("/CFOApproverDisplay"));
					this.getModel("ctx").setProperty("/NextApproverMail", this.getModel("ctx").getProperty("/CFOMail"));
					this.getModel("ctx").setProperty("/NextApproverRole", "CFO");
				} else if (this.getModel("ctx").getData().isForwardingToMD1 === true) {
					this.getModel("ctx").setProperty("/NextApproverName", this.getModel("ctx").getProperty("/MD1ApproverDisplay"));
					this.getModel("ctx").setProperty("/NextApproverMail", this.getModel("ctx").getProperty("/MD1Mail"));
					this.getModel("ctx").setProperty("/NextApproverRole", "MD1");
				} else if (this.getModel("ctx").getData().isForwardingToMD2 === true) {
					this.getModel("ctx").setProperty("/NextApproverName", this.getModel("ctx").getProperty("/MD2ApproverDisplay"));
					this.getModel("ctx").setProperty("/NextApproverMail", this.getModel("ctx").getProperty("/MD2Mail"));
					this.getModel("ctx").setProperty("/NextApproverRole", "MD2");
				} else if (this.getModel("ctx").getData().isForwardingToCEO === true) {
					this.getModel("ctx").setProperty("/NextApproverName", this.getModel("ctx").getProperty("/CEOApproverDisplay"));
					this.getModel("ctx").setProperty("/NextApproverMail", this.getModel("ctx").getProperty("/CEOMail"));
					this.getModel("ctx").setProperty("/NextApproverRole", "CEO");
				}
			}

			//Ended by Dhanush 

			var sApprover = oModel.getProperty("/invoiceApprover") !== undefined ? oModel.getProperty("/invoiceApprover") : oModel.getProperty(
				"/requester");
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
				"to_PurchaseItem": oModel.getProperty("/position/data")
					.filter(function (row) {
						return (row.Quantity !== undefined && row.Quantity !== null && row.Supplier !== null);
					}).map(function (row) {
						var newEntry = new Object();
						newEntry.Amount = row.Amount.toString();
						newEntry.Currency = row.Currency;
						newEntry.Delivery = row.Delivery;
						newEntry.Description = row.Description;
						newEntry.GlAccount = row.GlAccount;
						newEntry.GlAccountDisplay = row.GlAccountDisplay;
						newEntry.PositionNum = row.PositionNum;
						newEntry.Quantity = row.Quantity.toString();
						newEntry.Supplier = row.Supplier;
						newEntry.SupplierDisplay = row.SupplierDisplay;
						newEntry.TotalAmount = row.TotalAmount.toString();
						newEntry.UnitDisplay = row.UnitDisplay;
						newEntry.UnitMeasure = row.UnitMeasure;
						return newEntry;
					})
			};

			oModel.setData({
				PurchaseRequisition: oHead
			}, true);
			//data for status report
			var sZstatus1 = "Closed";
			var sZstatus2 = "Open";

			if (!approvalStatus) {
				sZstatus1 = "Closed";
				sZstatus2 = "Rejected";
			}
			if (sWorkflowStep === 9 && oModel.getProperty("/isApproved") === true) {
				var assetarray = oModel.getData().PurchaseRequisition.to_PurchaseItem;
				var assetarraylength = assetarray.length;
				var oThis = this;
				if (oModel.getData().type === "IV") {
					for (var a = 0; a < assetarraylength; a++) {
						if (assetarray[a].AssetNumber === undefined || assetarray[a].AssetNumber === "" || assetarray[a].AssetNumber === null) {
							var Adialog = new Dialog({
								title: "Error",
								type: "Message",
								state: "Error",
								content: new Text({
									text: "Please fill the asset number in each row."
								}),
								beginButton: new Button({
									text: "OK",
									press: function () {
										// oThis._bindAssetSelectBox();
										Adialog.close();
									}
								}),
								afterClose: function () {
									Adialog.destroy();
								}
							});
							Adialog.open();
							// sap.m.MessageToast.show("Please fill the asset number in each row.")
							return;
						}
					}
				}
			}
			this.getModel("ctx").setProperty("/accountAssignments", undefined);
			this.getModel("ctx").setProperty("/assetNumbers", undefined);
			//setStatus Data
			//var oStatusData = oModel.getProperty("/oStatusData");
			this.getAttachments();
			var oStatusData = {};
			if (sWorkflowStep === 0 && oModel.getProperty("/edit") === true) {
				this.getModel("ctx").getData().oStatusData.to_position = [];
				oStatusData = {
					"ReqId": oModel.getProperty("/bucketId"),
					"RequesterID": oModel.getProperty("/requester"),
					"ReqBy": oModel.getProperty("/requesterName"),
					"WfType": "Purchase",
					"WFInstance": oModel.getProperty("/oStatusData").WFInstance,
					"CompCd": oModel.getProperty("/legalEntity"),
					"CompTxt": oModel.getProperty("/legalEntityDisplayName"),
					"CostCt": oModel.getProperty("/costCenter"),
					"PurOrg": oModel.getProperty("/purchasingOrganization"),
					"ReqTyp": oModel.getProperty("/typeDisplay"),
					"PurTyp": oModel.getProperty("/prTypeDisplay"),
					"IntOrd": oModel.getProperty("/sInternalOrder"),
					"ReqEmail": oModel.getProperty("/requesterEmail"),
					"ReqBudYr1": oModel.getProperty("/requestedBudgetThisYear").toString(),
					"ReqBudYr2": oModel.getProperty("/requestedBudgetNextYear").toString(),
					"Zplant": oModel.getProperty("/plant"),
					"Zprcomments": oModel.getProperty("/sCommentHistory"),
					"Zstatus1": "Open",
					"ReqDt": oModel.getProperty("/oStatusData").ReqDt,
					"Zappr": oModel.getProperty("/NextApproverName"), // Added bby Dhanush
					"Zappr_email": oModel.getProperty("/NextApproverMail"), // Added bby Dhanush
					"Short_Text": oModel.getProperty("/ShortText"),
					"Zcurr": oModel.getProperty("/currencyCode"),
					// "Zappr_role": oModel.getProperty("/NextApproverRole"), // Added bby Dhanush
					"URL": oModel.getProperty("/sAttachmentLinks"),
					"to_position": oModel.getProperty("/position/data").filter(function (row) {
						return (row.Quantity !== undefined && row.Quantity !== null && row.Supplier !== null && row.GlAcct !== undefined);
					}).map(function (row) {
						// var aDelDt = row.Delivery.split("-");
						// var oDelDt = aDelDt[2]+"-"+aDelDt[1]+"-"+aDelDt[0];
						var newEntry = new Object();
						newEntry.ReqId = oModel.getProperty("/bucketId");
						newEntry.PoItem = row.PositionNum.toString();
						newEntry.PoDec = row.Description;
						newEntry.Zsup = row.Supplier;
						newEntry.Zdeldt = row.Delivery;
						newEntry.GlAcct = row.GlAccount;
						newEntry.Zqty = row.Quantity.toString();
						newEntry.Zcurr = row.Currency;
						newEntry.Zamt = row.TotalAmount.toString();
						newEntry.Zuom = row.UnitMeasure;
						return newEntry;
					})
				};
			} else {
				oStatusData = {
					"Zappr": oModel.getProperty("/NextApproverName"),
					"Zappr_email": oModel.getProperty("/NextApproverMail"),
					// "Zappr_role": oModel.getProperty("/NextApproverRole"),
					"Zprcomments": oModel.getProperty("/sCommentHistory"),
					"URL": oModel.getProperty("/sAttachmentLinks"),
					// "Zstatus1": "Open"
				};
			}
			// Added by Dhanush
			// var approveset = 0;
			var data = this.getModel("ctx").getData();

			if (oModel.getProperty("/NextApproverRole") === "MD1" || oModel.getProperty("/NextApproverRole") === "MD2") {
				oStatusData.Zappr_role = "MD";
			} else {
				oStatusData.Zappr_role = oModel.getProperty("/NextApproverRole");
			}

			if (oModel.getProperty("/isApproved") === true) {
				if (data.workflowStep === 8) {
					oStatusData.Zstatus1 = "Closed";
					oStatusData.Zstatus2 = "Approved";
					oStatusData.PurOrd = oModel.getProperty("/purchaseOrderResult").d.RequisitionNumber;
				} else {
					oStatusData.Zstatus1 = "Open";
				}
			}
			if (oModel.getProperty("/isApproved") === false) {
				oStatusData.Zstatus1 = "Closed";
				oStatusData.Zstatus2 = "Rejected";
			}
			if (oModel.getProperty("/isForwarding") === true) {
				oStatusData.Zstatus1 = "Open";
				// oStatusData.Zstatus2 = "";
			}

			// if(approveset===data.workflowStep){
			// 	oStatusData.Zstatus1 = "Closed";
			// }
			// else 

			// Ended by Dhanush
			oModel.setData({
				oStatusData: oStatusData
			}, true);

			if (sWorkflowStep == 0 && (oModel.getProperty("/requester") === undefined || oModel.getProperty("/requesterEmail") === undefined ||
					oModel.getProperty("/legalEntity") === undefined || oModel.getProperty("/costCenter") === undefined || oModel.getProperty(
						"/plant") === undefined || oModel.getProperty("/sInternalOrder") === undefined || oModel.getProperty("/Name") === undefined ||
					oModel.getProperty("/Street1") === undefined || oModel.getProperty("/City") === undefined || oModel.getProperty("/CountryName") ===
					undefined || oModel.getProperty("/invoiceApprover") === undefined)) {
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
				// var oContext = this.getModel("ctx").getData();
				// Added by Dhanush
				if (oModel.getProperty("/edit") === true) {
					var oForwardingUsers = oModel.getProperty("/oForwardingUsers");
					var aForwardingConcat = oForwardingUsers.concat(this._aForwardingUsers);
					oModel.setData({
						oForwardingUsers: aForwardingConcat
					}, true);
				}
				var oContext = this.getModel("ctx").getData();
				var reqid = oModel.oData.bucketId;
				var oModelTest = this.getModel("test");
				if (oModel.getProperty("/edit") === true) {
					var opath = "/WfRequestSet";
					oModelTest.create(opath, oStatusData, {
						success: function (oData, oResponse) {},
						error: function (err) {

						}
					});
				} else {
					var path = "/WfRequestSet(ReqId='" + reqid + "')";
					oModelTest.update(path, oStatusData, {
						success: function (oData, oResponse) {

						},
						error: function (err) {

						}
					});
				}
				// Ended by Dhanush

				$.ajax({
					url: "/bpmworkflowruntime/rest/v1/xsrf-token",
					method: "GET",
					headers: {
						"X-CSRF-Token": "Fetch"
					},
					success: function (result, xhr, data) {
						var token = data.getResponseHeader("X-CSRF-Token");
						var dataText = JSON.stringify({
							status: "COMPLETED",
							context: oContext
						});

						$.ajax({
							url: "/bpmworkflowruntime/rest/v1/task-instances/" + taskId,
							method: "PATCH",
							contentType: "application/json",
							data: dataText,
							headers: {
								"X-CSRF-Token": token
							},
							success: refreshTask
						});
					}
				});
			}
		},

		// Request Inbox to refresh the control
		// once the task is completed
		_refreshTask: function () {
			var taskId = this.getComponentData().startupParameters.taskModel.getData().InstanceID;
			this.getComponentData().startupParameters.inboxAPI.updateTask("NA", taskId);
		}
	});
});