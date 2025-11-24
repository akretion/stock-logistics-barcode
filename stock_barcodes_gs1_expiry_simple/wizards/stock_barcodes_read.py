# Copyright 2024 Akretion France (https://www.akretion.com/)
# @author: Alexis de Lattre <alexis.delattre@akretion.com>
# License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

from datetime import timedelta

from odoo import _, fields, models
from odoo.tools.misc import format_date


class WizStockBarcodesRead(models.AbstractModel):
    _inherit = "wiz.stock.barcodes.read"

    expiry_date = fields.Date(readonly=True)
    product_use_expiry_date = fields.Boolean(related="product_id.use_expiry_date")

    def _process_ai_17(self, gs1_list):
        self.expiry_date = self.barcode
        return True

    def _prepare_lot_vals(self):
        vals = super()._prepare_lot_vals()
        if self.expiry_date:
            vals["expiry_date"] = self.expiry_date
        return vals

    def action_clean_lot(self):
        self.expiry_date = False
        return super().action_clean_lot()

    def check_done_conditions(self):
        res = super().check_done_conditions()
        if (
            self.picking_id
            and self.picking_id.picking_type_id.min_expiry_raise
            and self.todo_line_id.stock_move_ids[0].product_expiry_min_days
            and self.product_use_expiry_date
        ):
            today = fields.Date.context_today(self)
            limit_date = today + timedelta(
                self.todo_line_id.stock_move_ids[0].product_expiry_min_days
            )
            if self.expiry_date < limit_date:
                self._set_messagge_info(
                    "more_match",
                    _(
                        "Picking %(picking)s: you cannot select lot %(lot)s "
                        "for product '%(product)s' because the stock move is "
                        "configured with a minimum expiry delay of "
                        "%(min_expiry_days)s days, so the minimum expiry date "
                        "is %(min_expiry_date)s.",
                        lot=self.todo_line_id.lot_id.display_name,
                        product=self.todo_line_id.product_id.display_name,
                        min_expiry_days=self.todo_line_id.stock_move_ids[
                            0
                        ].product_expiry_min_days,
                        min_expiry_date=format_date(self.env, limit_date),
                        picking=self.picking_id.display_name,
                    ),
                    notification=True,
                )
                return False
        if (
            self.product_use_expiry_date
            and self.expiry_date
            and self.lot_id.expiry_date != self.expiry_date
        ):
            self._set_messagge_info(
                "more_match",
                _(
                    "Expiry date mismatch for lot %(lot)s of product %(product)s: "
                    "barcode has %(barcode_expiry_date)s whereas lot has "
                    "%(lot_expiry_date)s",
                    lot=self.lot_id.name,
                    product=self.product_id.display_name,
                    barcode_expiry_date=format_date(self.env, self.expiry_date),
                    lot_expiry_date=format_date(self.env, self.lot_id.expiry_date),
                ),
                notification=True,
            )
            return False
        return res
