const { Router } = require("express");
const {
  createNewFast,
  GetSingleFast,
} = require("./../controllers/fast.controller");
const { requireAuth } = require("../middlewares/auth.middleware");


const router = Router();

router.route("/").post(requireAuth, createNewFast);
router.route("/:id").get(GetSingleFast);


module.exports = router;
