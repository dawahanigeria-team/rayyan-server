const { Router } = require("express");
const {
  createNewFast,
  GetSingleFast,
  getFasts,
  getMissedFasts,
  updateSingleFast,
} = require("./../controllers/fast.controller");
const { requireAuth } = require("../middlewares/auth.middleware");


const router = Router();

router.route("/").post(createNewFast).get(getFasts);
router.route("/missedfast").get(getMissedFasts)
router.route("/:id").get(GetSingleFast).put(updateSingleFast);


module.exports = router;
