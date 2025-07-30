/** @odoo-module */
/* Copyright 2021 Tecnativa - Alexandre D. Díaz
 * License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl). */

import {onMounted, useEffect, useState} from "@odoo/owl";
import {FormController} from "@web/views/form/form_controller";
import {useService} from "@web/core/utils/hooks";

export class StockBarcodesFormController extends FormController {
    setup() {
        super.setup();
        const busService = this.env.services.bus_service;
        const ormService = useService("orm");
        this.state = useState({applyCount: 0});
        // Adds support to use control_pannel_hidden from the
        // context to disable the control panel
        if (this.props.context.control_panel_hidden) {
            this.display.controlPanel = false;
        }

        const handleNotification = ({detail: notifications}) => {
            if (notifications && notifications.length > 0) {
                notifications.forEach((notif) => {
                    const {payload, type} = notif;
                    if (type === "count_apply_inventory" && payload) {
                        this.state.applyCount = payload.count;
                    }
                });
            }
        };
        useEffect(() => {
            busService.addChannel("stock_barcodes_form_update");
            busService.addEventListener("notification", handleNotification);
            return () => {
                busService.deleteChannel("stock_barcodes_form_update");
                busService.removeEventListener("notification", handleNotification);
            };
        });

        onMounted(async () => {
            if (this.props.resModel === "wiz.stock.barcodes.read.inventory") {
                const fields = ["count_inventory_quants"];
                const countApply = await ormService.call(
                    this.props.resModel,
                    "read",
                    [this.props.resId],
                    {fields}
                );
                this.state.applyCount =
                    countApply.length > 0 ? countApply[0].count_inventory_quants : 0;
            }
        });
    }
}
