/** @odoo-module **/
import {BarcodeHandlerField} from "@barcodes/barcode_handler_field";
import {patch} from "@web/core/utils/patch";
import {useService} from "@web/core/utils/hooks";
const {useEffect} = owl;

patch(BarcodeHandlerField.prototype, {
    /* eslint-disable no-unused-vars */
    setup() {
        super.setup();
        const busService = useService("bus_service");

        useEffect(() => {
            const handleBusNotification = (notif) => {
                const { type, payload } = notif;
                if (payload.type === "stock_barcodes_refresh_data") {
                    this.env.model.root.load();
                    this.env.model.notify();
                }
            };
            busService.subscribe("barcode_reload", handleBusNotification);
            return () => {
                busService.unsubscribe("barcode_reload", handleBusNotification);
            };
        });
    },
    onBarcodeScanned(event) {
        super.onBarcodeScanned(...arguments);
        if (this.props.record.resModel.includes("wiz.stock.barcodes.read")) {
            // Remplacement de jQuery par l'API DOM standard
            document.querySelector("#dummy_on_barcode_scanned")?.click();
        }
    },
});
