const { Router } = require("express");
const {
  createNewFast,
  GetSingleFast,
  getFasts,
} = require("./../controllers/fast.controller");
const { requireAuth } = require("../middlewares/auth.middleware");


const router = Router();

router.route("/").post(createNewFast).get(getFasts);
router.route("/:id").get(GetSingleFast);


module.exports = router;
