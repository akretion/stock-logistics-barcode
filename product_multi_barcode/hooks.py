# © 2015 Roberto Lizana (Trey)
# © 2016 Pedro M. Baeza
# © 2018 Xavier Jimenez (QubiQ)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

import logging

_logger = logging.getLogger(__name__)

try:
    from openupgradelib import openupgrade
except (ImportError, IOError) as err:
    _logger.debug(err)


def pre_init_hook(cr):
    cr.execute(
        """
    SELECT name
    FROM ir_module_module
    WHERE name = 'product_multi_ean'"""
    )
    row = cr.fetchone()
    if row:
        # import pdb; pdb.set_trace();
        openupgrade.update_module_names(
            cr,
            [("product_multi_ean", "product_multi_barcode")],
            merge_modules=True,
        )


def post_init_hook(cr, registry):
    cr.execute("select name,model from ir_model where model = 'product.ean13';")
    row = cr.fetchone()
    if row:
        cr.execute(
            """
        INSERT INTO product_barcode
        (product_id, name, sequence)
        SELECT ean13.product_id, ean13.name, ean13.sequence
        FROM product_ean13 ean13
            """
        )
        cr.execute(
            """
            DROP TABLE product_ean13
            """
        )

    else:
        cr.execute(
            """
        INSERT INTO product_barcode
        (product_id, name, sequence)
        SELECT id, barcode, 0
        FROM product_product
        WHERE barcode IS NOT NULL"""
        )
