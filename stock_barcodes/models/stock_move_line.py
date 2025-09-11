# Copyright 2019 Sergio Teruel <sergio.teruel@tecnativa.com>
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
from odoo import api, fields, models


class StockMoveLine(models.Model):
    _inherit = "stock.move.line"

    barcode_scan_state = fields.Selection(
        [("pending", "Pending"), ("done", "Done"), ("done_forced", "Done forced")],
        string="Scan State",
        default="pending",
        compute="_compute_barcode_scan_state",
        readonly=False,
        store=True,
    )
    qty_done = fields.Float(compute="_compute_qty_done", store=True)

    def _merge_sml(self):
        self.ensure_one()
        key = (
            self.location_id,
            self.lot_id.id,
            self.package_id.id,
            self.owner_id.id,
            self.picked,
        )
        to_unlink = self.env["stock.move.line"]
        for ml in self.move_id.move_line_ids:
            if ml == self:
                continue
            ml_key = (
                ml.location_id,
                ml.lot_id.id,
                ml.package_id.id,
                ml.owner_id.id,
                ml.picked,
            )
            if key == ml_key:
                to_unlink |= ml
                self.write({"quantity": self.quantity + ml.quantity})
        to_unlink.unlink()

    @api.depends("picked", "quantity")
    def _compute_qty_done(self):
        for line in self:
            line.qty_done = line.quantity if line.picked else 0

    @api.depends("qty_done", "quantity_product_uom")
    def _compute_barcode_scan_state(self):
        for line in self:
            if line.qty_done >= line.quantity_product_uom:
                line.barcode_scan_state = "done"
            else:
                line.barcode_scan_state = "pending"

    def _barcodes_process_line_to_unlink(self):
        self.qty_done = 0.0

    def action_barcode_detailed_operation_unlink(self):
        for sml in self:
            stock_move = sml.move_id
            stock_move.barcode_backorder_action = "pending"
            sml.unlink()
            # HACK: To force refresh wizard values
            wiz_barcode = self.env["wiz.stock.barcodes.read.picking"].browse(
                self.env.context.get("wiz_barcode_id", False)
            )
            stock_move._action_assign()
            wiz_barcode.fill_todo_records()
            wiz_barcode.determine_todo_action()
