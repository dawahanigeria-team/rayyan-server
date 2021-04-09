const { Router } = require("express");
const {createNewFast} = require('./../controllers/fast.controller')


const router = Router();

router.route("/").post(createNewFast)


module.exports = router;
