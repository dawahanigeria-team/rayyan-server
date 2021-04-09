const { Router } = require("express");
const {createNewFast} = require('./../controllers/fast.controller')


const router = Router();

router.get("/", createNewFast)


module.exports = router;
