sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"sap/ui/model/json/JSONModel",
	"./model/models"
], function (UIComponent, Device, JSONModel, models) {
	"use strict";

	return UIComponent.extend("gb.wf.cer.budget.init.Component", {

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

			// get task data
			var oComponentData = this.getComponentData();
			if (oComponentData) {
				// only available in workflow process!!!
				var startupParameters = this.getComponentData().startupParameters;
				var taskModel = startupParameters.taskModel;
				if (taskModel !== undefined) {
					var taskData = taskModel.getData();
					var taskId = taskData.InstanceID;

					// read process context & bind it to
					// the view's model
					var that = this;
					var contextModel = this.getModel("context");
					//contextModel.loadData("/bpmworkflowruntime/rest/v1/task-instances/" + taskId + "/context");
				
					//var contextModel = new JSONModel("/bpmworkflowruntime/rest/v1/task-instances/" + taskId + "/context");

					//contextModel.setProperty("/createdOn",taskData.CreatedOn.ToDateString());
					//contextModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
					//this.setModel(contextModel, "budget");
					console.log("CTX_1", contextModel);

					//var contextData = contextModel.getData();
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
					contextModel.loadData("/bpmworkflowruntime/rest/v1/task-instances/" + taskId + "/context").then(function() {
						console.log("contextModel.loadData");
					//contextModel.attachRequestCompleted(function () {
						var contextData = contextModel.getData();
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

						// Get date on which
						// task was created
						contextData.task.CreatedOn = taskData.CreatedOn.toDateString();
						// Get task description
						// and add it to the UI
						// model
						
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
								// Add the Accept & Reject buttons
/*						startupParameters.inboxAPI.addAction({
							action: oPositiveAction.sBtnTxt,
							label: oPositiveAction.sBtnTxt,
							type: "Accept"
						},
							oPositiveAction.onBtnPressed
						);
*/						
						startupParameters.inboxAPI.getDescription("NA", taskData.InstanceID)
							.done(function (dataDescr) {
								contextData.task.Description = dataDescr.Description;
								contextModel.setData(contextData);
							})
							.fail(
								function (errorText) {
									jQuery.sap.require("sap.m.MessageBox");
									sap.m.MessageBox.error(errorText, {
										title: "Error"
									});
								}
							);
					//});
					});
				} else {
					var contextModel = new sap.ui.model.json.JSONModel();
					contextModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
					contextModel = new sap.ui.model.json.JSONModel();
					var bucketId = this.createUUID();
					contextModel.setProperty("/bucketId", bucketId);
					this.setModel(contextModel, "budget");
					console.log("CTX_2", contextModel);
				}
			} else {

				var contextModel = new sap.ui.model.json.JSONModel();
				this.setModel(contextModel, "budget");
				console.log("CTX_3", contextModel);

				var yearModel = new sap.ui.model.json.JSONModel();
				this.setModel(yearModel, "year");

				var timeInMs = new Date();
				var sYear = timeInMs.getFullYear();

				var years = [];

				for (var i = sYear; i < sYear + 2; i++) {
					years.push({
						id: i,
						fiscalYear: i
					});
				}
				yearModel.setProperty("/years", years);
				var bucketId = this.createUUID();
				this.getModel("budget").setProperty("/bucketId", bucketId);
			}

		},

		/*		init: function () {
					// call the base component's init function
					UIComponent.prototype.init.apply(this, arguments);

					var contextModel = new sap.ui.model.json.JSONModel();
					this.setModel(contextModel, "budget");

					var yearModel = new sap.ui.model.json.JSONModel();
					this.setModel(yearModel, "year");

					var timeInMs = new Date();
					var sYear = timeInMs.getFullYear();

					var years = [];

					for (var i = sYear; i < sYear + 2; i++) {
						years.push({
							id: i,
							fiscalYear: i
						});
					}
					yearModel.setProperty("/years", years);
					var bucketId = this.createUUID();
					this.getModel("budget").setProperty("/bucketId", bucketId);
				},
		*/
		createUUID: function () {
			//WORKAROUND weil Feld REQ_ID in der Entität vom Typ Number ist. Wenn das geändert ist, muss der auskommentierte Code wieder rein.
			var c = 1;
			var d = new Date(),
				m = d.getMilliseconds() + "",
				u = ++d + m + (++c === 10000 ? (c = 1) : c);
			return u;

			/*    	var dt = new Date().getTime();
	    		var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
	        	var r = (dt + Math.random()*16)%16 | 0;
	        	dt = Math.floor(dt/16);
	        	return (c=='x' ? r :(r&0x3|0x8)).toString(16);
	    	});
    		return uuid;
    */
		},
				// Request Inbox to refresh the control
		// once the task is completed
		_refreshTask: function () {
			var taskId = this.getComponentData().startupParameters.taskModel.getData().InstanceID;
			this.getComponentData().startupParameters.inboxAPI.updateTask("NA", taskId);
		},
	});
});