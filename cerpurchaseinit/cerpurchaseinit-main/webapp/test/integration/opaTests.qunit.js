/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"gb/wf/cer/invoice/init/cer/invoice/init/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});