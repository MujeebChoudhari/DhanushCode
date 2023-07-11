/*global QUnit*/

sap.ui.define([
	"gb/wf/cer/invoice/approve/cer/invoice/approve/controller/ApproveInvoice.controller"
], function (oController) {
	"use strict";

	QUnit.module("ApproveInvoice Controller");

	QUnit.test("I should test the ApproveInvoice controller", function (assert) {
		var oAppController = new oController();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});