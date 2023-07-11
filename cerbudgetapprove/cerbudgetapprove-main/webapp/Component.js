sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"./model/models",
	"sap/m/Button",
	"sap/m/Dialog",
	"sap/m/Text",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter"
], function (UIComponent, JSONModel, Device, models, Button, Dialog, Text, Filter, FilterOperator, Sorter) {
	"use strict";

	return UIComponent.extend("gb.wf.cer.budget.approve.Component", {

		_sCommentHistory: undefined,
		_isForwarding: undefined,

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			console.log("in init");
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
            var dLoadModel = new sap.ui.model.json.JSONModel({"dataLoaded":false});
			this.setModel(dLoadModel, "dLoadModel");
			// get task data
			var oComponentData = this.getComponentData();
			if (oComponentData) {
				// only available in workflow process!!!
				var startupParameters = this.getComponentData().startupParameters;
				var taskModel = startupParameters.taskModel;
				var taskData = taskModel.getData();
				var taskId = taskData.InstanceID;

				// read process context & bind it to
				// the view's model
				var that = this;
				var contextModel = this.getModel("ctx");

				//contextModel.loadData("/bpmworkflowruntime/rest/v1/task-instances/" + taskId + "/context").then(function() {
				var contextModel = new JSONModel("/bpmworkflowruntime/rest/v1/task-instances/" + taskId + "/context");
				var contextData = contextModel.getData();
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
					}
					this._isForwarding = contextModel.getProperty("/isForwarding");
					//ANFANG NEU
					// Reject
					var oNegativeAction = {
						sBtnTxt: "Reject",
						onBtnPressed: function () {
							/*	that._triggerComplete(
									that.oComponentData.inboxHandle.attachmentHandle.detailModel.getData().InstanceID,
									false,
									jQuery.proxy(that._refreshTask, that)
								);
							*/
							that._handleNegativeAction(
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
							/*	that._triggerComplete(
									that.oComponentData.inboxHandle.attachmentHandle.detailModel.getData().InstanceID,
									true,
									jQuery.proxy(that._refreshTask, that)
								);
							*/
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

					startupParameters.inboxAPI.addAction({
							action: oNegativeAction.sBtnTxt,
							label: oNegativeAction.sBtnTxt,
							type: "Reject"
						},
						oNegativeAction.onBtnPressed
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
					//ENDE NEU
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
							that.getModel("dLoadModel").setProperty("/dataLoaded",true);
						})
						.fail(
							function (errorText) {
								jQuery.sap.require("sap.m.MessageBox");
								sap.m.MessageBox.error(errorText, {
									title: "Error"
								});
							}
						);

				});

				//contextModel.setProperty("/createdOn",taskData.CreatedOn.ToDateString());
				contextModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
				console.log("set ctx model");
				this.setModel(contextModel, "ctx");
				console.log("CTX");
				console.log(contextModel);

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

								startupParameters.inboxAPI.addAction({
										action: oNegativeAction.sBtnTxt,
										label: oNegativeAction.sBtnTxt,
										type: "Reject"
									},
									oNegativeAction.onBtnPressed
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
				*/
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
				this.setModel(contextModel, "ctx");
			}
			// eof worflow init

			//Start by Anupam
			var pjmModel = new sap.ui.model.json.JSONModel();
			this.setModel(pjmModel, "ZGB_CDS_PJMAPPR");

			var ApproverModel = new sap.ui.model.json.JSONModel();
			this.setModel(ApproverModel, "approverlistModel");

			var RangeModel = new sap.ui.model.json.JSONModel();
			this.setModel(RangeModel, "rangelistModel");
			this.approverList();

			// redundant!!!
		},
		approverList: function () {
			var oThis = this;
			//var oDataModel = this.getModel("approval");  // commenetd by deeksha 25/1/2022
			var oDataModel = this.getModel("test");
			var apptype = "Budget";
			//var path = "/zgb_cds_wf_approval(im_type='" + apptype + "')/Set"; // commenetd by deeksha 25/1/2022
			//	var path = "/WfApproval_ControlSet?$filter=WorkflowType eq 'Budget'";
			var aFilter = [];
			aFilter.push(new Filter("WorkflowType", FilterOperator.EQ, "Budget"));
			var path = "/WfApproval_ControlSet";
			oDataModel.read(path, {
				filters: aFilter,
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
			// var path = "/Zgb_cds_wf_range?$orderby=APP_LEVEL";
			var path = "/Zgb_cds_wf_range";
			oDataModel.read(path, {
				sorters: [new Sorter("APP_LEVEL", false)],
				success: function (oData, oResponse) {
					var data = oData.results;
					oThis.getModel("rangelistModel").setData(data);
					oThis.onPjmData();
				},
				error: function (err) {

				}
			});
		},

		onPjmData: function () {

			var pjmAppr = "/ZGB_CDS_PJMAPPR";
			var that = this;
			var oDataModel = this.getModel("test");
			oDataModel.read(pjmAppr, {
				success: function (oData, oResponse) {
					that.getModel("ZGB_CDS_PJMAPPR").setData(oData);
					//that.getView().setModel(oData, "ZGB_CDS_PJMAPPR");
				}
			});

		},

		_handleNegativeAction: function (taskId, approvalStatus, refreshTask) {
			var oModel = this.getModel("ctx");
			if (oModel.getProperty("/isForwarderSelected") === true) {
				var dialog = new Dialog({
					title: "Error",
					type: "Message",
					state: "Error",
					content: new Text({
						text: "You have selected the forwarding user, hence reject action is not possible."
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
			oModel.setProperty("/isForwarding", false);
			this._triggerComplete(taskId, approvalStatus, refreshTask);
		},

		_handlePositiveAction: function (taskId, approvalStatus, refreshTask) {
			if (this.getModel("Qtycheck").getProperty("/Qtycheck") === false) {
				sap.m.MessageToast.show("Please enter the valid amount");
				return;
			} else {
				var oModel = this.getModel("ctx");
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
				this.internalOrdValidation(taskId, approvalStatus, refreshTask);

				// if(	sValidFlag ==="allowed")
				// {
				// oModel.setProperty("/isForwarding", false);
				// oModel.setProperty("/isForwardingToRequester", false);
				// oModel.setProperty("/isForwardingToVP", false);
				// oModel.setProperty("/isForwardingToCC", false);
				// oModel.setProperty("/isForwardingToCFO", false);
				// oModel.setProperty("/isForwardingToMD1", false);
				// oModel.setProperty("/isForwardingToMD2", false);
				// this._triggerComplete(taskId, approvalStatus, refreshTask);
				// }
			}
		},

		_handleAdditionalAction: function (taskId, approvalStatus, refreshTask) {
			this.getModel("ctx").setProperty("/isForwarding", true);
			this._triggerComplete(taskId, approvalStatus, refreshTask);
		},

		getAttachmentsForMail: function () {
			var oFileModel = this.getModel("filebucketservice");
			var sAttachementUrls = "";
			var sAttachmentId;
			for (var file in oFileModel.oData) {
				sAttachmentId = file.split("\'")[1];
				//sAttachementUrls = sAttachementUrls + "https://cerrepoaccesstw72h2gxnz.eu2.hana.ondemand.com/FileBucketProvider/get?id=" + // bi0brchgc3
				sAttachementUrls = sAttachementUrls + "https://cerrepoaccessbi0brchgc3.eu2.hana.ondemand.com/FileBucketProvider/get?id=" +

					sAttachmentId + "\n";
			}
			if (sAttachementUrls === undefined || sAttachementUrls.length < 1) {
				sAttachementUrls = "-----";
			}

			console.log(sAttachementUrls);
			this.getModel("ctx").setProperty("/sAttachementUrls", sAttachementUrls);
		},

		getAttachmentsForStatusReport: function () {
			var oFileModel = this.getModel("filebucketservice");
			var sAttachementUrls = "";
			var sAttachmentId;
			for (var file in oFileModel.oData) {
				sAttachmentId = file.split("\'")[1];
				sAttachementUrls = sAttachementUrls + "https://cerrepoaccesstw72h2gxnz.eu2.hana.ondemand.com/FileBucketProvider/get?id=" + // bi0brchgc3
					//sAttachementUrls = sAttachementUrls + "https://cerrepoaccessbi0brchgc3.eu2.hana.ondemand.com/FileBucketProvider/get?id=" +

					sAttachmentId + "#";
			}
			if (sAttachementUrls !== undefined && sAttachementUrls.length > 0) {
				sAttachementUrls = sAttachementUrls.substring(0, sAttachementUrls.length - 1); // bei letzem Eintrag # entfernen

			} else {
				sAttachementUrls = "-----";
			}

			console.log(sAttachementUrls);
			this.getModel("ctx").setProperty("/sAttachmentLinks", sAttachementUrls);
		},

		internalOrdValidation: function (taskId, approvalStatus, refreshTask) {
			var allowed;
			var model = this.getModel("ctx").getData();
			var internalOrder = model.internalOrder;
			var legalEntity = model.legalEntity;
			var sInternal = this.byId("internalOrderComboBox");
			var costCenter = model.costCenter;
			var type = model.type;
			if (legalEntity !== "" && costCenter !== "") {
				var aFilter = [];
				aFilter.push(new Filter("CompanyCode", FilterOperator.EQ, legalEntity));
				aFilter.push(new Filter("CostCenter", FilterOperator.EQ, costCenter));
				aFilter.push(new Filter("ObjectClass", FilterOperator.EQ, type));
			}
			var tpath = "/InternalOrder";
			var oThis = this;
			var oDataModel = this.getModel("test");
			var oInternalModel = new sap.ui.model.json.JSONModel();
			this.setModel(oInternalModel, "InternalOrder");
			var oInternal = this.getModel("InternalOrder");
			oInternal.setData("");
			oDataModel.read(tpath, {
				filters: aFilter,
				success: function (oData, oResponse) {
					var oUserObject = {};
					oUserObject.Internal = oData.results;
					oInternal.setData(oUserObject);
					oThis.setModel(oInternal, "IternalOrder");
					var oDataInternal = oThis.getModel("InternalOrder").getData().Internal;
					var oDataIntLength = oThis.getModel("InternalOrder").getData().Internal.length;
					for (var i = 0; i < oDataIntLength; i++) {
						if (internalOrder === oDataInternal[i].OrderNumber) {
							var status = oDataInternal[i].SystemStatus;
							if (status === "LKD" || status === "CLSD") {
								allowed = false;
								var erDialog = new Dialog({
									title: "Error",
									type: "Message",
									state: "Error",
									content: new Text({
										text: "This 'Internal Order' is in 'Closed' or 'Locked' status, hence you cannot able to create order for this request."
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

								//return ;
							} else {
								allowed = true;

								// return allowed ;
							}
						}
					}
					if (allowed) {
						var oCTModel = oThis.getModel("ctx");
						// sInternal.setValueState("None");
						oCTModel.setProperty("/isForwarding", false);
						oCTModel.setProperty("/isForwardingToRequester", false);
						oCTModel.setProperty("/isForwardingToVP", false);
						oCTModel.setProperty("/isForwardingToCC", false);
						oCTModel.setProperty("/isForwardingToCFO", false);
						oCTModel.setProperty("/isForwardingToMD1", false);
						oCTModel.setProperty("/isForwardingToMD2", false);
						oThis._triggerComplete(taskId, approvalStatus, refreshTask);
					}
				},
				error: function (err) {
					console.log(err); //disable Button next
				}
			});
			//return allowed;

			// if(allowed===false){
			// 	return;
			// }

		},

		// This method is called when the
		// confirm button is click by the end
		// user
		_triggerComplete: function (taskId, approvalStatus, refreshTask) {

			this.getAttachmentsForStatusReport();
			this.getAttachmentsForMail();
			var oModel = this.getModel("ctx");
			//			oModel.setProperty("/isForwarding", false);
			oModel.setProperty("/isApproved", approvalStatus);
			oModel.setProperty("/nextApprover", oModel.getProperty("/selectedNextApprover"));
			oModel.setProperty("/selectedNextApprover", null);
			oModel.setProperty("/oInternalOrder/WorkflowId", taskId);
			oModel.setProperty("/oInternalOrder/WorkflowId", oModel.getData().oStatusData.WFInstance);
			var workflowStep = oModel.getProperty("/workflowStep");
			var defaultComment = "---";
			if (oModel.getProperty("/defaultComment") !== null && oModel.getProperty("/defaultComment") !== undefined) {
				defaultComment = oModel.getProperty("/defaultComment");
			}
			var isApproverChanged = oModel.getProperty("/isApproverChanged");
			var isShowApprovers = oModel.getProperty("/showApprovers");
			var isForwarding = this.getModel("ctx").getProperty("/isForwarding");
			var isForwarderSelected = this.getModel("ctx").getProperty("/isForwarderSelected");

			if (approvalStatus === true //Button "Forwarding is pressed, and a user <> "----" is selected in the select controll, so the task can be forwarded to the selected user"
				&& isForwarding != undefined && isForwarding == true && this.getModel("ctx").getProperty("/forwardedToApprover") != undefined &&
				this.getModel("ctx").getProperty("/forwardedToApprover") != "-----") {
				//	var oModel = this.getModel("ctx");
				var sForwardToApprover = oModel.getProperty("/forwardedToApprover");
				var sForwardToApproverId = sForwardToApprover.split('_')[0];
				var sRole = sForwardToApprover.split("_")[1];
				oModel.setProperty("/forwardedToLevel", sRole);
				oModel.setProperty("/forwardedToApprover", sForwardToApproverId);
				oModel.setProperty("/nextApprover", oModel.getProperty("/forwardedToApprover"));
				oModel.setProperty("/forwardedToApprover", null);
				oModel.setProperty("/isForwarderSelected", null);
				//fwdUser auf WF-user umsetzen
				var sForwardToRole = this.getModel("ctx").getProperty("/forwardToRole");
				if (sForwardToRole === 'REQUESTER') {
					oModel.setProperty("/reqMail", oModel.getProperty("/fwdReqMail"));
					oModel.setProperty("/reqApproverId", oModel.getProperty("/fwdReqId"));
					oModel.setProperty("/reqApprover", oModel.getProperty("/fwdReqApprover"));
				} else if (sForwardToRole === 'VP') {
					oModel.setProperty("/vpMail", oModel.getProperty("/fwdVPMail"));
					oModel.setProperty("/vpApproverId", oModel.getProperty("/fwdVPId"));
					oModel.setProperty("/vpApprover", oModel.getProperty("/fwdVPApprover"));
				} else if (sForwardToRole === 'CONTROLLING') {
					oModel.setProperty("/ccMail", oModel.getProperty("/fwdCCMail"));
					oModel.setProperty("/ccApproverId", oModel.getProperty("/fwdCCId"));
					oModel.setProperty("/ccApprover", oModel.getProperty("/fwdCCApprover"));
				} else if (sForwardToRole === 'CFO') {
					oModel.setProperty("/cfoMail", oModel.getProperty("/fwdCFOMail"));
					oModel.setProperty("/cfoApproverId", oModel.getProperty("/fwdCFOId"));
					oModel.setProperty("/cfoApprover", oModel.getProperty("/fwdCFOApprover"));
				} else if (sForwardToRole === 'MD1') {
					oModel.setProperty("/md1Mail", oModel.getProperty("/fwdMD1Mail"));
					oModel.setProperty("/md1ApproverId", oModel.getProperty("/fwdMD1Id"));
					oModel.setProperty("/md1Approver", oModel.getProperty("/fwdMD1Approver"));
				} else if (sForwardToRole === 'MD2') {
					oModel.setProperty("/md2Mail", oModel.getProperty("/fwdMD2Mail"));
					oModel.setProperty("/md2ApproverId", oModel.getProperty("/fwdMD2Id"));
					oModel.setProperty("/md2Approver", oModel.getProperty("/fwdMD2Approver"));
				} else if (sForwardToRole === 'CEO') {
					oModel.setProperty("/ceoMail", oModel.getProperty("/fwdCEOMail"));
					oModel.setProperty("/ceoApproverId", oModel.getProperty("/fwdCEOId"));
					oModel.setProperty("/ceoApprover", oModel.getProperty("/fwdCEOApprover"));
				}
			}
			if (approvalStatus === true && isForwarding === true && (isForwarderSelected === null || isForwarderSelected === undefined ||
					isForwarderSelected !== true)) { //(isApproverChanged === null || isApproverChanged === false || isApproverChanged === undefined)) {
				var dialog = new Dialog({
					title: "Error",
					type: "Message",
					state: "Error",
					content: new Text({
						text: "Please select an user to forward to!"
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
				this.getModel("ctx").setProperty("/isApproverChanged", false);
				this.getModel("ctx").setProperty("/isForwarding", false);
			} else if (approvalStatus === true && isShowApprovers === true && isForwarding === false && (isApproverChanged === null ||
					isApproverChanged === false || isApproverChanged === undefined)) {
				var dialog = new Dialog({
					title: "Error",
					type: "Message",
					state: "Error",
					content: new Text({
						text: "Please select an approver!"
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
				this.getModel("ctx").setProperty("/isForwarderSelected", false);
				this.getModel("ctx").setProperty("/forwardedToApprover", null);
			} else if (approvalStatus === false && defaultComment === undefined) {
				var dialog = new Dialog({
					title: "Error",
					type: "Message",
					state: "Error",
					content: new Text({
						text: "The comment field can not be empty!"
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
				this.getModel("ctx").setProperty("/accountAssignments", null);
				this.getModel("ctx").setProperty("/assetNumbers", null);
				var oContext = this.getModel("ctx").getData();
				var sComment = this.getModel("ctx").getProperty("/defaultComment");
				this.getModel("ctx").setProperty("/declineComment", sComment);
				this.getModel("ctx").setProperty("/defaultComment", undefined);
				this.getModel("ctx").setProperty("/isApproverChanged", false);

				// var sUserFullname = new sap.ushell.services.UserInfo().getUser().getFullName();
				var sUserFullname = new sap.ushell.Container.getService("UserInfo").getUser().getFullName();
				// var sUserId = new sap.ushell.services.UserInfo().getUser().getId().toLowerCase();
				var sUserId = new sap.ushell.Container.getService("UserInfo").getUser().getId().toLowerCase();
				// var sUserEmail = new sap.ushell.services.UserInfo().getUser().getEmail();
				var sUserEmail = new sap.ushell.Container.getService("UserInfo").getUser().getEmail();
				var aSplits = sUserId.split("@");
				var sRequesterId = aSplits[0] + "@" + aSplits[1].toUpperCase();

				var sRole = "";
				this._sCommentHistory = "";
				var sCommentText = "-----";
				if (this.getModel("ctx").getProperty("/sCommentHistory") !== undefined) {
					this._sCommentHistory = this.getModel("ctx").getProperty("/sCommentHistory");
				}
				var oDate = new Date(Date.now());
				var options = {
					month: '2-digit',
					day: '2-digit',
					year: 'numeric',
					hour: 'numeric',
					minute: 'numeric',
					second: 'numeric'
				};

				if (workflowStep == 1) { //requester
					sRole = "Requester";
					if (sUserId !== this.getModel("ctx").getProperty("/vpApproverId")) {
						this.getModel("ctx").setProperty("/reqApprover", sUserFullname);
					}
					if (this.getModel("ctx").getProperty("/reqComment") !== undefined && this.getModel("ctx").getProperty("/reqComment") !== null &&
						approvalStatus == true) {
						sCommentText = this.getModel("ctx").getProperty("/reqComment");
					}
					//this._sCommentHistory = this._sCommentHistory + oDate.toLocaleString('de-DE')+", "+sRole+" "+sUserFullname+": "+sCommentText+ "\n";
					this._sCommentHistory = this._sCommentHistory + oDate.toLocaleString('de-DE', options) + ", " + sRole + " " + sUserFullname +
						": " + defaultComment + "\n";
				} else if (workflowStep == 2) { //vp
					if (this.getModel("ctx").getProperty("/nextApproverPjm") !== undefined) {
						sRole = "PJM";
					} else if (this.getModel("ctx").getProperty("/nextApproverVp") !== undefined) {
						sRole = "VP";
					}
					if (sUserId !== this.getModel("ctx").getProperty("/vpApproverId")) {
						this.getModel("ctx").setProperty("/vpApprover", sUserFullname);
					}
					if (this.getModel("ctx").getProperty("/vpComment") !== undefined && this.getModel("ctx").getProperty("/vpComment") !== null) {
						sCommentText = this.getModel("ctx").getProperty("/vpComment");
					}
					if (approvalStatus == true) {
						//this._sCommentHistory = this._sCommentHistory + oDate.toLocaleString('de-DE')+", "+sRole+" "+sUserFullname+": "+sCommentText+ "\n";
						this._sCommentHistory = this._sCommentHistory + oDate.toLocaleString('de-DE', options) + ", " + sRole + " " + sUserFullname +
							": " + defaultComment + "\n";
					}
				} else if (workflowStep == 3) { //cc
					sRole = "Controlling";
					if (sUserId !== this.getModel("ctx").getProperty("/ccApproverId")) {
						this.getModel("ctx").setProperty("/ccApprover", sUserFullname);
					}
					if (this.getModel("ctx").getProperty("/ccComment") !== undefined && this.getModel("ctx").getProperty("/ccComment") !== null) {
						sCommentText = this.getModel("ctx").getProperty("/ccComment");
					}
					if (approvalStatus == true) {
						//this._sCommentHistory = this._sCommentHistory + oDate.toLocaleString('de-DE')+", "+sRole+" "+sUserFullname+": "+sCommentText+ "\n";
						this._sCommentHistory = this._sCommentHistory + oDate.toLocaleString('de-DE', options) + ", " + sRole + " " + sUserFullname +
							": " + defaultComment + "\n";
						console.log("cc", this._sCommentHistory);
					}
				} else if (workflowStep == 4) { //cfo
					sRole = "CFO";
					if (sUserId !== this.getModel("ctx").getProperty("/cfoApproverId")) {
						this.getModel("ctx").setProperty("/cfoApprover", sUserFullname);
					}
					if (this.getModel("ctx").getProperty("/cfoComment") !== undefined && this.getModel("ctx").getProperty("/cfoComment") !== null) {
						sCommentText = this.getModel("ctx").getProperty("/cfoComment");
					}
					if (approvalStatus == true) {
						//this._sCommentHistory = this._sCommentHistory + oDate.toLocaleString('de-DE')+", "+sRole+" "+sUserFullname+": "+sCommentText+ "\n";
						this._sCommentHistory = this._sCommentHistory + oDate.toLocaleString('de-DE', options) + ", " + sRole + " " + sUserFullname +
							": " + defaultComment + "\n";
					}
				} else if (workflowStep == 5) { //md1
					sRole = "MD";
					if (sUserId !== this.getModel("ctx").getProperty("/md1ApproverId")) {
						this.getModel("ctx").setProperty("/md1Approver", sUserFullname);
					}
					if (this.getModel("ctx").getProperty("/md1Comment") !== undefined && this.getModel("ctx").getProperty("/md1Comment") !== null) {
						sCommentText = this.getModel("ctx").getProperty("/md1Comment");
					}
					if (approvalStatus == true) {
						//this._sCommentHistory = this._sCommentHistory + oDate.toLocaleString('de-DE')+", "+sRole+" "+sUserFullname+": "+sCommentText+ "\n";
						this._sCommentHistory = this._sCommentHistory + oDate.toLocaleString('de-DE', options) + ", " + sRole + " " + sUserFullname +
							": " + defaultComment + "\n";
					}
				} else if (workflowStep == 6) { //md2
					sRole = "MD";
					if (sUserId !== this.getModel("ctx").getProperty("/md2ApproverId")) {
						this.getModel("ctx").setProperty("/md2Approver", sUserFullname);
					}
					if (this.getModel("ctx").getProperty("/md2Comment") !== undefined && this.getModel("ctx").getProperty("/md2Comment") !== null) {
						sCommentText = this.getModel("ctx").getProperty("/md2Comment");
					}
					if (approvalStatus == true) {
						//this._sCommentHistory = this._sCommentHistory + oDate.toLocaleString('de-DE')+", "+sRole+" "+sUserFullname+": "+sCommentText+ "\n";
						this._sCommentHistory = this._sCommentHistory + oDate.toLocaleString('de-DE', options) + ", " + sRole + " " + sUserFullname +
							": " + defaultComment + "\n";
					}
				} else if (workflowStep == 7) { //ceo
					sRole = "CEO";
					if (sUserId !== this.getModel("ctx").getProperty("/ceoApproverId")) {
						this.getModel("ctx").setProperty("/ceoApprover", sUserFullname);
					}
					if (this.getModel("ctx").getProperty("/ceoComment") !== undefined && this.getModel("ctx").getProperty("/ceoComment") !== null) {
						sCommentText = this.getModel("ctx").getProperty("/ceoComment");
					}
					if (approvalStatus == true) {
						//this._sCommentHistory = this._sCommentHistory + oDate.toLocaleString('de-DE')+", "+sRole+" "+sUserFullname+": "+sCommentText+ "\n";
						this._sCommentHistory = this._sCommentHistory + oDate.toLocaleString('de-DE', options) + ", " + sRole + " " + sUserFullname +
							": " + defaultComment + "\n";
					}
				}
				if (approvalStatus == false) {
					this._sCommentHistory = this._sCommentHistory + oDate.toLocaleString('de-DE', options) + ", " + sRole + " " + sUserFullname +
						": " + defaultComment + "\n";
				}

				this.getModel("ctx").setProperty("/sCommentHistory", this._sCommentHistory);

				//	oForwardingUsers.push(oForwardingUser);
				//	oModel.setData({oForwardingUser: oForwardingUsers}, true);
				var mailComment = "";

				//				if (this.getModel("ctx").getProperty("/requester") !== undefined && this.getModel("ctx").getProperty("/requester") !== null) {
				//						mailComment = mailComment + "Requester: " + this.getModel("ctx").getProperty("/requester") + "\n";
				//				}

				if (this.getModel("ctx").getProperty("/comment") !== undefined && this.getModel("ctx").getProperty("/comment") !== null) {
					mailComment = mailComment + this.getModel("ctx").getProperty("/comment") + "\n";
				}

				if (this.getModel("ctx").getProperty("/reqApprover") !== undefined && this.getModel("ctx").getProperty("/reqApprover") !== null) {
					mailComment = mailComment + "Reenterd: " + this.getModel("ctx").getProperty("/reqApprover") + "\n";
				}

				if (this.getModel("ctx").getProperty("/reqComment") !== undefined && this.getModel("ctx").getProperty("/reqComment") !== null) {
					mailComment = mailComment + this.getModel("ctx").getProperty("/reqComment") + "\n";
				}

				if (this.getModel("ctx").getProperty("/vpApprover") !== undefined && this.getModel("ctx").getProperty("/vpApprover") !== null) {
					mailComment = mailComment + "VP: " + this.getModel("ctx").getProperty("/vpApprover") + "\n";
				}

				if (this.getModel("ctx").getProperty("/vpComment") !== undefined && this.getModel("ctx").getProperty("/vpComment") !== null) {
					mailComment = mailComment + this.getModel("ctx").getProperty("/vpComment") + "\n";
				}

				if (this.getModel("ctx").getProperty("/ccApprover") !== undefined && this.getModel("ctx").getProperty("/ccApprover") !== null) {
					mailComment = mailComment + "Controlling: " + this.getModel("ctx").getProperty("/ccApprover") + "\n";
				}

				if (this.getModel("ctx").getProperty("/ccComment") !== undefined && this.getModel("ctx").getProperty("/ccComment") !== null) {
					mailComment = mailComment + this.getModel("ctx").getProperty("/ccComment") + "\n";
				}

				if (this.getModel("ctx").getProperty("/cfoApprover") !== undefined && this.getModel("ctx").getProperty("/cfoApprover") !== null) {
					mailComment = mailComment + "CFO: " + this.getModel("ctx").getProperty("/cfoApprover") + "\n";
				}

				if (this.getModel("ctx").getProperty("/cfoComment") !== undefined && this.getModel("ctx").getProperty("/cfoComment") !== null) {
					mailComment = mailComment + this.getModel("ctx").getProperty("/cfoComment") + "\n";
				}

				if (this.getModel("ctx").getProperty("/md1Approver") !== undefined && this.getModel("ctx").getProperty("/md1Approver") !== null) {
					mailComment = mailComment + "MD1: " + this.getModel("ctx").getProperty("/md1Approver") + "\n";
				}

				if (this.getModel("ctx").getProperty("/md1Comment") !== undefined && this.getModel("ctx").getProperty("/md1Comment") !== null) {
					mailComment = mailComment + this.getModel("ctx").getProperty("/md1Comment") + "\n";
				}

				if (this.getModel("ctx").getProperty("/md2Approver") !== undefined && this.getModel("ctx").getProperty("/md2Approver") !== null) {
					mailComment = mailComment + "MD2: " + this.getModel("ctx").getProperty("/md2Approver") + "\n";
				}

				if (this.getModel("ctx").getProperty("/md2Comment") !== undefined && this.getModel("ctx").getProperty("/md2Comment") !== null) {
					mailComment = mailComment + this.getModel("ctx").getProperty("/md2Comment") + "\n";
				}

				if (this.getModel("ctx").getProperty("/ceoApprover") !== undefined && this.getModel("ctx").getProperty("/ceoApprover") !== null) {
					mailComment = mailComment + "CEO: " + this.getModel("ctx").getProperty("/ceoApprover") + "\n";
				}

				if (this.getModel("ctx").getProperty("/ceoComment") !== undefined && this.getModel("ctx").getProperty("/ceoComment") !== null) {
					mailComment = mailComment + this.getModel("ctx").getProperty("/md2Comment") + "\n";
				}

				if (this.getModel("ctx").getProperty("/ceoComment") !== undefined && this.getModel("ctx").getProperty("/ceoComment") !== null) {
					mailComment = mailComment + this.getModel("ctx").getProperty("/md2Comment") + "\n";
				}

				if (this.getModel("ctx").getProperty("/declineComment") !== undefined && this.getModel("ctx").getProperty("/declineComment") !==
					undefined) {
					mailComment = mailComment + this.getModel("ctx").getProperty("/declineComment") + "\n";
				}

				//	this.getModel("ctx").setProperty("/mailComment", mailComment);
				mailComment = this._sCommentHistory;
				this.getModel("ctx").setProperty("/mailComment", this._sCommentHistory);
				this.getModel("ctx").setProperty("/accountAssignments", null);

				// //build data for status report: 
				// var sZstatus1 = "Closed";
				// var sZstatus2 = "Open";

				// if ((!approvalStatus || !this.getModel("ctx").getProperty("/showApprovers")) && isForwarding === false) {
				// 	sZstatus1 = "Closed";
				// 	sZstatus2 = "Rejected";
				// }

				//var sAttachementUrls = this.getAttachmentURLs();
				//var oStatusData = oModel.getProperty("/oStatusData");
				//oStatusData.Zappr = sUserFullname;
				//oStatusData.Zstatus1 = sZstatus1;
				//oStatusData.Zstatus2 = sZstatus2;
				//oStatusData.Zbudcomments = this._sCommentHistory;
				var oStatusData = {};
				// var sNextAppRole = this._getRole(oModel);
				
				//set next approver data to forwarded approver data if no amount change // [FR:987001413]
				if (!oModel.getProperty("/showApprovers") && !isForwarding) {
					this.getModel("ctx").setData({
						"nextApproverName": oModel.getProperty("/iForwardedName"),
						"nextApproverMailAddress": oModel.getProperty("/iForwardedEmail"),
						"nextApproverRole": oModel.getProperty("/iForwardedRole"),
						"approverName": oModel.getProperty("/iForwardedName"),
						"approver": oModel.getProperty("/iForwardedEmail"),
						"approverNameForStatusReport": oModel.getProperty("/iForwardedName"),
						"nextApprover": oModel.getProperty("/iForwardedEmail")
					}, true);
					oContext = this.getModel("ctx").getData();
				}
				//if(oModel.getProperty("/isForwardingToRequester")!== null && oModel.getProperty("/isForwardingToRequester")!== undefined && oModel.getProperty("/isForwardingToRequester")=== true){
				if (oModel.getProperty("/workflowStep") === 1) {

					oStatusData = {
						"CompCd": oModel.getProperty("/legalEntity"),
						"CompTxt": oModel.getProperty("/legalEntityDisplayName"),
						"CostCt": oModel.getProperty("/costCenter"),
						"ReqTyp": oModel.getProperty("/typeDisplayText"),
						"IntOrd": oModel.getProperty("/internalOrder"),
						"ReqBudYr1": oModel.getProperty("/requestedBudgetCurrentYear").toString(),
						"ReqBudYr2": oModel.getProperty("/requestdBudgetNextYear").toString(),
						// "Zbudcomments": oModel.getProperty("/sCommentHistory"),
						// "URL": oModel.getProperty("/sAttachmentLinks"),
						"Zappr": oModel.getProperty("/nextApproverName"),
						"Zappr_email": oModel.getProperty("/nextApproverMailAddress"),
						"Zappr_role": oModel.getProperty("/nextApproverRole"),
						"Short_Text": oModel.getProperty("/ShortText")
					};
					var requestedBudget = parseFloat(oModel.getProperty("/requestedBudgetCurrentYear")) + parseFloat(oModel.getProperty(
						"/requestdBudgetNextYear"));
					var requestedAmountFormatted = new Intl.NumberFormat('en-US', {
						minimumFractionDigits: 2
					}).format(requestedBudget); //requestedBudget.toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
					oModel.setProperty("/oInternalOrder/InternalOrder", oModel.getProperty("/internalOrder"));
					oModel.setProperty("/oInternalOrder/CurrentBudget", oModel.getProperty("/requestedBudgetCurrentYear").toString());
					oModel.setProperty("/oInternalOrder/TotalBudget", oModel.getProperty("/internalOrder"));
					oModel.setProperty("/oInternalOrder/NextBudget", oModel.getProperty("/requestdBudgetNextYear").toString());
					oModel.setProperty("/oInternalOrder/TotalBudget", requestedBudget.toString());
					oModel.setProperty("/requestedAmountFormatted", requestedAmountFormatted);
					oModel.setProperty("/requestedBudget", requestedBudget);
					/*	oModel.setData({
							requestedAmountFormatted: requestedAmountFormatted
						}, true);
						oModel.setData({
							requestedBudget: requestedBudget
						}, true);
					*/
				} else {
					oStatusData = {
						"Zappr": oModel.getProperty("/nextApproverName"),
						"Zappr_email": oModel.getProperty("/nextApproverMailAddress"),
						"Zappr_role": oModel.getProperty("/nextApproverRole")
					};
				}

				if (oModel.getProperty("/sCommentHistory") !== "" && oModel.getProperty("/sCommentHistory") !== undefined) {
					oStatusData.Zbudcomments = oModel.getProperty("/sCommentHistory");
				}
				if (oModel.getProperty("/sAttachmentLinks") !== "" && oModel.getProperty("/sAttachmentLinks") !== undefined) {
					oStatusData.URL = oModel.getProperty("/sAttachmentLinks");
				}

				var sRequestedBudget = oModel.getProperty("/requestedBudget");
				var approver = this.getModel('approverlistModel').getData();
				var range = this.getModel('rangelistModel').getData();

				if (sRequestedBudget <= 0) {
					sap.m.MessageToast.show("Please enter the valid amount");
				} else if (sRequestedBudget > 0) {
					// this._fetchApprovalLevelList(sRequestedBudget);
					var iFlag = 1;
					for (var i = 0; i < range.length; i++) {
						if (sRequestedBudget >= range[i].AMOUNT_FORM && sRequestedBudget < range[i].AMOUNT_TO) {
							//var j;
							var pjmapprdata = this.getModel("ZGB_CDS_PJMAPPR").getData().results;

							var aZGB_CDS_PJMAPPR = {};
							if (pjmapprdata.length !== 0) {
								for (var k = 0; k < pjmapprdata.length; k++) {
									if (pjmapprdata[k].COMPCODE === this.getModel("ctx").getProperty("/legalEntity") &&
										pjmapprdata[k].COSTCENTER === this.getModel("ctx").getProperty("/costCenter")) {
										aZGB_CDS_PJMAPPR = pjmapprdata[k];
									}
								}
							}

							// for (var m = 0; m < aZGB_CDS_PJMAPPR.length; m++) {
							if (this.getModel("ctx").getProperty("/legalEntity") !== aZGB_CDS_PJMAPPR.COMPCODE ||
								this.getModel("ctx").getProperty("/costCenter") !== aZGB_CDS_PJMAPPR.COSTCENTER) {
								if (range[i].APP_LEVEL === 0 || range[i].APP_LEVEL === 1) {
									i = 2;
									//return;
								}
							}
							/*else if (this.getModel("ctx").getProperty("/legalEntity") === aZGB_CDS_PJMAPPR[m].COMPCODE &&
								this.getModel("ctx").getProperty("/costCenter") === aZGB_CDS_PJMAPPR[m].COSTCENTER &&
								sRequestedBudget > 1000) {
								i = 2;
							}*/
							// }
							for (var j = 0; j < approver.length; j++) {
								if (range[i].APP_LEVEL === approver[j].AppLevel) {
									if (approver[j].Pjm === 'X') {
										iFlag = iFlag + 1;
									}
									if (approver[j].Hod === 'X') {
										iFlag = iFlag + 1;
									}
									if (approver[j].IndirectProcurement === 'X') {
										iFlag = iFlag + 1;
									}
									if (approver[j].Ceo === 'X') {
										iFlag = iFlag + 1;
									}
									if (approver[j].Cfo === 'X') {
										iFlag = iFlag + 1;
									}
									if (approver[j].Controlling === 'X') {
										iFlag = iFlag + 1;
									}
									if (approver[j].Director === 'X') {
										iFlag = iFlag + 1;
									}
									if (approver[j].Md1 === 'X') {
										iFlag = iFlag + 1;
									}
									if (approver[j].Md2 === 'X') {
										iFlag = iFlag + 1;
									}
									if (approver[j].Vp === 'X') {
										iFlag = iFlag + 1;
									}

								}

							}

						}
					}
					if (oModel.getProperty("/isApproved") === true) {
						if (iFlag === oModel.getProperty("/workflowStep") && oModel.getProperty("/isForwarding") === false) {
							oStatusData.Zstatus1 = "Closed";
							oStatusData.Zstatus2 = "Approved";
						}
						// oStatusData.Zstatus2 = "Approved";
					} else if (oModel.getProperty("/isApproved") === false) {

						oStatusData.Zstatus2 = "Rejected";
						oStatusData.Zstatus1 = "Closed";
					} else {
						oStatusData.Zstatus1 = "Open";
					}

					if (oModel.getProperty("/isForwarding") === true) {
						// oStatusData.Zstatus1 = "Open";
					}
				}
				oModel.setData({
					oStatusData: oStatusData
				}, true);

				this.getModel("ctx").setProperty("/oStatusData", oStatusData);
				oContext.oStatusData = oStatusData;
				console.log("STATUS", this.getModel("ctx").getProperty("/oStatusData"));
				var oForwardingUser = {};
				var oForwardingUsers = this.getModel("ctx").getProperty("/oForwardingUsers");
				//START of Changes By Mujeeb(A)
				sRole = this._getRole(oModel);
				//END of Changes By Mujeeb(A)
				var oModelTest = this.getModel("test");
				
				// if(!oModel.getProperty("/showApprovers") && oModel.getProperty("/iForwardedAData").length!==0){
				// 	sRole=oModel.getProperty("/iForwardedRole");
				// }

				//Start changes by Anupam

				// var reqid = oContext.bucketId;
				// var p = "/WfRequestSet(ReqId='" + reqid + "')";
				// oModelTest.update(p, oStatusData, {
				// 	success: function (oData, oResponse) {

				// 	},
				// 	error: function (err) {

				// 	}
				// });

				var aUserFilter = [];
				aUserFilter.push(new Filter("Zwfdomain1", FilterOperator.EQ, sRequesterId));
				if (oModel.getProperty("/workflowStep") !== 1) { // Problem mit Stammdaten in SAP Usertabelle. Nicht jeder User hat die Rolle Requester, daher diese Rolle ausblenden
					aUserFilter.push(new Filter("Zwfrole1", FilterOperator.EQ, sRole));
				}
				aUserFilter.push(new Filter("Zwfbukrs", FilterOperator.EQ, this.getModel("ctx").getProperty("/legalEntity")));
				aUserFilter.push(new Filter("Zwfkstlh", FilterOperator.EQ, this.getModel("ctx").getProperty("/costCenter")));
				console.log("Filter", aUserFilter);
				oModelTest.read("/SelectApprover", {
					filters: aUserFilter,
					success: function (oResults, oData) {
						if (oResults.results.length === 0) { // start of data length validation
							sap.m.MessageBox.error("No authorization for your user ID for the current role", {
								title: "Error"
							});

						} else {

							if (!this.getModel("ctx").getProperty("/isForwarding")) { // wenn normal approved wird, muss der approver in die Liste mit aufgenommen werden
								oForwardingUser.FirstName = oResults.results[0].FirstName;
								oForwardingUser.SecondName = oResults.results[0].SecondName;
								oForwardingUser.Name = oResults.results[0].FirstName + " " + oResults.results[0].SecondName;
								//special treatment of steps MD1 and MD2 is necessary, because in the UserTable in SAP there is only role MD and not MD1 and MD2 as it is necessary in the WF here. So we have to distinguish the 
								if (oModel.getProperty("/workflowStep") === 1) {
									oForwardingUser.Role = "REQUESTER";
									oForwardingUser.DeputyRole = "REQUESTER";
								} else if (oModel.getProperty("/workflowStep") === 5) {
									oForwardingUser.Role = "MD";
									oForwardingUser.DeputyRole = "MD1";
								} else if (oModel.getProperty("/workflowStep") === 6) {
									oForwardingUser.Role = "MD";
									oForwardingUser.DeputyRole = "MD2";
								} else {
									oForwardingUser.Role = oResults.results[0].Zwfrole1;
									oForwardingUser.DeputyRole = oResults.results[0].Zwfrole1;
								}
								oForwardingUser.Email = oResults.results[0].Zwfmail1;
								oForwardingUser.Zwfdomain1 = oResults.results[0].Zwfdomain1;
								oForwardingUser.DeputyFirstName = oResults.results[0].Zwfname3;
								oForwardingUser.DeputySecondName = oResults.results[0].Zwfname4;
								oForwardingUser.DeputyName = oResults.results[0].Zwfname3 + " " + oResults.results[0].Zwfname4;
								oForwardingUser.DeputyEmail = oResults.results[0].Zwfmail2;
								oForwardingUser.Zwfdomain2 = oResults.results[0].Zwfdomain2;
								oForwardingUsers.push(oForwardingUser);
								//					oModel.setData({oForwardingUser: oForwardingUsers}, true);
								oContext.oForwardingUsers = oForwardingUsers;
							} else { // wenn forwarding, muss die Liste der forwarder auf den entsprechenden Workflowschritt gekürzt werden. Bei VP z.B., darf nur der Requester stehen bleiben.
								var sForwardToRole = this.getModel("ctx").getProperty("/forwardToRole");
								if (sForwardToRole === 'REQUESTER') {
									// oForwardingUsers = [];
									oForwardingUsers.splice(1);
								} else if (sForwardToRole === 'VP') {
									oForwardingUsers.splice(2);
								} else if (sForwardToRole === 'CONTROLLING') {
									oForwardingUsers.splice(3);
								} else if (sForwardToRole === 'CFO') {
									oForwardingUsers.splice(4);
								} else if (sForwardToRole === 'MD1') {
									oForwardingUsers.splice(5);
								} else if (sForwardToRole === 'MD2') {
									oForwardingUsers.splice(6);
								} else if (sForwardToRole === 'CEO') {
									oForwardingUsers.splice(7);
								}
								oContext.oForwardingUsers = oForwardingUsers;
							}
							// START of Changes By Mujeeb(A)
							var aList1 = JSON.parse(JSON.stringify(oContext.oForwardingUsers));
							var aList2 = JSON.parse(JSON.stringify(aList1));
							aList1 = [];
							aList1.push(JSON.parse(JSON.stringify(aList2[0])));
							var bExist;
							for (var cnt1 = 1; cnt1 < aList2.length; cnt1++) {
								bExist = false;
								for (var cnt2 = 0; cnt2 < aList1.length; cnt2++) {
									if (aList2[cnt1].Role == aList1[cnt2].Role && aList2[cnt1].Zwfdomain1 == aList1[cnt2].Zwfdomain1) {
										bExist = true;
									}
								}
								if (bExist == false) {
									aList1.push(JSON.parse(JSON.stringify(aList2[cnt1])));
								}
							}
							oContext.oForwardingUsers = JSON.parse(JSON.stringify(aList1));
							
							//reset forwarded users before forward if no amount change // [FR:987001413]
                            if(!isForwarding && !oContext.showApprovers){
                            	oContext.oForwardingUsers=oModel.getProperty("/iForwardedUsers");
                            }
							this._refreshApproverLevelList(oModel);
							oContext.aApproverLevelList = this._updateApproverLevelList(oModel, sForwardToRole);
							 if(!isForwarding && !oContext.showApprovers){
                            	oContext.oForwardingUsers=oModel.getProperty("/iForwardedUsers");
                            }
							oContext.bApproveFinished = oModel.getData().bApproveFinished;
							oContext.approverName = oModel.getProperty("/nextApproverName");
							oContext.nextWorkflowStepDescr = this._getApproverLevel(oContext.aApproverLevelList, oModel);
							oContext.iForwardedAData = oModel.getProperty("/iForwardedAData");
							//if not forwarded then reset forwarded approver data // [FR:987001413]
							if(!isForwarding){
								//oContext.nextWorkflowStepDescr=oModel.getProperty("/iForwardedRole");
								oContext.iForwardedId="";
								oContext.iForwardedName="";
								oContext.iForwardedEmail="";
								oContext.iForwardedRole="";
								oContext.iForwardedUsers="";
								oContext.iForwardedAData=[];
							}
							oContext.workflowStep = oModel.getData().workflowStep;
							//disable select approver in case of it is forwarding scenario
							if (isForwarding) {
								oContext.showApprovers = false;
							} else {
								oContext.showApprovers = !(oContext.aApproverLevelList[oContext.aApproverLevelList.length - 1].Status == "PENDING");
							}
							if (oModel.getData().isApproved == true) {
								oContext.approvers.cfo = this._getApproverForNextLevel(oContext.aApproverLevelList, oModel);
							}
							//oModel.setData({"approvers":{"cfo":this._getApproverForNextLevel(oContext.aApproverLevelList, oModel)}}, true);
							var sReqId = this.getModel("ctx").getData().bucketId;
							this._updateStatusData(oContext.oStatusData, sReqId);
							this._postInternalOrder(oContext);
							//END of changes By Mujeeb(A)
							$.ajax({
								url: "/bpmworkflowruntime/rest/v1/xsrf-token",
								method: "GET",
								headers: {
									"X-CSRF-Token": "Fetch"
								},
								success: function (result, xhr, data) {
									var token = data.getResponseHeader("X-CSRF-Token");
									//	var oContext = this.getModel("ctx").getData();
									oContext.workplaceConfirmed = approvalStatus;
									oContext.mailComment = mailComment;
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
								}.bind(this),
								error: function (aResult) {
									console.log(aResult);
								}
							});
							console.log("Received Data");
							// console.dir(data);

						} // end of data length validation 
					}.bind(this),
					error: function (response) {
						console.log("error", response);
					}
				});

				/* Beginn alt				
								$.ajax({
									url: "/bpmworkflowruntime/rest/v1/xsrf-token",
									method: "GET",
									headers: {
										"X-CSRF-Token": "Fetch"
									},
									success: function (result, xhr, data) {
										var token = data.getResponseHeader("X-CSRF-Token");
									//	var oContext = this.getModel("ctx").getData();
										oContext.workplaceConfirmed = approvalStatus;
										oContext.mailComment = mailComment;
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
									}.bind(this)
								});
				Ende alt */

				this.getModel("ctx").setProperty("/isApproverChanged", false);
			}
			//	}

		},

		// _fetchApprovalLevelList:function(sBudget){
		// 		// var aApproverLevelList = this._fetchApprovalLevelList(requestedBudget, oModel);
		// },
		// Request Inbox to refresh the control
		// once the task is completed
		_refreshTask: function () {
			var taskId = this.getComponentData().startupParameters.taskModel.getData().InstanceID;
			this.getComponentData().startupParameters.inboxAPI.updateTask("NA", taskId);
		},
		//START of Changes By Mujeeb(A)
		_refreshApproverLevelList: function (oModel) {
			if (oModel.getData().workflowStep != "1" || oModel.getData().isForwarding == true || oModel.getData().isApproved != true) {
				return;
			}
			var sRequestedBudget = oModel.getProperty("/requestedBudget");
			var approver = this.getModel('approverlistModel').getData();
			var range = this.getModel('rangelistModel').getData();
			var oInfo = {};
			for (var i = 0; i < range.length; i++) {
				if (sRequestedBudget >= range[i].AMOUNT_FORM && sRequestedBudget < range[i].AMOUNT_TO) {
					if (oModel.getProperty("/nextApproverVp") !== undefined) {
						if (range[i].APP_LEVEL === 0 || range[i].APP_LEVEL === 1) {
							i = 2;
						}
					}
					for (var j = 0; j < approver.length; j++) {
						if (range[i].APP_LEVEL === approver[j].AppLevel) {
							oInfo = approver[j];
						}
					}
				}
			}
			var aALevelList = [],
				oALevelInfo = {},
				iLevelCount = 0;
			//Requester Info
			oALevelInfo.Level = iLevelCount++;
			oALevelInfo.LevelDesc = "Requester";
			oALevelInfo.Name = oModel.getData().requesterDisplayName;
			oALevelInfo.Id = oModel.getData().requester;
			oALevelInfo.Status = "PENDING";
			oALevelInfo.StatusDesc = "Pending for Approval";
			aALevelList.push(JSON.parse(JSON.stringify(oALevelInfo)));

			// //Selected VP Info (VP is Mandatory)
			// oALevelInfo.Level = iLevelCount++;
			// oALevelInfo.LevelDesc = "VP";
			// oALevelInfo.Name = oModel.getData().approverName;
			// oALevelInfo.Id = oModel.getData().nextApprover;
			// oALevelInfo.Status = "PENDING";
			// oALevelInfo.StatusDesc = "Pending for Approval";
			// aALevelList.push(JSON.parse(JSON.stringify(oALevelInfo)));
			if (oInfo.Pjm == 'X') {
				oALevelInfo.Level = iLevelCount++;
				oALevelInfo.LevelDesc = "PJM";
				oALevelInfo.Name = "";
				oALevelInfo.Id = "";
				oALevelInfo.Status = "";
				oALevelInfo.StatusDesc = "";
				aALevelList.push(JSON.parse(JSON.stringify(oALevelInfo)));
			}

			if (oInfo.Vp == 'X') {
				oALevelInfo.Level = iLevelCount++;
				oALevelInfo.LevelDesc = "VP";
				oALevelInfo.Name = "";
				oALevelInfo.Id = "";
				oALevelInfo.Status = "";
				oALevelInfo.StatusDesc = "";
				aALevelList.push(JSON.parse(JSON.stringify(oALevelInfo)));
			}

			if (oInfo.Controlling == 'X') {
				oALevelInfo.Level = iLevelCount++;
				oALevelInfo.LevelDesc = "CONTROLLING";
				oALevelInfo.Name = "";
				oALevelInfo.Id = "";
				oALevelInfo.Status = "";
				oALevelInfo.StatusDesc = "";
				aALevelList.push(JSON.parse(JSON.stringify(oALevelInfo)));
			}

			if (oInfo.Cfo == 'X') {
				oALevelInfo.Level = iLevelCount++;
				oALevelInfo.LevelDesc = "CFO";
				oALevelInfo.Name = "";
				oALevelInfo.Id = "";
				oALevelInfo.Status = "";
				oALevelInfo.StatusDesc = "";
				aALevelList.push(JSON.parse(JSON.stringify(oALevelInfo)));
			}

			if (oInfo.Md1 == 'X') {
				oALevelInfo.Level = iLevelCount++;
				oALevelInfo.LevelDesc = "MD1";
				oALevelInfo.Name = "";
				oALevelInfo.Id = "";
				oALevelInfo.Status = "";
				oALevelInfo.StatusDesc = "";
				aALevelList.push(JSON.parse(JSON.stringify(oALevelInfo)));
			}

			if (oInfo.Md2 == 'X') {
				oALevelInfo.Level = iLevelCount++;
				oALevelInfo.LevelDesc = "MD2";
				oALevelInfo.Name = "";
				oALevelInfo.Id = "";
				oALevelInfo.Status = "";
				oALevelInfo.StatusDesc = "";
				aALevelList.push(JSON.parse(JSON.stringify(oALevelInfo)));
			}

			if (oInfo.Ceo == 'X') {
				oALevelInfo.Level = iLevelCount++;
				oALevelInfo.LevelDesc = "CEO";
				oALevelInfo.Name = "";
				oALevelInfo.Id = "";
				oALevelInfo.Status = "";
				oALevelInfo.StatusDesc = "";
				aALevelList.push(JSON.parse(JSON.stringify(oALevelInfo)));
			}
			oModel.getData().aApproverLevelList = JSON.parse(JSON.stringify(aALevelList));
			//oModel.setData({aApproverLevelList: aALevelList}, false);
		},
		_postInternalOrder: function (oContext) {
			var oInternalOrderData = oContext.oInternalOrder,
				bUpdateSuccess = false;
			var oWFINternalOrder = this.getModel("test");
			var sPath = "/BudgetOrder";
			if (oContext.bApproveFinished == true) {
				oWFINternalOrder.create(sPath,
					oInternalOrderData, {
						success: function (oData, oResponse) {
							console.log(oData, oResponse);
							bUpdateSuccess = true;
						},
						error: function (err) {
							console.log(err);
							console.log("InternalOrder Post Call triggered but Failed!!");
						}
					});
			} else {
				console.log("InternalOrder Post Call did not triggered!!");
			}
			return bUpdateSuccess;
		},
		_getRole: function (oModel) {
			var aApproverLevelList = oModel.getData().aApproverLevelList,
				sRole;
			for (var i = 0; i < aApproverLevelList.length; i++) {
				if (aApproverLevelList[i].Status == "PENDING") {
					sRole = aApproverLevelList[i].LevelDesc;
					if (sRole == "MD1" || sRole == "MD2") {
						sRole = "MD";
					}
					break;
				}
			}
			return sRole;
		},
		_getApproverLevel: function (aApproverLevelList, oModel) {
			var sLevel = "";
			for (var i = 0; i < aApproverLevelList.length; i++) {
				if (aApproverLevelList[i].Status == "PENDING" && (i + 1) < aApproverLevelList.length) {
					sLevel = aApproverLevelList[i + 1].LevelDesc;
					var sRole = aApproverLevelList[i + 1].LevelDesc;
					// sLevel = sLevel.charAt(0).toUpperCase() + sLevel.substr(1).toLowerCase();
				}
				if (aApproverLevelList[i].Status == "PENDING") {
					oModel.setData({
						workflowStep: i
					}, true);
				}
			}
			return sLevel;
		},
		_updateApproverLevelList: function (oModel, sForwardToRole) {
			var aApproverLevelList = JSON.parse(JSON.stringify(oModel.getData().aApproverLevelList)),
				bClear = false;
			if (sForwardToRole != undefined && oModel.getData().isForwarding == true) {
				//approver level data before forwarding
				oModel.setData({
					iForwardedAData: aApproverLevelList
				}, true);
				for (var j = 0; j < aApproverLevelList.length; j++) {
					if (aApproverLevelList[j].LevelDesc.toUpperCase() == sForwardToRole.toUpperCase()) {
						aApproverLevelList[j].Status = "PENDING";
						aApproverLevelList[j].StatusDesc = "Pending for Approval";
						oModel.setData({
							workflowStep: parseInt(aApproverLevelList[j].Level, 10)
						}, true);
						bClear = true;
					} else {
						if (bClear == true) {
							aApproverLevelList[j].Name = "";
							aApproverLevelList[j].Id = "";
							aApproverLevelList[j].Status = "";
							aApproverLevelList[j].StatusDesc = "";
						}
					}
				}
			} else {
				//required forwarduser changes
				if (oModel.getProperty("/showApprovers") || !oModel.getData().isApproved || (oModel.getData().iForwardedAData.length===0)) {
					for (var i = 0; i < aApproverLevelList.length; i++) {
						if (aApproverLevelList[i].Status == "PENDING") {
							if (oModel.getData().isApproved == true) {
								aApproverLevelList[i].Status = "APPROVED";
								aApproverLevelList[i].StatusDesc = "Approved";
								if (i + 1 < aApproverLevelList.length) {
									aApproverLevelList[i + 1].Name = oModel.getData().approverNameForStatusReport;
									aApproverLevelList[i + 1].Id = oModel.getData().approver;
									aApproverLevelList[i + 1].Status = "PENDING";
									aApproverLevelList[i + 1].StatusDesc = "Pending for Approval";
								}
							} else {
								aApproverLevelList[i].Status = "REJECTED";
								aApproverLevelList[i].StatusDesc = "Rejected";
							}
							break;
						}
					}
				} else {
					for ( i = 0; i < aApproverLevelList.length; i++) {
						if (aApproverLevelList[i].Status === "PENDING") {
							if (oModel.getData().isApproved === true && aApproverLevelList[i].Id!==oModel.getData().iForwardedAData[i].Id) {
								oModel.getData().iForwardedAData[i].Id = aApproverLevelList[i].Id;
								oModel.getData().iForwardedAData[i].Name = aApproverLevelList[i].Name;
							    var ofwdUsers=oModel.getProperty("/iForwardedUsers");
							    ofwdUsers[i]=oModel.getProperty("/oForwardingUsers")[i];
							    oModel.setProperty("/iForwardedUsers",ofwdUsers);
							} 
						}
					}
					
					aApproverLevelList = oModel.getProperty("/iForwardedAData");
				}
				oModel.setData({
					iForwardedAData: []
				}, true);
			}

			if (aApproverLevelList[aApproverLevelList.length - 1].Status == "APPROVED") {
				oModel.setData({
					bApproveFinished: true
				}, true);
			} else {
				oModel.setData({
					bApproveFinished: false
				}, true);
				//need forward data change based on amount change
				oModel.setData({
					nextApprover: oModel.getData().approver
				}, true);
			}
			return aApproverLevelList;
		},
		_getApproverForNextLevel: function (aApproverLevelList, oModel) {
			var sUrl = "/sap/fiori/cerbudgetapprove/sap/opu/odata/sap/Z_WORKFLOW_SRV/SelectApprover",
				aApprovers = {
					"d": {
						"results": []
					}
				},
				bCall = false;
			for (var i = 0; i < aApproverLevelList.length; i++) {
				if (aApproverLevelList[i].Status == "PENDING" && (i + 1) < aApproverLevelList.length) {
					bCall = true;
					if (aApproverLevelList[i + 1].LevelDesc == "MD1" || aApproverLevelList[i + 1].LevelDesc == "MD2") {
						sUrl = sUrl + "?$filter=Zwfrole1 eq '" + "MD" + "'";
					} else {
						sUrl = sUrl + "?$filter=Zwfrole1 eq '" + aApproverLevelList[i + 1].LevelDesc + "'";
					}
					sUrl = sUrl + " and Zwfbukrs eq '" + oModel.getData().legalEntity + "'";
					sUrl = sUrl + " and Zwfkstlh eq '" + oModel.getData().costCenter + "'";
					$.ajax({
						url: sUrl,
						method: "GET",
						async: false,
						headers: {
							"Accept": "application/json"
						},
						success: function (result, xhr, data) {
							console.log(result);
							aApprovers = result;
						},
						error: function (result, xhr, data) {
							console.log(result);
						}
					});

				}
			}
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
		_updateStatusData: function (oStatusData, sReqId) {
			// 	var sUrl = "/sap/opu/odata/sap/Z_WORKFLOW_SRV/WfRequestSet", bUpdateSuccess = false, sToken;
			// $.ajax({	url: sUrl + "?$top=1",
			// 			method: "GET",
			// 			async: false,
			// 			headers:{"Accept": "application/json", "x-csrf-token":"fetch"},
			// 			success: function(result, xhr, data){
			// 				console.log(result, xhr, data);
			// 				sToken = data.getResponseHeader('x-csrf-token');
			// 				$.ajax({	url: sUrl,
			// 							method: "POST",
			// 							async: false,
			// 							contentType: "application/json",
			// 							headers: {"X-CSRF-Token": sToken, "accept":"application/json"},
			// 							data: JSON.stringify(oStatusData),
			// 							success:function(resultSuccess, xhrSuccess, dataSuccess){
			// 								console.log(resultSuccess, xhrSuccess, dataSuccess);
			// 								bUpdateSuccess = true;
			// 							},
			// 							error: function(resultError,xhrError,dataError){
			// 								console.log(resultError);
			// 							}	
			// 				});
			// 			},
			// 			error: function(result,xhr,data){
			// 				console.log(result);
			// 			}							
			// });
			var reqid = oStatusData.ReqId,
				bUpdateSuccess = false;
			var oModelTest = this.getModel("test");
			var sPath = "/WfRequestSet(ReqId='" + sReqId + "')";
			oModelTest.update(sPath,
				oStatusData, {
					success: function (oData, oResponse) {
						console.log(oData, oResponse);
						bUpdateSuccess = true;
					},
					error: function (err) {
						console.log(err);
					}
				});
			return bUpdateSuccess;
		},
		//END of Changes By Mujeeb(A)
	});
});