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
        this.action = useService("action");
        this.timer = null;

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

    RefreshData() {
        this.action.doAction({
            type: "ir.actions.client",
            tag: "soft_reload",
            target: "fullscreen",
        });
    },

    async onBarcodeScanned(event) {
        // Super.onBarcodeScanned(...arguments);
        if (this.props.record.resModel.includes("wiz.stock.barcodes.read")) {
            // Remplacement de jQuery par l'API DOM standard
            // document.querySelector("#dummy_on_barcode_scanned")?.click();
            try {
                const result = await rpc("/stock_barcodes/barcode_scanned", {
                    model: "wiz.stock.barcodes.read.picking",
                    _id: this.props.record.resId,
                    barcode: event.detail.barcode,
                });
            } finally {
                if (this.timer) clearTimeout(this.timer);
                //            This.timer = setTimeout(() => this.action.doAction({ 'type': 'ir.actions.client', 'tag': 'soft_reload', 'target':"fullscreen"}), 1000);
                //            this.timer = setTimeout(() => document.querySelector("#dummy_refresh")?.click(), 400);
                document.querySelector("#dummy_refresh")?.click();
                console.log(this.action);
                console.log(this);
            }
        }
    },
});
