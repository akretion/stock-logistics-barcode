/** @odoo-module **/
import {BarcodeHandlerField} from "@barcodes/barcode_handler_field";
import {patch} from "@web/core/utils/patch";
import {useService} from "@web/core/utils/hooks";
import {rpc} from "@web/core/network/rpc";
const {useEffect} = owl;

patch(BarcodeHandlerField.prototype, {
    /* eslint-disable no-unused-vars */
    setup() {
        super.setup();
        const busService = useService("bus_service");

        useEffect(() => {
            const handleBusNotification = (notif) => {
                const {type, payload} = notif;
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
    async onBarcodeScanned(event) {
        // Super.onBarcodeScanned(...arguments);
        if (this.props.record.resModel.includes("wiz.stock.barcodes.read")) {
            // Remplacement de jQuery par l'API DOM standard
            // document.querySelector("#dummy_on_barcode_scanned")?.click();
            const result = await rpc("/stock_barcodes/barcode_scanned", {
                model: "wiz.stock.barcodes.read.picking",
                _id: this.props.record.resId,
                barcode: event.detail.barcode,
            });
            // Document.querySelector("#dummy_refresh")?.click();
            console.log(this.do_action);
        }
    },
});
