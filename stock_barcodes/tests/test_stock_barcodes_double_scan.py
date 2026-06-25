from odoo.tests.common import tagged

from .common import TestCommonStockBarcodes


@tagged("post_install", "-at_install")
class TestBarcodeDoubleScan(TestCommonStockBarcodes):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.option_group.pick_in_child_location = True
        cls.option_group.show_pending_moves = True
        cls.quant = cls.StockQuant.create(
            {
                "product_id": cls.product_wo_tracking.id,
                "location_id": cls.location_1.id,
                "quantity": 10.0,
            }
        )

    def test_qty_available_without_pending_move_line(self):
        """A product whose demand is already satisfied has no pending move line."""
        wiz = self.WizScanReadPicking.create(
            {"option_group_id": self.option_group.id, "step": 1}
        )
        wiz.location_id = self.location_1
        wiz.product_id = self.product_wo_tracking

        self.assertTrue(self.option_group.pick_in_child_location)
        self.assertFalse(
            wiz.pending_move_ids.line_ids.filtered(
                lambda line: line.product_id == self.product_wo_tracking
            )
        )
        self.assertEqual(wiz.location_id.usage, "internal")
        self.assertEqual(wiz.qty_available, 10.0)
