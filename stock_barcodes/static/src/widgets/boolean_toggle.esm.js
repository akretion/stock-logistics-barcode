/** @odoo-module **/
import {BooleanToggleField} from "@web/views/fields/boolean_toggle/boolean_toggle_field";
import {onMounted} from "@odoo/owl";
import {registry} from "@web/core/registry";
import {useBus} from "@web/core/utils/hooks";

export class BarcodeBooleanToggle extends BooleanToggleField {
    setup() {
        super.setup();

        onMounted(() => {
            this.enableFormEdit(this.props.value, true);
        });

        useBus(this.env.bus, "enableFormEditBarcode", () => {
            this.enableFormEdit(true, true);
        });
        useBus(this.env.bus, "disableFormEditBarcode", () => {
            this.enableFormEdit(false, true);
        });
    }

    /*
  This is needed because, whenever we click the checkbox to enter data
  manually, the checkbox will be focused causing that when we scan the
  barcode afterwards, it will not perform the python on_barcode_scanned
  function.
  */
    onChange(newValue) {
        super.onChange(newValue);
        // We can't blur an element on its onchange event
        // we need to wait for the event to finish (thus
        // requestIdleCallback)
        requestIdleCallback(() => {
            document.activeElement.blur();
        });
        this.enableFormEdit(newValue);
    }

    enableFormEdit(newValue, editAction = false) {
        // Enable edit form
        if (this.props.name === "manual_entry" || editAction) {
            const form_edit = document.querySelector(
                "div.oe_stock_barcordes_content > div.scan_fields"
            );
            const div_inventory_quant_ids = document.querySelector(
                "div[name='inventory_quant_ids'] div.o_kanban_renderer"
            );
            if (form_edit) {
                if (newValue) {
                    form_edit.classList.remove("d-none");
                    if (div_inventory_quant_ids) {
                        div_inventory_quant_ids.classList.add(
                            "inventory_quant_ids_with_form"
                        );
                        div_inventory_quant_ids.classList.remove(
                            "inventory_quant_ids_without_form"
                        );
                    }
                } else {
                    form_edit.classList.add("d-none");
                    if (div_inventory_quant_ids) {
                        div_inventory_quant_ids.classList.remove(
                            "inventory_quant_ids_with_form"
                        );
                        div_inventory_quant_ids.classList.add(
                            "inventory_quant_ids_without_form"
                        );
                    }
                }
            } else if (div_inventory_quant_ids) {
                div_inventory_quant_ids.classList.add(
                    "inventory_quant_ids_without_form"
                );
            }
        }
    }
}

const booleanToggle = {
    displayName: "",
    component: BarcodeBooleanToggle,
    supportedTypes: [""],
    extractProps: ({attrs}) => ({
        name: attrs.name,
    }),
};

registry.category("fields").add("barcode_boolean_toggle", booleanToggle);
