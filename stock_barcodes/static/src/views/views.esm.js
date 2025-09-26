/** @odoo-module */
/* Copyright 2024 Akretion
/* Copyright 2024 Tecnativa
 * License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl). */

import {isVisible} from "@web/core/utils/ui";
import {FormController} from "@web/views/form/form_controller";
import {KanbanController} from "@web/views/kanban/kanban_controller";
import {ListController} from "@web/views/list/list_controller";
import {_t} from "@web/core/l10n/translation";
import {isAllowedBarcodeModel} from "../utils/barcodes_models_utils.esm";
import {patch} from "@web/core/utils/patch";
import {useEffect, useRef} from "@odoo/owl";
import {useService} from "@web/core/utils/hooks";
import {useHotkey} from "@web/core/hotkeys/hotkey_hook";

function setupView() {
    const busService = useService("bus_service");
    const notification = useService("notification");
    const rootRef = useRef("root");

    // Fonction utilitaire pour mettre le focus de manière robuste
    const focusOnElement = (selector, retries = 5, interval = 50) => {
        if (!rootRef.el) return;
        let attempt = 0;
        const tryFocus = () => {
            const element = rootRef.el.querySelector(selector);
            if (element) {
                element.focus();
                element.select();
            } else if (attempt < retries) {
                attempt++;
                setTimeout(tryFocus, interval);
            }
        };
        tryFocus();
    };

    useEffect(() => {
        // On définit la fonction de traitement ici pour la référencer plus tard
        const handleBusNotification = (notif) => {
            const { type, payload } = notif;
            const modelData = { ...payload };

            if (modelData.res_id && this.model.root.resId !== modelData.res_id) {
                return;
            }
            if (type === "stock_barcodes_sound") {
                if (payload.sound === "ko") {
                    if (this.soundKoEl) this.soundKoEl.play();
                } else {
                    if (this.soundOkEl) this.soundOkEl.play();
                }
            } else if (type === "stock_barcodes_focus") {
                focusOnElement(`[name=${payload.field_name}] input`);
            } else if (type === "stock_barcodes_notify") {
                notification.add(notif.payload.message, {
                    title: notif.payload.title,
                    type: notif.payload.type,
                    sticky: notif.payload.sticky,
                });
            } else if (type === "stock_barcodes_edit_manual") {
                if (payload.manual_entry) {
                    this.env.bus.trigger("enableFormEditBarcode");
                } else if (!payload.manual_entry) {
                    this.env.bus.trigger("disableFormEditBarcode");
                }
            } else if (type === "actions_barcode") {
                if (payload.valid_picking) {
                    notification.add(_t("The transfer has been validated"), {
                        type: "success",
                    });
                } else if (payload.apply_inventory) {
                    notification.add(
                        _t("The inventory adjustment has been validated"),
                        {
                            type: "success",
                        }
                    );
                    // 'actionService' n'est pas défini ici, il faut le récupérer
                    const actionService = this.env.services.action;
                    return actionService.doAction(
                        "stock_barcodes.action_stock_barcodes_action_client"
                    );
                }
            } else if (type === "actions_barcode_notification") {
                notification.add(_t(payload.message), {
                    type: payload.message_type,
                    sticky: payload.sticky,
                });
            }
        };

        // On s'abonne aux notifications
        busService.subscribe("stock_barcodes_scan", handleBusNotification);

        this.soundOkEl = document.createElement("audio");
        this.soundOkEl.src = "/stock_barcodes/static/src/sounds/bell.wav";
        this.soundOkEl.preload = "auto";
        document.body.appendChild(this.soundOkEl);

        this.soundKoEl = document.createElement("audio");
        this.soundKoEl.src = "/stock_barcodes/static/src/sounds/error.wav";
        this.soundKoEl.preload = "auto";
        document.body.appendChild(this.soundKoEl);


        return () => {
            // On se désabonne pour éviter les écouteurs multiples
            busService.unsubscribe("stock_barcodes_scan", handleBusNotification);
            this.soundOkEl.remove();
            this.soundKoEl.remove();
        };
    });
}

const useBarcodeHotkeys = () => {
    const actionService = useService("action");
    const hotkeyService = useService("hotkey");

    const openMainMenu = async () => {
        await actionService.doAction(
            "stock_barcodes.action_stock_barcodes_action_client",
            {
                name: "Barcode wizard menu",
                res_model: "wiz.stock.barcodes.read.picking",
                type: "ir.actions.act_window",
            }
        );
    };
    useHotkey("alt+h", () => hotkeyService.toggleOption("showHotkeys"));

    useHotkey("alt+c", () => {
        const button = document.querySelector("button[name='action_clean_values']");
        if (isVisible(button)) {
            button.click();
        }
    });
    useHotkey("alt+m", openMainMenu);
};

patch(KanbanController.prototype, {
    setup() {
        super.setup();
        if (isAllowedBarcodeModel(this.props.resModel)) {
            setupView.call(this);
            useBarcodeHotkeys();
        }
    },
});

patch(FormController.prototype, {
    setup() {
        super.setup();
        if (isAllowedBarcodeModel(this.props.resModel)) {
            setupView.call(this);
            useBarcodeHotkeys();
        }
    },
});

patch(ListController.prototype, {
    setup() {
        super.setup();
        if (isAllowedBarcodeModel(this.props.resModel)) {
            setupView.call(this);
            useBarcodeHotkeys();
        }
    },
});
