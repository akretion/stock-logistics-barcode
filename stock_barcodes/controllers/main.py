# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import http
from odoo.http import request


class BarcodeCOntroller(http.Controller):
    @http.route("/stock_barcodes/barcode_scanned", type="json", auth="public")
    def scan_barcode(self, model, _id, barcode):
        return request.env[model].browse(_id).dummy_on_barcode_scanned(barcode)
