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
        this.orm = useService("orm");
        this.timer = null;
        this.scanQueue = Promise.resolve();

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
            const barcode = event.detail.barcode;
            const resModel = this.props.record.resModel;
            const resId = this.props.record.resId;
            this.scanQueue = this.scanQueue.then(async () => {
                try {
                    await this.orm.call(resModel, "dummy_on_barcode_scanned", [
                        [resId],
                        barcode,
                    ]);
                    await this.props.record.load();
                } catch (error) {
                    console.error("Erreur durant le traitement du scan:", error);
                    await this.props.record.load();
                }
            });
            await this.scanQueue;
        } else {
            super.onBarcodeScanned(...arguments);
            // Option if we want to delay the web_read so the guy can scan, scan, scan and screen only refresh when he does not scan for some time.
            //            try {
            //                const result = await this.orm.call("wiz.stock.barcodes.read.picking", "dummy_on_barcode_scanned", [[this.props.record.resId], event.detail.barcode])
            //            } finally {
            //                if (this.timer) clearTimeout(this.timer);
            //                    this.timer = setTimeout(() => this.props.record.load(), 400);
            //            }
        }
    },
});
