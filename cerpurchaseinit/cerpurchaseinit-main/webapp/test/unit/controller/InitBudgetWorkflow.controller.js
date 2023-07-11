/*global QUnit*/

sap.ui.define([
	"gb/wf/cer/budget/init/cer/budget/init/controller/InitBudgetWorkflow.controller"
], function (oController) {
	"use strict";

	QUnit.module("InitBudgetWorkflow Controller");

	QUnit.test("I should test the InitBudgetWorkflow controller", function (assert) {
		var oAppController = new oController();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});