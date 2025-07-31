/** @odoo-module */
/* Copyright 2022 Tecnativa - Alexandre D. Díaz
 * License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl). */

import {KanbanRecord} from "@web/views/kanban/kanban_record";
import {patch} from "@web/core/utils/patch";

patch(KanbanRecord.prototype, {
    async onGlobalClick(ev) {
        const recordBarcode = document.querySelector('div[name="inventory_quant_ids"]');
        if (recordBarcode) {
            const record = this.props.record;
            document.querySelectorAll("div.oe_kanban_operations").forEach((el) => {
                el.classList.add("d-none");
            });
            document
                .querySelector("div.oe_kanban_operations-" + record.data.id)
                ?.classList.remove("d-none");
        }
        super.onGlobalClick(ev);
    },
});
