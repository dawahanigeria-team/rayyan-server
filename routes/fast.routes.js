const { Router } = require("express");
const {
  createNewFast,
  GetSingleFast,
} = require("./../controllers/fast.controller");


const router = Router();

router.route("/").post(createNewFast)
router.route("/:id").get(GetSingleFast);


module.exports = router;
