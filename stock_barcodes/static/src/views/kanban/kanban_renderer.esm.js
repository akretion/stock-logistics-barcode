/** @odoo-module */
/* Copyright 2022 Tecnativa - Alexandre D. Díaz
 * License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl). */

import {onPatched, useEffect, useRef} from "@odoo/owl";
import {useBus, useService} from "@web/core/utils/hooks";
import {KanbanRenderer} from "@web/views/kanban/kanban_renderer";
import {isAllowedBarcodeModel} from "../../utils/barcodes_models_utils.esm";
import {patch} from "@web/core/utils/patch";
import {useHotkey} from "@web/core/hotkeys/hotkey_hook";

patch(KanbanRenderer.prototype, {
    setup() {
        const rootRef = useRef("root");
        useHotkey(
            "Enter",
            ({target}) => {
                if (!target.classList.contains("o_kanban_record")) {
                    return;
                }

                // Open first link
                let firstLink = null;
                if (isAllowedBarcodeModel(this.props.list.resModel)) {
                    firstLink = target.querySelector(
                        ".oe_kanban_action_button,.oe_btn_quick_action"
                    );
                }
                if (!firstLink) {
                    firstLink = target.querySelector(
                        ".oe_kanban_global_click, a, button"
                    );
                }
                if (firstLink && firstLink instanceof HTMLElement) {
                    firstLink.click();
                }
                return;
            },
            {area: () => rootRef.el}
        );

        super.setup();
        this.ormService = useService("orm");
        this.action = useService("action");
        const busService = this.env.services.bus_service;
        this.enableCurrentOperation = 0;
        // CORRECTION : Remplacement de l'ancien système par `subscribe`.

        useEffect(() => {
            const handleBusNotification = (notif) => {
                const { type, payload } = notif;
               // const { subtype: type, data: payload } = notif;
                if (type === "enable_operations" && payload) {
                    this.enableCurrentOperation = payload.id;
                }
            };
            busService.subscribe("stock_barcodes_kanban_update", handleBusNotification);
            return () => {
                busService.unsubscribe("stock_barcodes_kanban_update", handleBusNotification);
            };
        });


        onPatched(() => {
            // Remplacement de jQuery
            const operationsEl = document.querySelector("div.oe_kanban_operations-" + this.enableCurrentOperation);
            if (operationsEl) {
                operationsEl.classList.remove("d-none");
            }
        });

        if (isAllowedBarcodeModel(this.props.list.resModel)) {
            if (this.env.searchModel) {
                useBus(this.env.searchModel, "focus-view", () => {
                    const {model} = this.props.list;
                    if (model.useSampleModel || !model.hasData()) {
                        return;
                    }
                    const cards = Array.from(
                        rootRef.el.querySelectorAll(".o_kanban_record")
                    );
                    const firstCard = cards.find(
                        (card) =>
                            card.querySelectorAll("button[name='action_barcode_scan']")
                                .length > 0
                    );
                    if (firstCard) {
                        // Focus first kanban card
                        firstCard.focus();
                    }
                });
            }
        }

        this.showMessageScanProductPackage =
            this.props.list.resModel === "stock.picking";
    },

    // ... (le reste du fichier reste identique, il n'utilise pas jQuery)
    // ...
});

KanbanRenderer.template = "stock_barcodes.BarcodeKanbanRenderer";
